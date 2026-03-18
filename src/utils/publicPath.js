/* global __webpack_public_path__ */

/**
 * Get the public path for assets
 * When running as a remote module, this will be http://localhost:3011/
 * When running standalone, this will be /
 */
export const getPublicPath = () => {
  // eslint-disable-next-line no-undef
  if (typeof __webpack_public_path__ !== 'undefined') {
    // eslint-disable-next-line no-undef
    return __webpack_public_path__;
  }
  return '/';
};

/**
 * Get the full URL for a static asset
 * @param {string} path - The path relative to the public folder (e.g., 'static/images/icon/logo.png')
 * @returns {string} The full URL to the asset
 */
export const getAssetUrl = (path) => {
  const publicPath = getPublicPath();
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${publicPath}${cleanPath}`;
};

/**
 * Get the CDN URL for data files
 * @param {string} path - The path relative to /data/ (e.g., '/data/globio/msa_pngs/SSP1/tile_manifest.json')
 * @returns {string} The full CDN URL
 */
export const getCdnUrl = (path) => {
  // Use relative path to proxy through nginx to avoid mixed content issues
  const CDN_BASE_URL = window.location.hostname.includes('localhost') ? '/data' : '/esg/clhs/downloadlocationcsv?filename=/wb4_nfs357/imftusr051/cra/alignmentdata';
  // Remove leading '/data/' from path
  const cleanPath = path.replace(/^\/data\//, '');  
  return `${CDN_BASE_URL}/${cleanPath}`;
};


