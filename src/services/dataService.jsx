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
