import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { client } from '../../services/axiosClient';
import { getBackendImageUrl } from '../../services/utils';
import { TileInfo } from './TileManager';

export async function loadTileManifest(
  options?: { fallbackToPotential?: boolean }
): Promise<TileInfo[]> {
  try {
    const response = await client.get(`${API_ENDPOINTS.GET_MANIFEST}?path=gfc-png/local_manifest.json`);
    if (response.status !== 200) {
      console.warn(`Failed to load tile manifest (${response.status}): ${response.statusText}`);
      if (!options?.fallbackToPotential) return [];
      console.warn("Falling back to potential filenames.");
    }

    let data: any;

    // Axios automatically parses JSON responses
    try {
      data = response.data;
      
    } catch {
      console.log("Manifest is not valid JSON.");
      return [];
    }

    const tiles: TileInfo[] = [];

    for (const entry of data) {
      if (!entry.url || !entry.bbox) continue;

      const [west, north, east, south] = entry.bbox;
      const centerLat = (north + south) / 2;
      const centerLng = (west + east) / 2;

      tiles.push({
        lat: centerLat,
        lng: centerLng,
        url: getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=${entry.url}`),
        bbox: entry.bbox,
        filename: entry.filename,
      });
    }
    return tiles;
  } catch (error) {
    console.log("Failed to load tile manifest:", error);
    return [];
  }
}

/**
 * Build a simple in-memory tile index
 * This creates a map structure for efficient tile lookup
 */
export function buildTileIndex(tiles: TileInfo[]): Map<string, TileInfo> {
  const index = new Map<string, TileInfo>();
  
  for (const tile of tiles) {
    const key = `${tile.lat},${tile.lng}`;
    index.set(key, tile);
  }
  
  return index;
}
