import { fetchAndStreamJson, convertTopoToGeoJson, fetchAndStreamJsonByEntryPoint } from "./utils";
import { client } from "./axiosClient";
import { API_ENDPOINTS } from "../constants/apiEndpoints";

export async function retrieveStreamingData(selectedValue, url, signal) {
  const inputData = {
    selectedValue: selectedValue,
  };

  const jsonData = await fetchAndStreamJson(inputData, url, signal);

  if (jsonData) {
    return convertTopoToGeoJson(jsonData);
  }
  return null;
}

export function streamCpuUsage(callback, interval = 2000, errorCallback) {
  let timer = null;
  let stopped = false;

  async function poll() {
    if (stopped) return;
    try {
      const response = await client.get(API_ENDPOINTS.CPU_STREAM);
      callback(response.data);
    } catch (e) {
      console.error("Error fetching CPU usage data:", e);
      if (errorCallback) errorCallback();
    }
    if (!stopped) {
      timer = setTimeout(poll, interval);
    }
  }

  poll();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

export async function retrieveAquaductStreamingData(entryPoint, signal) {
  const jsonData = await fetchAndStreamJsonByEntryPoint(entryPoint, signal);

  if (jsonData) {
    return convertTopoToGeoJson(jsonData);
  }
  return null;
}

// ============================================================================
// Database-backed API functions
// ============================================================================

/** Fetch sectors list */
export async function fetchSectors(signal) {
  const response = await client.get(API_ENDPOINTS.GET_SECTORS, { signal });
  return response.data;
}

/** Fetch groups for a sector */
export async function fetchGroups(sectorName, signal) {
  const url = API_ENDPOINTS.GET_GROUPS.replace('{sectorName}', encodeURIComponent(sectorName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch clients for a group */
export async function fetchClients(groupName, signal) {
  const url = API_ENDPOINTS.GET_CLIENTS.replace('{groupName}', encodeURIComponent(groupName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch TopoJSON layer from DB and convert to GeoJSON */
export async function fetchTopoJsonLayer(layerKey, signal) {
  const url = API_ENDPOINTS.GET_TOPOJSON.replace('{layerKey}', layerKey);
  const response = await client.get(url, { signal });
  if (response.data) {
    return convertTopoToGeoJson(response.data);
  }
  return null;
}

/** Fetch client-specific TopoJSON from DB and convert to GeoJSON */
export async function fetchClientTopoJson(clientName, layerType, signal) {
  const url = API_ENDPOINTS.GET_CLIENT_TOPOJSON
    .replace('{clientName}', encodeURIComponent(clientName))
    .replace('{layerType}', layerType);
  const response = await client.get(url, { signal });
  if (response.data) {
    return convertTopoToGeoJson(response.data);
  }
  return null;
}

/** Fetch heatmap data for a client */
export async function fetchHeatmapData(clientName, signal) {
  const url = API_ENDPOINTS.GET_HEATMAP.replace('{clientName}', encodeURIComponent(clientName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch radar data for a client */
export async function fetchRadarData(clientName, signal) {
  const url = API_ENDPOINTS.GET_RADAR.replace('{clientName}', encodeURIComponent(clientName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch grid data for a client */
export async function fetchGridData(clientName, signal) {
  const url = API_ENDPOINTS.GET_GRID.replace('{clientName}', encodeURIComponent(clientName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch nature thematics (table data) for a sector */
export async function fetchNatureThematics(sectorName, signal) {
  const url = API_ENDPOINTS.GET_NATURE_THEMATICS.replace('{sectorName}', encodeURIComponent(sectorName));
  const response = await client.get(url, { signal });
  return response.data;
}

/** Fetch planetary boundary indicators */
export async function fetchPlanetaryBoundaries(signal) {
  const response = await client.get(API_ENDPOINTS.GET_PLANETARY_BOUNDARIES, { signal });
  return response.data;
}
