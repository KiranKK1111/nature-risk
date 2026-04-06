import React, { useState, useRef, useEffect, useCallback } from "react";
import L from "leaflet";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import "./MapSearch.css";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
}

interface MapSearchProps {
  mapRef: React.MutableRefObject<L.Map | null>;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export default function MapSearch({ mapRef }: MapSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const markerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input when expanded
  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults([]);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: "json",
        limit: "7",
        addressdetails: "0",
      });
      const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
        signal: abortRef.current.signal,
        headers: { "Accept-Language": "en" },
      });
      if (!response.ok) throw new Error("Nominatim fetch failed");
      const data: NominatimResult[] = await response.json();
      setResults(data);
      setHighlightedIndex(-1);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(value);
    }, 300);
  };

  const removeMarker = () => {
    if (markerRef.current && mapRef.current) {
      const el = markerRef.current.getElement();
      if (el) {
        el.classList.add("map-search-pin-fadeout");
        setTimeout(() => {
          if (markerRef.current && mapRef.current) {
            mapRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
          }
        }, 400);
      } else {
        mapRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    }
  };

  const flyToResult = (result: NominatimResult) => {
    if (!mapRef.current) return;
    const [minLat, maxLat, minLon, maxLon] = result.boundingbox;
    const bounds = L.latLngBounds(
      [parseFloat(minLat), parseFloat(minLon)],
      [parseFloat(maxLat), parseFloat(maxLon)]
    );
    mapRef.current.flyToBounds(bounds, { maxZoom: 14, duration: 1.2 });

    // Remove any existing temporary marker
    if (markerTimerRef.current) clearTimeout(markerTimerRef.current);
    removeMarker();

    // Place styled pin at the result's center coordinate
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    const icon = L.divIcon({
      className: "",
      html: `<div class="map-search-pin"><div class="map-search-pin-head"></div><div class="map-search-pin-tail"></div><div class="map-search-pin-pulse"></div></div>`,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
    });
    const marker = L.marker([lat, lon], { icon, interactive: false, zIndexOffset: 2000 });
    marker.addTo(mapRef.current);
    markerRef.current = marker;

    // Auto-remove after 2 seconds
    markerTimerRef.current = setTimeout(() => {
      removeMarker();
    }, 2000);

    setQuery(result.display_name.split(",")[0]);
    setResults([]);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (results[idx]) flyToResult(results[idx]);
    } else if (e.key === "Escape") {
      setResults([]);
      setHighlightedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHighlightedIndex(-1);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCollapse = () => {
    setExpanded(false);
    setQuery("");
    setResults([]);
    setHighlightedIndex(-1);
  };

  return (
    <div
      ref={containerRef}
      className={`map-search-container${expanded ? " map-search-expanded" : ""}`}
    >
      {!expanded ? (
        <button
          className="map-search-icon-btn"
          onClick={() => setExpanded(true)}
          title="Search places"
          aria-label="Search places"
        >
          <SearchIcon sx={{ fontSize: 20 }} />
        </button>
      ) : (
        <div className="map-search-input-row">
          <SearchIcon className="map-search-prefix-icon" sx={{ fontSize: 18 }} />
          <input
            ref={inputRef}
            className="map-search-input"
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search places…"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <span className="map-search-spinner" />}
          {!loading && query && (
            <button className="map-search-clear-btn" onClick={handleClear} title="Clear" aria-label="Clear search">
              {/* <CloseIcon sx={{ fontSize: 16 }} /> */}
              CLEAR
            </button>
          )}
          <button className="map-search-close-btn" onClick={handleCollapse} title="Close search" aria-label="Close search">
            <CloseIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
      )}

      {results.length > 0 && expanded && (
        <ul className="map-search-dropdown" role="listbox">
          {results.map((result, idx) => (
            <li
              key={result.place_id}
              className={`map-search-result-item${idx === highlightedIndex ? " highlighted" : ""}`}
              onMouseDown={() => flyToResult(result)}
              onMouseEnter={() => setHighlightedIndex(idx)}
              role="option"
              aria-selected={idx === highlightedIndex}
            >
              <LocationOnIcon sx={{ fontSize: 16, flexShrink: 0, color: "#2e7d32", mr: 0.5 }} />
              <span className="map-search-result-text">{result.display_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
