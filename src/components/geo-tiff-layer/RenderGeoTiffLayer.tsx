import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import { Box } from "@mui/material";
import { useSelector } from "react-redux";
import { loadTileManifest } from "./FileDiscovery";
import { TileSpatialIndex } from "./TileManager";
import { ForestLossPNGLayer } from "./ForestLossPngLayer";

interface RenderGeoLayerProps {
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

const RenderGeoLayer: React.FC<RenderGeoLayerProps> = ({ onTileLoad, onTileTotal }) => {
  const map = useMap();
  const layers = useSelector((state: any) => state.geoJson.layers);

  // Use refs to avoid recreating layers when callbacks change
  const onTileLoadRef = useRef(onTileLoad);
  const onTileTotalRef = useRef(onTileTotal);
  onTileLoadRef.current = onTileLoad;
  onTileTotalRef.current = onTileTotal;

  const [pngLayer, setPngLayer] = useState<ForestLossPNGLayer | null>(null);
  const darkBaseLayerUrl = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png";
  const defaultBaseLayerUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
  const [darkBaseLayer, setDarkBaseLayer] = useState<any>(null);
  const [defaultBaseLayer, setDefaultBaseLayer] = useState<any>(null);

  // Setup base layers once
  useEffect(() => {
    if (!map) return;
    if (!darkBaseLayer) {
      const darkLayer = (window as any).L.tileLayer(darkBaseLayerUrl, { maxZoom: 18 });
      setDarkBaseLayer(darkLayer);
      darkLayer.addTo(map);
    }
    if (!defaultBaseLayer) {
      const defaultLayer = (window as any).L.tileLayer(defaultBaseLayerUrl, { maxZoom: 18 });
      setDefaultBaseLayer(defaultLayer);
    }
    return () => {
      if (darkBaseLayer && map.hasLayer(darkBaseLayer)) map.removeLayer(darkBaseLayer);
      if (defaultBaseLayer && map.hasLayer(defaultBaseLayer)) map.removeLayer(defaultBaseLayer);
    };
    // eslint-disable-next-line
  }, [map]);

  // Load tile manifest and create PNG layer ONCE (stable — no callback deps)
  useEffect(() => {
    let cancelled = false;
    let layer: ForestLossPNGLayer | null = null;

    const loadTiles = async () => {
      try {
        const tiles = await loadTileManifest();
        if (cancelled) return;
        const index = new TileSpatialIndex(tiles);
        layer = new ForestLossPNGLayer(index.getAllTiles(), {
          // Use stable ref wrappers so the layer instance never needs recreation
          onTileLoad: (n: number) => onTileLoadRef.current?.(n),
          onTileTotal: (n: number) => onTileTotalRef.current?.(n),
        });
        setPngLayer(layer);
      } catch (err) {
        console.log("Failed to load manifest:", err);
      }
    };
    loadTiles();

    return () => {
      cancelled = true;
      if (layer && map && map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    };
  }, [map]); // only depends on map — created once

  // Toggle layer visibility — add/remove from map only when needed
  useEffect(() => {
    if (!map || !darkBaseLayer || !defaultBaseLayer) return;

    const isVisible = !!layers.isGFCLayerEnabled?.visible;

    if (isVisible) {
      // Switch to dark base layer
      if (map.hasLayer(defaultBaseLayer)) map.removeLayer(defaultBaseLayer);
      if (!map.hasLayer(darkBaseLayer)) darkBaseLayer.addTo(map);
      // Add PNG layer if not already on map
      if (pngLayer && !map.hasLayer(pngLayer)) pngLayer.addTo(map);
    } else {
      // Switch to default base layer
      if (map.hasLayer(darkBaseLayer)) map.removeLayer(darkBaseLayer);
      if (!map.hasLayer(defaultBaseLayer)) defaultBaseLayer.addTo(map);
      // Remove PNG layer
      if (pngLayer && map.hasLayer(pngLayer)) map.removeLayer(pngLayer);
    }
  }, [layers.isGFCLayerEnabled?.visible, pngLayer, darkBaseLayer, defaultBaseLayer, map]);

  return (
    <Box sx={{ position: "absolute", width: "100%", height: "100%" }} />
  );
};

export default RenderGeoLayer;
