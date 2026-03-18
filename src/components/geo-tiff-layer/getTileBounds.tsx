import L from "leaflet";
import { TileInfo } from "./TileManager";

export function getTileBounds(tile: TileInfo): L.LatLngBoundsExpression {
  const south = tile.lat;
  const north = tile.lat + 10;
  const west = tile.lng;
  const east = tile.lng + 10;
  return [[south, west], [north, east]];
}
