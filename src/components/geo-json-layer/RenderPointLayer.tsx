import L from 'leaflet';
import { FeatureCollection, Geometry } from 'geojson';
import 'leaflet.markercluster';
import { ExtendedMap, removeLayersByName } from '../../services/utils';
import { CLIENT_ASSETS_COLOR, SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION } from './color-constants';
import "../../App.css";

export interface MarkerClickData {
    properties: Record<string, any>;
    latlng: L.LatLng;
    selectedLayer: string;
    isUnsustainable: boolean;
    marker: L.CircleMarker;
}

export default function RenderPointLayer(
    layerName: string,
    color: string,
    selectedLayer: string,
    geojsonData: FeatureCollection<Geometry, any>,
    showLayer: boolean,
    map: ExtendedMap,
    onMarkerClick?: (data: MarkerClickData) => void,
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
                    if (onMarkerClick) {
                        layer.on('click', (e: L.LeafletMouseEvent) => {
                            L.DomEvent.stopPropagation(e);
                            const hasNegDist = features.properties?.minimum_distance < 1;
                            const hasZero = hasZeroValueForKeys([features.properties]);
                            onMarkerClick({
                                properties: features.properties,
                                latlng: e.latlng,
                                selectedLayer,
                                isUnsustainable: hasNegDist || hasZero,
                                marker: layer as L.CircleMarker,
                            });
                        });
                    }
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

export function getPopupContentsForSCBAssets(properties: Record<string, any>, breachLayers?: string[]) {
    const items: { label: string; value: any }[] = [
        { label: 'Asset Name', value: properties?.asset_name },
        { label: 'Asset Type', value: properties?.asset_type },
        { label: 'Sensitive Area', value: properties?.sensitive_area },
        { label: 'Latitude', value: properties?.latitude },
        { label: 'Longitude', value: properties?.longitude },
    ];
    if (breachLayers !== undefined) {
        items.push({ label: 'Breach', value: breachLayers.length > 0 ? breachLayers.join(', ') : '—' });
    }
    return items;
}

export function getPopupContentsForClientAssets(properties: Record<string, any>, breachLayers?: string[]) {
    const items: { label: string; value: any }[] = [
        { label: 'Parent Name', value: properties["parent_name"] },
        { label: 'Country', value: properties["country"] },
        { label: 'Asset Type', value: properties["SC_asset_type"] },
        { label: 'Asset Activity', value: properties["asset_activity"] },
        { label: 'Asset Name', value: properties["asset_name"] },
        { label: 'Latitude', value: properties["latitude"] },
        { label: 'Longitude', value: properties["longitude"] },
    ];
    if (breachLayers !== undefined) {
        items.push({ label: 'Breach', value: breachLayers.length > 0 ? breachLayers.join(', ') : '—' });
    }
    return items;
}

/** Darken a hex color by a given factor (0 = no change, 1 = black) */
function darkenColor(hex: string, factor: number): string {
    const h = hex.replace('#', '');
    const r = Math.round(parseInt(h.substring(0, 2), 16) * (1 - factor));
    const g = Math.round(parseInt(h.substring(2, 4), 16) * (1 - factor));
    const b = Math.round(parseInt(h.substring(4, 6), 16) * (1 - factor));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
