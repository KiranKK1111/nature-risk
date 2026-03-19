import L from "leaflet";
import { client } from "../../services/axiosClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { getCachedJSON, setCachedJSON, getCachedBlob, setCachedBlob } from "../../services/indexedDBCache";

interface TileManifest {
  filename: string;
  url: string;
  bbox: [number, number, number, number];
}

interface PrecomputedTile {
  info: TileManifest;
  bounds: L.LatLngBounds;
  key: string;
}

export interface GlobioGridLayerOptions {
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

// Simple caches shared across instances
const manifestCache: { [key: string]: TileManifest[] } = {};
const imageBlobCache: { [url: string]: string } = {};

/**
 * GlobioGridLayer
 * A Leaflet LayerGroup that displays Globio PNG tiles with viewport culling.
 *
 * Only loads/renders tiles visible in the current viewport.
 * Tiles are fetched via the API client as blobs and cached.
 */
export class GlobioGridLayer extends L.LayerGroup {
  private maxConcurrentLoads = 6;
  private precomputed: PrecomputedTile[] = [];
  private activeTiles: Map<string, L.ImageOverlay> = new Map();
  private loadingTiles: Set<string> = new Set();
  private map?: L.Map;
  private onTileLoad?: (loaded: number) => void;
  private onTileTotal?: (total: number) => void;
  private loadedCount = 0;
  private totalVisible = 0;
  private loadGeneration = 0;
  private updateScheduled = false;

  constructor(
    private manifestPath: string,
    options?: GlobioGridLayerOptions
  ) {
    super();
    if (options) {
      this.onTileLoad = options.onTileLoad;
      this.onTileTotal = options.onTileTotal;
    }
  }

  /** Change the manifest path and reload tiles. */
  async switchManifest(newPath: string): Promise<void> {
    this.manifestPath = newPath;
    // Clear current tiles from map
    this.loadGeneration++;
    if (this.map) {
      this.activeTiles.forEach((overlay) => this.map!.removeLayer(overlay));
    }
    this.activeTiles.clear();
    this.loadingTiles.clear();
    this.precomputed = [];
    await this.loadManifest();
  }

  /** Load manifest and precompute bounds. Call before or after adding to map. */
  async loadManifest(): Promise<void> {
    let tiles: TileManifest[];
    if (manifestCache[this.manifestPath]) {
      tiles = manifestCache[this.manifestPath];
    } else {
      try {
        // Check IndexedDB first
        const cached = await getCachedJSON<TileManifest[]>(`manifest:${this.manifestPath}`);
        if (cached) {
          tiles = cached;
        } else {
          const resp = await client.get(
            `${API_ENDPOINTS.GET_MANIFEST}?path=${this.manifestPath}`
          );
          tiles = resp.data;
          setCachedJSON(`manifest:${this.manifestPath}`, tiles);
        }
        manifestCache[this.manifestPath] = tiles;
      } catch (e) {
        console.log("Error loading Globio manifest:", e);
        tiles = [];
      }
    }

    this.precomputed = [];
    for (const tile of tiles) {
      if (!tile.bbox) continue;
      const bounds = this.bboxToBounds(tile.bbox);
      this.precomputed.push({
        info: tile,
        bounds,
        key: tile.filename,
      });
    }

    // Trigger initial tile load if already on map
    if (this.map) {
      this.scheduleUpdate();
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
    this.activeTiles.forEach((overlay) => {
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
    const padded = this.map.getBounds().pad(0.3);

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

    // Remove off-screen tiles
    const keysToRemove: string[] = [];
    this.activeTiles.forEach((overlay, key) => {
      if (!visibleKeys.has(key)) {
        this.map!.removeLayer(overlay);
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach((key) => this.activeTiles.delete(key));

    // Cancel loading for tiles no longer needed
    const loadingToRemove: string[] = [];
    this.loadingTiles.forEach((key) => {
      if (!visibleKeys.has(key)) loadingToRemove.push(key);
    });
    loadingToRemove.forEach((key) => this.loadingTiles.delete(key));

    // Progress
    this.totalVisible = visibleKeys.size;
    this.loadedCount = this.activeTiles.size;
    if (this.onTileTotal) this.onTileTotal(this.totalVisible);
    if (this.onTileLoad) this.onTileLoad(this.loadedCount);

    if (toLoad.length === 0) return;

    // Load center tiles first
    const center = this.map.getCenter();
    toLoad.sort((a, b) => {
      return a.bounds.getCenter().distanceTo(center) - b.bounds.getCenter().distanceTo(center);
    });

    for (const tile of toLoad) {
      this.loadingTiles.add(tile.key);
    }

    const queue = [...toLoad];

    const loadNext = async () => {
      while (queue.length > 0) {
        if (generation !== this.loadGeneration) return;
        const tile = queue.shift()!;
        if (!this.loadingTiles.has(tile.key)) continue;

        try {
          let objectUrl = imageBlobCache[tile.info.url];
          if (!objectUrl) {
            // Check IndexedDB for persisted blob
            const cachedBlob = await getCachedBlob(`png:${tile.info.url}`);
            if (cachedBlob) {
              objectUrl = URL.createObjectURL(cachedBlob);
            } else {
              const resp = await client.get(
                `${API_ENDPOINTS.GET_PNG}?path=${tile.info.url}`,
                { responseType: "blob" }
              );
              objectUrl = URL.createObjectURL(resp.data);
              setCachedBlob(`png:${tile.info.url}`, resp.data);
            }
            imageBlobCache[tile.info.url] = objectUrl;
          }

          if (generation !== this.loadGeneration) return;
          if (!this.loadingTiles.has(tile.key)) continue;
          if (!this.map) return;

          const overlay = L.imageOverlay(objectUrl, tile.bounds, {
            opacity: 1,
            interactive: false,
            className: "nc-rect",
          });
          overlay.addTo(this.map);
          this.activeTiles.set(tile.key, overlay);
        } catch {
          // skip failed tile
        } finally {
          this.loadingTiles.delete(tile.key);
          this.loadedCount = this.activeTiles.size;
          if (this.onTileLoad) this.onTileLoad(this.loadedCount);
        }
      }
    };

    const workers = Math.min(this.maxConcurrentLoads, toLoad.length);
    for (let i = 0; i < workers; i++) {
      loadNext();
    }
  }

  /** Convert bbox to Leaflet LatLngBounds, detecting coordinate system automatically.
   *  - EPSG:3857 (meters): values are large (abs > 360), order is [minX, minY, maxX, maxY]
   *  - EPSG:4326 (degrees): values are small (abs <= 360), order is [south, north, west, east]
   */
  private bboxToBounds(bbox: [number, number, number, number]): L.LatLngBounds {
    const isMeters = Math.abs(bbox[0]) > 360 || Math.abs(bbox[1]) > 360 ||
                     Math.abs(bbox[2]) > 360 || Math.abs(bbox[3]) > 360;

    if (isMeters) {
      // EPSG:3857 [minX, minY, maxX, maxY] in meters
      const R = 6378137;
      const [minX, minY, maxX, maxY] = bbox;
      const west = (minX / R) * (180 / Math.PI);
      const east = (maxX / R) * (180 / Math.PI);
      const south = (2 * Math.atan(Math.exp(minY / R)) - Math.PI / 2) * (180 / Math.PI);
      const north = (2 * Math.atan(Math.exp(maxY / R)) - Math.PI / 2) * (180 / Math.PI);
      return L.latLngBounds([south, west], [north, east]);
    }

    // EPSG:4326 [south, north, west, east] in degrees
    const [south, north, west, east] = bbox;
    return L.latLngBounds([south, west], [north, east]);
  }
}
