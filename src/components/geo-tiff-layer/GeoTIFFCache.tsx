import { fromUrl, GeoTIFF } from 'geotiff';

interface CacheEntry {
  tiff: GeoTIFF;
  lastAccessed: number;
  size: number;
}

export class GeoTIFFCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxCacheSize: number;
  private currentCacheSize: number = 0;

  constructor(maxCacheSizeMB: number = 200) {
    this.maxCacheSize = maxCacheSizeMB * 1024 * 1024;
  }

  async loadTiff(url: string) {
    if (url.toLowerCase().endsWith(".png")) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
      img.src = url;
      return promise;
    }

    // Existing GeoTIFF handling
    const tiff = await fromUrl(url);
    const image = await tiff.getImage();
    const rasterData = await image.readRasters();
    return rasterData;
  }

  private evictIfNeeded(requiredSpace: number): void {
    if (this.currentCacheSize + requiredSpace <= this.maxCacheSize) {
      return;
    }

    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].lastAccessed - b[1].lastAccessed
    );

    for (const [url, entry] of entries) {
      if (this.currentCacheSize + requiredSpace <= this.maxCacheSize) {
        break;
      }

      this.cache.delete(url);
      this.currentCacheSize -= entry.size;
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }

  getStats() {
    return {
      entries: this.cache.size,
      sizeMB: Math.round(this.currentCacheSize / (1024 * 1024)),
      maxSizeMB: Math.round(this.maxCacheSize / (1024 * 1024)),
    };
  }
}

export function getTileFilename(lat: number, lng: number): string {
  const latTile = Math.floor(Math.abs(lat) / 10) * 10;
  const lngTile = Math.floor(Math.abs(lng) / 10) * 10;

  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';

  const latStr = String(latTile).padStart(2, '0');
  const lngStr = String(lngTile).padStart(3, '0');

  return `Hansen_GFC-2020-v1.8_lossyear_${latStr}${latDir}_${lngStr}${lngDir}.tif`;
}

export function getTileFilenamesForBounds(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): string[] {
  const filenames = new Set<string>();

  // Iterate through 10-degree grid
  for (let lat = Math.floor(bounds.south / 10) * 10; lat <= bounds.north; lat += 10) {
    for (let lng = Math.floor(bounds.west / 10) * 10; lng <= bounds.east; lng += 10) {
      filenames.add(getTileFilename(lat, lng));
    }
  }

  return Array.from(filenames);
}
