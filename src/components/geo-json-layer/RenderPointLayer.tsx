import L from 'leaflet';
import { FeatureCollection, Geometry } from 'geojson';
import 'leaflet.markercluster';
import { ExtendedMap, removeLayersByName } from '../../services/utils';
import { CLIENT_ASSETS_COLOR, SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION } from './color-constants';
import "../../App.css";

export default function RenderPointLayer(
    layerName: string,
    color: string,
    selectedLayer: string,
    geojsonData: FeatureCollection<Geometry, any>,
    showLayer: boolean,
    map: ExtendedMap,
): Promise<number> {
    return new Promise((resolve) => {
        removeLayersByName(layerName, map);

        if (!showLayer) {
            resolve(0);
            return;
        }

        if (geojsonData) {
            const paneName = 'pointMarkersPane';
            if (!map.getPane(paneName)) {
                map.createPane(paneName);
                map.getPane(paneName)!.style.zIndex = "650";
            }

            let pointCount = 0;

            const geoJsonLayer = L.geoJSON(geojsonData, {
                pointToLayer: (features, latlng) => {
                    pointCount++;
                    const hasNegativeDistance = features.properties?.minimum_distance < 1;
                    const hasZeroValue = hasZeroValueForKeys([features.properties]);
                    const markerColor = getMarkerColor({
                        selectedLayer,
                        hasNegativeDistance,
                        hasZeroValue,
                        color,
                    });

                    // Darker border of same hue gives depth like a shadow
                    const borderColor = darkenColor(markerColor, 0.35);
                    return L.circleMarker(latlng, {
                        radius: 9,
                        color: borderColor,
                        weight: 2,
                        fillColor: markerColor,
                        fillOpacity: 0.95,
                        stroke: true,
                        opacity: 0.8,
                        pane: paneName,
                    });
                },
                onEachFeature: (features, layer) => {
                    let popupContents = '';
                    if (selectedLayer === 'clientsNatureAssetView') {
                        popupContents = getPopupContentsForClientAssets(features.properties);
                    } else if (selectedLayer === 'scbsitesNatureAssetView') {
                        popupContents = getPopupContentsForSCBAssets(features.properties);
                    } else {
                        popupContents = 'No data available';
                    }
                    layer.bindPopup(popupContents);
                },
            });

            geoJsonLayer.addTo(map);

            if (!map.scLayers) {
                map.scLayers = new Map();
            }
            map.scLayers.set(layerName, geoJsonLayer);
            resolve(pointCount);
        } else {
            resolve(0);
        }
    });
}

// Helper function to determine marker color based on layer and feature properties
function getMarkerColor({ selectedLayer, hasNegativeDistance, hasZeroValue, color }: {
    selectedLayer: string,
    hasNegativeDistance: boolean,
    hasZeroValue: boolean,
    color: string
}) {
    if (selectedLayer === 'clientsNatureAssetView') {
        if (hasNegativeDistance || hasZeroValue) {
            return SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION;
        }
        return CLIENT_ASSETS_COLOR;
    } else if (selectedLayer === 'scbsitesNatureAssetView') {
        if (hasNegativeDistance || hasZeroValue) {
            return SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION;
        }
        return color;
    }
    // Default fallback
    return color;
}

function hasZeroValueForKeys(objArray: Array<Record<string, any>>): boolean {
    const keysToCheck = [
        "Ia", "Ib", "II", "III", "AZE", "Ramsar", "World.Heritage.Site", "nonAZE"
    ];
    return objArray.some((obj: Record<string, any>) =>
        keysToCheck.some(key => obj[key] === 0)
    );
}

function getPopupContentsForSCBAssets(properties: Record<string, any>) {
    return `
    <b>Asset Name:</b> ${properties?.asset_name}<br>
    <b>Asset Type:</b> ${properties?.asset_type}<br>
    <b>Sensitive Area:</b> ${properties?.sensitive_area}<br>
    <b>Latitude:</b> ${properties?.latitude}<br>
    <b>Longitude:</b> ${properties?.longitude}<br>
    `;
}

function getPopupContentsForClientAssets(properties: Record<string, any>) {
    return `
    <b>Parent Name :</b> ${properties["parent_name"]}<br>
    <b>Country :</b> ${properties["country"]}<br>
    <b>Asset Type :</b> ${properties["SC_asset_type"]}<br>
    <b>Asset Activity :</b> ${properties["asset_activity"]}<br>
    <b>Asset Name :</b> ${properties["asset_name"]}<br>
    <b>Latitude :</b> ${properties["latitude"]},
    <b>Longitude :</b> ${properties["longitude"]}<br>
    `;
}

/** Darken a hex color by a given factor (0 = no change, 1 = black) */
function darkenColor(hex: string, factor: number): string {
    const h = hex.replace('#', '');
    const r = Math.round(parseInt(h.substring(0, 2), 16) * (1 - factor));
    const g = Math.round(parseInt(h.substring(2, 4), 16) * (1 - factor));
    const b = Math.round(parseInt(h.substring(4, 6), 16) * (1 - factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}