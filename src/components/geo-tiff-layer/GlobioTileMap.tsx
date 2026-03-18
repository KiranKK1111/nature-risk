import * as React from "react";
import { useEffect, useState, useRef } from "react";
// Simple in-memory cache for manifests and blobs
const manifestCache: { [key: string]: any } = {};
const imageBlobCache: { [key: string]: string } = {};
import { ImageOverlay } from "react-leaflet";
import { useSelector } from "react-redux";
import "../../App.css";
import { client } from "../../services/axiosClient";
import { API_ENDPOINTS } from "../../constants/apiEndpoints";

const R = 6378137;

// x (meters) -> lon
function mercatorXToLon(x: number): number {
  return (x / R) * (180 / Math.PI);
}

// y (meters) -> lat
function mercatorYToLat(y: number): number {
  return (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * (180 / Math.PI);
}

function bbox3857ToLeafletBounds(bbox: [number, number, number, number]): [[number, number], [number, number]] {
  const [minX, minY, maxX, maxY] = bbox;
  const west = mercatorXToLon(minX);
  const east = mercatorXToLon(maxX);
  const south = mercatorYToLat(minY);
  const north = mercatorYToLat(maxY);
  return [
    [south, west],
    [north, east],
  ];
}

interface TileManifest {
  filename: string;
  url: string;
  bbox: [number, number, number, number];
}

interface GlobioTileMapProps {
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

export default function GlobioTileMap({ onTileLoad, onTileTotal }: GlobioTileMapProps) {
  const [msaTiles, setMsaTiles] = useState<TileManifest[]>([]);
  const [landUseTiles, setLandUseTiles] = useState<TileManifest[]>([]);
  const [msaTileUrls, setMsaTileUrls] = useState<{ [filename: string]: string }>({});
  const [landUseTileUrls, setLandUseTileUrls] = useState<{ [filename: string]: string }>({});

  const layers = useSelector((state: any) => state.geoJson.layers);

  const OVERLAY_BOUNDS: [[number, number], [number, number]] = [
    [-85.04, -179.99],
    [85.04, 179.99],
  ];

  // Track progress
  const totalTiles = React.useRef(0);
  const loadedTiles = React.useRef(0);

  // Fetch tiles for each layer when it becomes visible
  const fetchMsaTiles = React.useCallback(async () => {
    loadedTiles.current = 0;
    const msaOption = layers.show_MSA_Layer?.selectedOption || 'SSP1';
    const msaManifestKey = `msa_${msaOption}`;
    let msaData;
    if (manifestCache[msaManifestKey]) {
      msaData = manifestCache[msaManifestKey];
    } else {
      try {
        const msaResp = await client.get(`${API_ENDPOINTS.GET_MANIFEST}?path=globio/msa_pngs/${msaOption}/tile_manifest.json`);
        msaData = msaResp.data;
        manifestCache[msaManifestKey] = msaData;
      } catch (e) {
        console.log("Error loading MSA tiles:", e);
        msaData = [];
      }
    }
    setMsaTiles(msaData);
    totalTiles.current = msaData.length + (layers.show_Land_Use_Layer?.visible ? landUseTiles.length : 0);
    if (onTileTotal) onTileTotal(totalTiles.current);
    const msaUrlMap: { [filename: string]: string } = {};
    await Promise.all(
      msaData.map(async (tile: TileManifest) => {
        if (imageBlobCache[tile.url]) {
          msaUrlMap[tile.filename] = imageBlobCache[tile.url];
          loadedTiles.current++;
          if (onTileLoad) onTileLoad(loadedTiles.current);
          return;
        }
        try {
          const imgResp = await client.get(
            `${API_ENDPOINTS.GET_PNG}?path=${tile.url}`,
            { responseType: 'blob' }
          );
          const objectUrl = URL.createObjectURL(imgResp.data);
          imageBlobCache[tile.url] = objectUrl;
          msaUrlMap[tile.filename] = objectUrl;
        } catch (err) {
          console.log(`Error loading MSA image for ${tile.filename}:`, err);
        } finally {
          loadedTiles.current++;
          if (onTileLoad) onTileLoad(loadedTiles.current);
        }
      })
    );
    setMsaTileUrls(msaUrlMap);
  }, [layers.show_MSA_Layer, layers.show_Land_Use_Layer, landUseTiles.length, onTileLoad, onTileTotal]);

  const fetchLandUseTiles = React.useCallback(async () => {
    loadedTiles.current = 0;
    const landUseOption = layers.show_Land_Use_Layer?.selectedOption || '1992';
    const landUseManifestKey = `landuse_${landUseOption}`;
    let landUseData;
    if (manifestCache[landUseManifestKey]) {
      landUseData = manifestCache[landUseManifestKey];
    } else {
      try {
        const landUseResp = await client.get(`${API_ENDPOINTS.GET_MANIFEST}?path=globio/lu_pngs/${landUseOption}/tile_manifest.json`);
        landUseData = landUseResp.data;
        manifestCache[landUseManifestKey] = landUseData;
      } catch (e) {
        console.log("Error loading Land Use tiles:", e);
        landUseData = [];
      }
    }
    setLandUseTiles(landUseData);
    totalTiles.current = landUseData.length + (layers.show_MSA_Layer?.visible ? msaTiles.length : 0);
    if (onTileTotal) onTileTotal(totalTiles.current);
    const urlMap: { [filename: string]: string } = {};
    await Promise.all(
      landUseData.map(async (tile: TileManifest) => {
        if (imageBlobCache[tile.url]) {
          urlMap[tile.filename] = imageBlobCache[tile.url];
          loadedTiles.current++;
          if (onTileLoad) onTileLoad(loadedTiles.current);
          return;
        }
        try {
          const imgResp = await client.get(
            `${API_ENDPOINTS.GET_PNG}?path=${tile.url}`,
            { responseType: 'blob' }
          );
          const objectUrl = URL.createObjectURL(imgResp.data);
          imageBlobCache[tile.url] = objectUrl;
          urlMap[tile.filename] = objectUrl;
        } catch (err) {
          console.log(`Error loading image for ${tile.filename}:`, err);
        } finally {
          loadedTiles.current++;
          if (onTileLoad) onTileLoad(loadedTiles.current);
        }
      })
    );
    setLandUseTileUrls(urlMap);
  }, [layers.show_Land_Use_Layer, layers.show_MSA_Layer, msaTiles.length, onTileLoad, onTileTotal]);

  // Fetch MSA tiles when visible
  useEffect(() => {
    if (layers.show_MSA_Layer?.visible) {
      fetchMsaTiles();
    } else {
      setMsaTiles([]);
      setMsaTileUrls({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.show_MSA_Layer?.visible, fetchMsaTiles]);

  // Fetch Land Use tiles when visible
  useEffect(() => {
    if (layers.show_Land_Use_Layer?.visible) {
      fetchLandUseTiles();
    } else {
      setLandUseTiles([]);
      setLandUseTileUrls({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers.show_Land_Use_Layer?.visible, fetchLandUseTiles]);

  return (
    <>
      {layers.show_MSA_Layer?.visible && msaTiles.map((tile) => (
        msaTileUrls[tile.filename] ? (
          <ImageOverlay
            key={tile.filename}
            url={msaTileUrls[tile.filename]}
            bounds={bbox3857ToLeafletBounds(tile.bbox) as any}
            opacity={1}
            className="nc-rect"
          />
        ) : null
      ))}
      {layers.show_Land_Use_Layer?.visible && landUseTiles.map((tile) => (
        landUseTileUrls[tile.filename] ? (
          <ImageOverlay
            key={tile.filename}
            url={landUseTileUrls[tile.filename]}
            bounds={OVERLAY_BOUNDS}
            opacity={1}
            className="nc-rect"
          />
        ) : null
      ))}
    </>
  );
}