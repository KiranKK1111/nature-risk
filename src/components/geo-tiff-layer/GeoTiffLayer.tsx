import L from "leaflet";
import { GeoTIFFCache } from "./GeoTIFFCache";
import { createColorLUT } from "./ForestLossColors";
import { TileSpatialIndex } from "./TileManager";

interface QueuedTile {
  ctx: CanvasRenderingContext2D;
  coords: L.Coords;
  tileSize: L.Point;
  done: L.DoneCallback;
}

// Custom GeoTIFF tile layer with dynamic loading and PNG cache
export class GeoTiffLayer extends L.GridLayer {
  private maxConcurrentLoads: number = 8;
  private currentLoads: number = 0;
  private cache: GeoTIFFCache;
  private colorLUT: Uint8ClampedArray;
  private loadingTiles: Set<string> = new Set();
  private loadedTileCount: number = 0;
  private tileIndex: TileSpatialIndex;
  private tileImageCache: Map<string, ImageBitmap> = new Map();
  private tileQueue: QueuedTile[] = [];

  constructor(tileIndex: TileSpatialIndex, options: any) {
    super(options);
    this.tileIndex = tileIndex;
    this.cache = new GeoTIFFCache(200); // 200MB cache
    this.colorLUT = createColorLUT();
  }

  createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement("canvas");
    const tileSize = this.getTileSize();
    tile.width = tileSize.x;
    tile.height = tileSize.y;

    const ctx = tile.getContext("2d");
    if (!ctx) {
      done(new Error("Could not get canvas context"), tile);
      return tile;
    }
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Enqueue tile for loading instead of direct recursive setTimeout
    this.tileQueue.push({ ctx, coords, tileSize, done });
    this.processQueue();

