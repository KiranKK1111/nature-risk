import * as React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { ImageOverlay } from "react-leaflet";
import { useSelector } from "react-redux";
import "../../App.css";
import { layerSections } from "../layer-control-center/layerConfig";

interface RenderNCLayerProps {
  year: number;
  onTileLoad?: (loaded: number) => void;
  onTileTotal?: (total: number) => void;
}

// Simple in-memory cache: tracks both URL and whether the image has fully loaded
const overlayCache: { [key: string]: { url: string; loaded: boolean } } = {};

export function RenderNCLayer({ year, onTileLoad, onTileTotal }: RenderNCLayerProps) {
  const layers = useSelector((state: any) => state.geoJson.layers);
  const [overlayUrl, setOverlayUrl] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const OVERLAY_BOUNDS: [[number, number], [number, number]] = [
    [-85.04, -179.99],
    [85.04, 179.99],
  ];

  // Find the active layer in either 'edgar' or 'dynqual' section
  const targetSections = ['aerosol', 'freshWaterUse', 'biogeochemicalFlows'];
  let activeCheckbox: any = null;
  for (const sectionKey of targetSections) {
    const section = layerSections.find(sec => sec.sectionKey === sectionKey);
    if (section) {
      activeCheckbox = section.checkboxes.find(cb => cb.stateKey && layers[cb.stateKey]?.visible);
      if (activeCheckbox) break;
    }
  }

  // Compose a unique key for the overlay
  const overlayKey = activeCheckbox && activeCheckbox.renderFile ? `${activeCheckbox.label}_${year}` : null;

  // Fetch overlay only when needed
  const fetchOverlay = useCallback(async () => {
    if (!activeCheckbox || !activeCheckbox.renderFile) {
      setOverlayUrl(null);
      setActiveKey(null);
      if (onTileTotal) onTileTotal(0);
      if (onTileLoad) onTileLoad(0);
      return;
    }

    if (onTileTotal) onTileTotal(1);

    // If already cached AND the image was fully loaded, skip preloading
    if (overlayKey && overlayCache[overlayKey]?.loaded) {
      setOverlayUrl(overlayCache[overlayKey].url);
      setActiveKey(overlayKey);
      if (onTileLoad) onTileLoad(1);
      return;
    }

    const url = activeCheckbox.renderFile(year);

    // Signal loading started (loaded = 0)
    if (onTileLoad) onTileLoad(0);

    // Preload the image to track actual download progress
    if (imageRef.current) {
      imageRef.current.onload = null;
      imageRef.current.onerror = null;
    }
    const img = new Image();
    imageRef.current = img;

    img.onload = () => {
      overlayCache[overlayKey!] = { url, loaded: true };
      setOverlayUrl(url);
      setActiveKey(overlayKey);
      if (onTileLoad) onTileLoad(1);
    };

    img.onerror = () => {
      overlayCache[overlayKey!] = { url, loaded: true };
      setOverlayUrl(url);
      setActiveKey(overlayKey);
      if (onTileLoad) onTileLoad(1);
    };

    img.src = url;
  }, [activeCheckbox, overlayKey, year, onTileLoad, onTileTotal]);

  useEffect(() => {
    if (activeCheckbox && activeCheckbox.renderFile) {
      fetchOverlay();
    } else {
      setOverlayUrl(null);
      setActiveKey(null);
      if (onTileTotal) onTileTotal(0);
      if (onTileLoad) onTileLoad(0);
    }
    return () => {
      // Cleanup: cancel any in-flight image preload
      if (imageRef.current) {
        imageRef.current.onload = null;
        imageRef.current.onerror = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCheckbox, overlayKey, fetchOverlay]);

  if (!overlayUrl) {
    return null;
  }

  return (
    <ImageOverlay
      url={overlayUrl}
      bounds={OVERLAY_BOUNDS}
      opacity={0.8}
      zIndex={500}
      className="nc-rect"
    />
  );
}
