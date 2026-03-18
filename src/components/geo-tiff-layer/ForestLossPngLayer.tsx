import L from "leaflet";
import type { TileInfo } from "./TileManager";

/**
 * ForestLossPNGLayer
 * A Leaflet LayerGroup that displays georeferenced PNGs (EPSG:3857)
 *
 * Designed for smooth pan/zoom by:
 *  - Keeping on-screen tiles in place (no clear-and-reload)
 *  - Only adding newly visible tiles, removing off-screen ones
 *  - Precomputing LatLngBounds per tile once
 *  - Cancelling in-flight loads on new interactions
 */

export interface ForestLossPNGLayerOptions {
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

interface PrecomputedTile {
  info: TileInfo;
  bounds: L.LatLngBounds;
  key: string;
}

export class ForestLossPNGLayer extends L.LayerGroup {
  private maxConcurrentLoads: number = 6;
  private precomputed: PrecomputedTile[] = [];
  private activeTiles: Map<string, L.ImageOverlay> = new Map();
  private loadingTiles: Set<string> = new Set();
  private map?: L.Map;
  private imageCache: Map<string, string> = new Map(); // url -> objectURL or original url
  private onTileLoad?: (loaded: number) => void;
  private onTileTotal?: (total: number) => void;
  private loadedTiles: number = 0;
  private totalVisible: number = 0;
  private loadGeneration: number = 0;
  private updateScheduled: boolean = false;

  constructor(tiles: TileInfo[], options?: ForestLossPNGLayerOptions) {
    super();
    if (options) {
      this.onTileLoad = options.onTileLoad;
      this.onTileTotal = options.onTileTotal;
    }
    // Precompute LatLngBounds for each tile once
    for (const tile of tiles) {
      if (!tile.bbox) continue;
      const [west, north, east, south] = tile.bbox;
      const sw = this.unproject(L.point(west, south));
      const ne = this.unproject(L.point(east, north));
      this.precomputed.push({
        info: tile,
        bounds: L.latLngBounds(sw, ne),
        key: tile.url,
      });
    }
  }

  onAdd(map: L.Map) {
    this.map = map;
    this.scheduleUpdate();
    map.on("moveend", this.scheduleUpdate, this);
    return this;
  }

  onRemove(map: L.Map) {
    map.off("moveend", this.scheduleUpdate, this);
    this.loadGeneration++;
    // Remove all active overlays
    this.activeTiles.forEach(overlay => {
      map.removeLayer(overlay);
    });
    this.activeTiles.clear();
    this.loadingTiles.clear();
    this.map = undefined;
    return this;
  }

  private scheduleUpdate() {
    if (this.updateScheduled) return;
    this.updateScheduled = true;
    requestAnimationFrame(() => {
      this.updateScheduled = false;
      this.updateTiles();
    });
  }

  private updateTiles() {
    if (!this.map) return;

    const generation = ++this.loadGeneration;
    const mapBounds = this.map.getBounds();

    // Pad the viewport bounds so tiles just outside the view are kept/preloaded
    const padded = mapBounds.pad(0.3);

    // Determine which tiles are visible
    const visibleKeys = new Set<string>();
    const toLoad: PrecomputedTile[] = [];

    for (const tile of this.precomputed) {
      if (padded.intersects(tile.bounds)) {
        visibleKeys.add(tile.key);
        if (!this.activeTiles.has(tile.key) && !this.loadingTiles.has(tile.key)) {
          toLoad.push(tile);
        }
      }
    }

    // Remove tiles no longer visible (with extra padding already applied)
    const keysToRemove: string[] = [];
    this.activeTiles.forEach((overlay, key) => {
      if (!visibleKeys.has(key)) {
        this.map!.removeLayer(overlay);
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => this.activeTiles.delete(key));

    // Cancel loading for tiles no longer needed
    const loadingToRemove: string[] = [];
    this.loadingTiles.forEach(key => {
      if (!visibleKeys.has(key)) {
        loadingToRemove.push(key);
      }
    });
    loadingToRemove.forEach(key => this.loadingTiles.delete(key));

    // Progress reporting
    this.totalVisible = visibleKeys.size;
    this.loadedTiles = this.activeTiles.size;
    if (this.onTileTotal) this.onTileTotal(this.totalVisible);
    if (this.onTileLoad) this.onTileLoad(this.loadedTiles);

    if (toLoad.length === 0) return;

    // Sort: tiles closer to map center load first
    const center = this.map.getCenter();
    toLoad.sort((a, b) => {
      const da = a.bounds.getCenter().distanceTo(center);
      const db = b.bounds.getCenter().distanceTo(center);
      return da - db;
    });

    // Load with concurrency limit using a shared queue
    const queue = [...toLoad];
    for (const tile of toLoad) {
      this.loadingTiles.add(tile.key);
    }

    const loadNext = async () => {
      while (queue.length > 0) {
        if (generation !== this.loadGeneration) return;

        const tile = queue.shift()!;

        // Skip if tile was scrolled out of view while waiting
        if (!this.loadingTiles.has(tile.key)) continue;

        try {
          // Load image into browser cache if not already cached
          if (!this.imageCache.has(tile.key)) {
            const img = new Image();
            img.src = tile.info.url;
            await new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject();
            });
            this.imageCache.set(tile.key, tile.info.url);
          }

          if (generation !== this.loadGeneration) return;
          if (!this.loadingTiles.has(tile.key)) continue;
          if (!this.map) return;

          const overlay = L.imageOverlay(tile.info.url, tile.bounds, {
            opacity: 1,
            interactive: false,
            className: 'png-black-bg',
          });
          overlay.on('add', () => {
            const imgEl = (overlay as any)._image;
            if (imgEl) {
              imgEl.style.imageRendering = 'pixelated';
            }
          });

          overlay.addTo(this.map);
          this.activeTiles.set(tile.key, overlay);
        } catch {
          // Failed to load — skip
        } finally {
          this.loadingTiles.delete(tile.key);
          this.loadedTiles = this.activeTiles.size;
          if (this.onTileLoad) this.onTileLoad(this.loadedTiles);
        }
      }
    };

    const workers = Math.min(this.maxConcurrentLoads, toLoad.length);
    for (let i = 0; i < workers; i++) {
      loadNext();
    }
  }

  /** Convert Web Mercator (EPSG:3857) → lat/lon (EPSG:4326) */
  private unproject(point: L.Point): L.LatLng {
    const d = 180 / Math.PI;
    return L.latLng(
      (Math.atan(Math.exp((point.y * Math.PI) / 20037508.34)) * 2 - Math.PI / 2) * d,
      (point.x / 20037508.34) * 180
    );
  }
}