    return tile;
  }

  private processQueue(): void {
    while (this.currentLoads < this.maxConcurrentLoads && this.tileQueue.length > 0) {
      const next = this.tileQueue.shift()!;
      this.currentLoads++;
      this.loadAndRenderTile(next.ctx, next.coords, next.tileSize, next.done);
    }
  }

  private async loadAndRenderTile(
    ctx: CanvasRenderingContext2D,
    coords: L.Coords,
    tileSize: L.Point,
    done: L.DoneCallback
  ): Promise<void> {
    try {
      // Convert tile coordinates to geographic bounds
      const bounds = this.getTileBounds(coords);

      // Get center point of tile
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;

      // Find the appropriate GeoTIFF tile from our index
      const tile = this.tileIndex.getTile(centerLat, centerLng);

      if (!tile) {
        // No data for this area, render transparent
        done(undefined, ctx.canvas);
        return;
      }

      const tileKey = `${coords.z}/${coords.x}/${coords.y}`;

      if (this.loadingTiles.has(tileKey)) {
        done(undefined, ctx.canvas);
        return;
      }

      this.loadingTiles.add(tileKey);

      const url = tile.url;

      if (url.toLowerCase().endsWith(".png")) {
        try {
          let bitmap: ImageBitmap | undefined = this.tileImageCache.get(url);
          if (!bitmap) {
            const response = await fetch(url);
            const blob = await response.blob();
            bitmap = await createImageBitmap(blob);
            this.tileImageCache.set(url, bitmap);
          }

          // Set canvas size to match tile size (Leaflet expects this)
          ctx.canvas.width = tileSize.x;
          ctx.canvas.height = tileSize.y;

          if (tile.bbox) {
            // tile.bbox = [west, north, east, south]
            const [tileWest, tileNorth, tileEast, tileSouth] = tile.bbox;

            // Calculate overlap between map tile and PNG's bbox
            const overlapWest = Math.max(bounds.west, tileWest);
            const overlapEast = Math.min(bounds.east, tileEast);
            const overlapNorth = Math.min(bounds.north, tileNorth);
            const overlapSouth = Math.max(bounds.south, tileSouth);

            if (overlapWest >= overlapEast || overlapSouth >= overlapNorth) {
              // No overlap
              this.loadingTiles.delete(tileKey);
              done(undefined, ctx.canvas);
              return;
            }

            // Compute how much of the PNG to draw
            const pngWidth = bitmap.width;
            const pngHeight = bitmap.height;
            const pngGeoWidth = tileEast - tileWest;
            const pngGeoHeight = tileNorth - tileSouth;

            // Source crop from PNG (pixels)
            const sx = ((overlapWest - tileWest) / pngGeoWidth) * pngWidth;
            const sy = ((tileNorth - overlapNorth) / pngGeoHeight) * pngHeight;
            const sWidth = ((overlapEast - overlapWest) / pngGeoWidth) * pngWidth;
            const sHeight = ((overlapNorth - overlapSouth) / pngGeoHeight) * pngHeight;

            // Destination placement on Leaflet tile canvas
            const destX = ((overlapWest - bounds.west) / (bounds.east - bounds.west)) * tileSize.x;
            const destY = ((bounds.north - overlapNorth) / (bounds.north - bounds.south)) * tileSize.y;
            const destWidth = ((overlapEast - overlapWest) / (bounds.east - bounds.west)) * tileSize.x;
            const destHeight = ((overlapNorth - overlapSouth) / (bounds.north - bounds.south)) * tileSize.y;

            // Avoid upscaling small crops to large canvas areas
            if (sWidth < destWidth || sHeight < destHeight) {
              // Center the image crop in the destination area
              const offsetX = destX + (destWidth - sWidth) / 2;
              const offsetY = destY + (destHeight - sHeight) / 2;
              ctx.clearRect(destX, destY, destWidth, destHeight); // Fill with transparency
              ctx.drawImage(
                bitmap,
                sx, sy, sWidth, sHeight,
                offsetX, offsetY, sWidth, sHeight
              );
            } else {
              ctx.drawImage(
                bitmap,
                sx, sy, sWidth, sHeight,
                destX, destY, destWidth, destHeight
              );
            }
          } else {
            // Fallback (no bbox)
            ctx.drawImage(bitmap, 0, 0, tileSize.x, tileSize.y);
          }

          this.loadedTileCount++;
          this.loadingTiles.delete(tileKey);
          done(undefined, ctx.canvas);
        } catch (err) {
          this.loadingTiles.delete(tileKey);
          done(undefined, ctx.canvas);
        }
        return;
      }

      // Otherwise, fall back to GeoTIFF loading
      const tiff = await this.cache.loadTiff(url);
      if (!tiff || typeof (tiff as any).getImage !== "function") {
        this.loadingTiles.delete(tileKey);
        done(undefined, ctx.canvas);
        return;
      }

      // Get the image (first image in the GeoTIFF)
      const image = await (tiff as any).getImage();

      // Get the bounding box of the GeoTIFF
      const bbox = image.getBoundingBox();

      // Calculate the pixel coordinates within the GeoTIFF
      const geoWidth = bbox[2] - bbox[0];
      const geoHeight = bbox[3] - bbox[1];

      // Map tile bounds to GeoTIFF pixel coordinates
      const pixelXStart = Math.floor(((bounds.west - bbox[0]) / geoWidth) * image.getWidth());
      const pixelYStart = Math.floor(((bbox[3] - bounds.north) / geoHeight) * image.getHeight());
      const pixelXEnd = Math.ceil(((bounds.east - bbox[0]) / geoWidth) * image.getWidth());
      const pixelYEnd = Math.ceil(((bbox[3] - bounds.south) / geoHeight) * image.getHeight());

      // Clamp to image bounds
      const clampedXStart = Math.max(0, Math.min(pixelXStart, image.getWidth() - 1));
      const clampedYStart = Math.max(0, Math.min(pixelYStart, image.getHeight() - 1));
      const clampedXEnd = Math.max(0, Math.min(pixelXEnd, image.getWidth()));
      const clampedYEnd = Math.max(0, Math.min(pixelYEnd, image.getHeight()));

      const clampedWidth = clampedXEnd - clampedXStart;
      const clampedHeight = clampedYEnd - clampedYStart;

      if (clampedWidth <= 0 || clampedHeight <= 0) {
        // No overlap with GeoTIFF
        this.loadingTiles.delete(tileKey);
        done(undefined, ctx.canvas);
        return;
      }

      // Read the raster data for this window
      const rasterData = await image.readRasters({
        window: [clampedXStart, clampedYStart, clampedXEnd, clampedYEnd],
        width: Math.min(tileSize.x, clampedWidth),
        height: Math.min(tileSize.y, clampedHeight),
      });

      // Get the first band (loss year data)
      const lossYearData = rasterData[0] as any;

      // Create image data for the canvas
      const imageData = ctx.createImageData(tileSize.x, tileSize.y);

      // Map GeoTIFF pixels to canvas pixels using the color LUT
      for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {
          const canvasIdx = (y * imageData.width + x) * 4;

          // Calculate corresponding position in raster data
          const rasterX = Math.floor((x / tileSize.x) * rasterData.width);
          const rasterY = Math.floor((y / tileSize.y) * rasterData.height);
          const rasterIdx = rasterY * rasterData.width + rasterX;

          if (rasterIdx >= 0 && rasterIdx < lossYearData.length) {
            const value = lossYearData[rasterIdx];
            const lutIdx = Math.min(255, Math.max(0, Math.floor(value))) * 4;

            imageData.data[canvasIdx] = this.colorLUT[lutIdx];
            imageData.data[canvasIdx + 1] = this.colorLUT[lutIdx + 1];
            imageData.data[canvasIdx + 2] = this.colorLUT[lutIdx + 2];
            imageData.data[canvasIdx + 3] = this.colorLUT[lutIdx + 3];
          } else {
            // Transparent
            imageData.data[canvasIdx + 3] = 0;
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      this.loadedTileCount++;
      this.loadingTiles.delete(tileKey);
      done(undefined, ctx.canvas);
    } catch (error) {
      this.loadingTiles.delete(`${coords.z}/${coords.x}/${coords.y}`);
      done(error as Error, ctx.canvas);
    } finally {
      this.currentLoads--;
      this.processQueue();
    }
  }

  private getTileBounds(coords: L.Coords): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    const tileSizeDegrees = 360 / Math.pow(2, coords.z);
    const west = coords.x * tileSizeDegrees - 180;
    const east = west + tileSizeDegrees;

    // Web Mercator projection
    const n = Math.PI - (2 * Math.PI * coords.y) / Math.pow(2, coords.z);
    const north = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    const s = Math.PI - (2 * Math.PI * (coords.y + 1)) / Math.pow(2, coords.z);
    const south = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(s) - Math.exp(-s)));

    return { north, south, east, west };
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  getLoadedTileCount() {
    return this.loadedTileCount;
  }

  clearCache() {
    this.cache.clear();
    this.loadedTileCount = 0;
    this.tileImageCache.clear();
    this.tileQueue = [];
  }
}
