export const API_ENDPOINTS = {
  // Legacy endpoints (CDN-backed)
  GET_SCASSETS: '/get_scassets',
  LOAD_IBAT_KBA_STREAM: '/loadIbatData_kba_stream',
  LOAD_AQUADUCT_BASSLINE_DATA: '/load_aquaduct_bassline_data',
  GET_MANIFEST: '/getManifest',
  GET_PNG: '/getPng',
  CPU_STREAM: '/cpu-stream',
  SAMPLE_RASTER: '/sample_raster',

  // Database-backed API endpoints
  // Hierarchy
  GET_SECTORS: '/api/sectors',
  GET_GROUPS: '/api/sectors/{sectorName}/groups',
  GET_CLIENTS: '/api/groups/{groupName}/clients',
  // TopoJSON from DB
  GET_TOPOJSON: '/api/topojson/{layerKey}',
  GET_CLIENT_TOPOJSON: '/api/client-topojson/{clientName}/{layerType}',
  // Per-client analytics
  GET_HEATMAP: '/api/clients/{clientName}/heatmap',
  GET_RADAR: '/api/clients/{clientName}/radar',
  GET_GRID: '/api/clients/{clientName}/grid',
  // Per-sector
  GET_NATURE_THEMATICS: '/api/sectors/{sectorName}/nature-thematics',
  // Reference
  GET_PLANETARY_BOUNDARIES: '/api/planetary-boundaries',
};
