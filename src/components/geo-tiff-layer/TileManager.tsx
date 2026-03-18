export interface TileInfo {
  filename: string;
  url: string;
  lat: number;
  lng: number;
  latDir?: 'N' | 'S';
  lngDir?: 'E' | 'W';
  bbox?: [number, number, number, number];
}

export function parseTileFilename(filename: string): TileInfo | null {
  const match = filename.match(/Hansen_GFC-\d{4}-v\d+\.\d+_lossyear_(\d{2})(N|S)_(\d{3})(E|W)\.(tif|png)$/i);

  if (!match) return null;

  const lat = parseInt(match[1]);
  const latDir = match[2].toUpperCase() as 'N' | 'S';
  const lng = parseInt(match[3]);
  const lngDir = match[4].toUpperCase() as 'E' | 'W';

  return {
    filename,
    url: filename,
    lat: latDir === 'S' ? -lat : lat,
    lng: lngDir === 'W' ? -lng : lng,
    latDir,
    lngDir,
    bbox: [
      lngDir === 'W' ? -lng : lng,      // west
      latDir === 'N' ? lat + 10 : -lat, // north
      lngDir === 'W' ? -(lng - 10) : lng + 10, // east
      latDir === 'N' ? lat : -(lat + 10),      // south
    ],
  };
}

export function findTileForCoordinates(lat: number, lng: number, availableTiles: TileInfo[]): TileInfo | null {
  for (const tile of availableTiles) {
    if (!tile.bbox) continue;
    const [west, north, east, south] = tile.bbox;
    if (lng >= west && lng <= east && lat >= south && lat <= north) {
      return tile;
    }
  }
  return null;
}

export function findTilesForBounds(
  bounds: { north: number; south: number; east: number; west: number },
  availableTiles: TileInfo[]
): TileInfo[] {
  return availableTiles.filter(tile => {
    if (!tile.bbox) return false;
    const [west, north, east, south] = tile.bbox;
    return (
      east >= bounds.west &&
      west <= bounds.east &&
      north >= bounds.south &&
      south <= bounds.north
    );
  });
}

export class TileSpatialIndex {
  private tiles: TileInfo[];

  constructor(tiles: TileInfo[]) {
    this.tiles = tiles;
  }

  getTile(lat: number, lng: number): TileInfo | null {
    return findTileForCoordinates(lat, lng, this.tiles);
  }

  getTilesForBounds(bounds: { north: number; south: number; east: number; west: number }): TileInfo[] {
    return findTilesForBounds(bounds, this.tiles);
  }

  getAllTiles(): TileInfo[] {
    return this.tiles;
  }
}
