// Extend the Window interface to include _env_ for custom runtime env vars
declare global {
  interface Window {
    _env_?: {
      natureRiskBackendApiUrlForLocal?: string;
      natureRiskBackendApiUrl?: string;
    };
  }
}

import axios from "axios";
import { isContainerMode } from "../utils";

// Helper to get backend URLs from global env or fallback
function getBackendApiUrl() {
  // Try window._env_ (if injected at runtime)
  let localUrl = undefined;
  let remoteUrl = undefined;
  if (typeof window !== 'undefined' && window._env_) {
    localUrl = window._env_.natureRiskBackendApiUrlForLocal;
    remoteUrl = window._env_.natureRiskBackendApiUrl;
  }
  // Fallback to process.env (for build-time envs)
  if (!localUrl && typeof process !== 'undefined' && process.env) {
    localUrl = process.env.REACT_APP_NATURE_RISK_BACKEND_API_URL_FOR_LOCAL;
    remoteUrl = process.env.REACT_APP_NATURE_RISK_BACKEND_API_URL;
  }
  // Fallback to hardcoded values (from values-dev-esg-sa-09.yaml)
  if (!localUrl) {
    localUrl = 'http://localhost:8000';
  }
  if (!remoteUrl) {
    remoteUrl = 'http://esg-nature-risk-map-backend-esg-sa-09.apps.colt-np.ocp.dev.net';
  }
  // Use local if running on localhost, else remote
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return localUrl;
  }
  return remoteUrl;
}

const axiosConfig = isContainerMode()
  ? { 
      baseURL: "/esg/nature-risk",
      withCredentials: true 
    }
  : {     
      baseURL: getBackendApiUrl(),
      timeout: 300000,
    };

export const client = axios.create(axiosConfig);

// Add a request interceptor
client.interceptors.request.use(
  function (config) {
    return config;
  },
  function (error) {
    if (error.response) {
      console.log("The server is currently down. Please try again later.");
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor
client.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response) {
      console.log(
        error?.response?.data?.detail ??
          "The server is currently down. Please try again later."
      );
    }
    return Promise.reject(error);
  }
);
