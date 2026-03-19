import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useSelector } from "react-redux";
import { GlobioGridLayer } from "./GlobioGridLayer";

interface GlobioTileMapProps {
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

export default function GlobioTileMap({ onTileLoad, onTileTotal }: GlobioTileMapProps) {
  const map = useMap();
  const layers = useSelector((state: any) => state.geoJson.layers);

  // Stable refs for callbacks
  const onTileLoadRef = useRef(onTileLoad);
  const onTileTotalRef = useRef(onTileTotal);
  onTileLoadRef.current = onTileLoad;
  onTileTotalRef.current = onTileTotal;

  const msaLayerRef = useRef<GlobioGridLayer | null>(null);
  const landUseLayerRef = useRef<GlobioGridLayer | null>(null);

  // Create layers and preload manifests ONCE on mount (like GFC)
  useEffect(() => {
    if (!map) return;

    const msaOption = "SSP5";
    const msaLayer = new GlobioGridLayer(`globio/msa_pngs/${msaOption}/tile_manifest.json`, {
      onTileLoad: (n: number) => onTileLoadRef.current?.(n),
      onTileTotal: (n: number) => onTileTotalRef.current?.(n),
    });
    msaLayerRef.current = msaLayer;
    msaLayer.loadManifest();

    const luOption = "1992";
    const luLayer = new GlobioGridLayer(`globio/lu_pngs/${luOption}/tile_manifest.json`, {
      onTileLoad: (n: number) => onTileLoadRef.current?.(n),
      onTileTotal: (n: number) => onTileTotalRef.current?.(n),
    });
    landUseLayerRef.current = luLayer;
    luLayer.loadManifest();

    return () => {
      if (map.hasLayer(msaLayer)) map.removeLayer(msaLayer);
      if (map.hasLayer(luLayer)) map.removeLayer(luLayer);
      msaLayerRef.current = null;
      landUseLayerRef.current = null;
    };
  }, [map]);

  // Toggle MSA layer visibility — add/remove from map
  useEffect(() => {
    if (!map || !msaLayerRef.current) return;
    const layer = msaLayerRef.current;
    const isVisible = !!layers.show_MSA_Layer?.visible;

    if (isVisible) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [map, layers.show_MSA_Layer?.visible]);

  // Handle MSA option change — switch manifest on existing layer
  useEffect(() => {
    const layer = msaLayerRef.current;
    if (!layer) return;
    const option = layers.show_MSA_Layer?.selectedOption;
    if (!option) return;
    layer.switchManifest(`globio/msa_pngs/${option}/tile_manifest.json`);
  }, [layers.show_MSA_Layer?.selectedOption]);

  // Toggle Land Use layer visibility — add/remove from map
  useEffect(() => {
    if (!map || !landUseLayerRef.current) return;
    const layer = landUseLayerRef.current;
    const isVisible = !!layers.show_Land_Use_Layer?.visible;

    if (isVisible) {
      if (!map.hasLayer(layer)) layer.addTo(map);
    } else {
      if (map.hasLayer(layer)) map.removeLayer(layer);
    }
  }, [map, layers.show_Land_Use_Layer?.visible]);

  // Handle Land Use option change — switch manifest on existing layer
  useEffect(() => {
    const layer = landUseLayerRef.current;
    if (!layer) return;
    const option = layers.show_Land_Use_Layer?.selectedOption;
    if (!option) return;
    layer.switchManifest(`globio/lu_pngs/${option}/tile_manifest.json`);
  }, [layers.show_Land_Use_Layer?.selectedOption]);

  return null;
}
