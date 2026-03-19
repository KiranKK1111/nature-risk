import { client } from "./axiosClient";
import { Layer } from 'leaflet';
import { feature } from "topojson-client";
import { getCachedJSON, setCachedJSON } from "./indexedDBCache";

// Stream browser memory usage (RAM) using the Performance API (Chrome only)
// Returns a callback to unsubscribe
export function streamMemoryUsage(
    callback: (memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number; percent: number } | null) => void,
    interval: number = 1000,
    errorCallback?: () => void
) {
    let timer: number | NodeJS.Timeout | null = null;
    let unsupported = false;
    function getMemory() {
        try {
            // @ts-ignore
            if (window && window.performance && window.performance.memory) {
                // @ts-ignore
                const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
                const percent = (usedJSHeapSize / jsHeapSizeLimit) * 100;
                callback({ usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit, percent });
            } else {
                callback(null); // Not supported
                if (errorCallback && !unsupported) {
                    unsupported = true;
                    errorCallback();
                }
            }
        } catch (e) {
            if (errorCallback && !unsupported) {
                unsupported = true;
                errorCallback();
            }
        }
    }
    // Check support immediately before setting interval
    // @ts-ignore
    if (!(window && window.performance && window.performance.memory)) {
        if (errorCallback) errorCallback();
    }
    timer = setInterval(getMemory, interval);
    // Initial call
    getMemory();
    // Return unsubscribe function
    return () => {
        if (timer) clearInterval(timer);
    };
}
export interface ExtendedMap extends L.Map {
    scLayers?: Map<string, Layer>;
}
// Function to fetch and process the JSON response using Axios
// Uses IndexedDB cache — returns cached data instantly if available
export async function fetchAndStreamJson(inputData: any, url: string, signal?: AbortSignal) {
    const queryParams = new URLSearchParams(inputData).toString();
    const fullUrl = `${url}?${queryParams}`;

    // Check IndexedDB cache first
    const cached = await getCachedJSON(fullUrl);
    if (cached) return cached;

    const response = await client.get(fullUrl, {
        headers: { "Content-Type": "application/json" },
        signal,
    });

    // Cache in IndexedDB for next visit
    setCachedJSON(fullUrl, response.data);
    return response.data;
}

export async function fetchAndStreamJsonByEntryPoint(url: string, signal?: AbortSignal) {
    // Check IndexedDB cache first
    const cached = await getCachedJSON(url);
    if (cached) return cached;

    const response = await client.get(url, {
        headers: { "Content-Type": "application/json" },
        signal,
    });

    setCachedJSON(url, response.data);
    return response.data;
}

// Convert TopoJSON to GeoJSON
export function convertTopoToGeoJson(topoData: any) {
    if (!topoData || !topoData.objects || Object.keys(topoData.objects).length === 0) {
        return null;
    }
    const geojsonData = feature(
        topoData,
        topoData.objects[Object.keys(topoData.objects)[0]]
    );
    return geojsonData;
}


export function removeLayersByName(layerName: string, map: ExtendedMap): void {
    if (!map.scLayers || map.scLayers.size === 0) {
        return;
    }

    for (const [key, layer] of Array.from(map.scLayers)) {
        if (key === layerName || key.startsWith(`${layerName}_`)) {
            layer.remove();
            map.scLayers.delete(key);
        }
    }
}

export function getBackendImageUrl(relativePath: string) {
  // Ensure no double slashes
  const base = client.defaults.baseURL?.replace(/\/$/, "") || "";
  const rel = relativePath.replace(/^\//, "");
  return `${base}/${rel}`;
}