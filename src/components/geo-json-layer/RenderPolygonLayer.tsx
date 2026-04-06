import L from 'leaflet';
import { FeatureCollection, Geometry, Feature, Polygon, MultiPolygon } from 'geojson';
import 'leaflet.markercluster';
import { ExtendedMap, removeLayersByName } from '../../services/utils';
import { labelColorMap } from './aquaColorMapping';
import { defaultColor } from './color-constants';

export default function RenderPolygonLayer(
    layerName: string,
    color: string,
    prop: string,
    selectedLayer: string,
    geojsonData: FeatureCollection<Geometry, any>,
    showLayer: boolean,
    map: ExtendedMap,
): void {
    
    removeLayersByName(layerName, map);

    if (!showLayer) {
        return;
    }

    if (geojsonData) {
            geojsonData = convertMultiPolygonToPolygon(geojsonData);

            // All polygon layers share ONE pane + ONE canvas renderer.
            // Canvas paints pixels directly — overlapping polygons (same layer or
            // across layers) simply overwrite each other, no alpha blending.
            // The shared pane's CSS opacity gives transparency against the basemap.
            const paneName = layerName === 'aquaBasslineLayer' ? 'polyPane_aqua' : 'polyPane_proximity';
            if (!map.getPane(paneName)) {
                const pane = map.createPane(paneName);
                pane.style.zIndex = '450';
                pane.style.opacity = '0.7';
                pane.style.pointerEvents = 'auto';
            }
            // Reuse a single canvas renderer per shared pane
            const rendererKey = `_canvasRenderer_${paneName}`;
            if (!(map as any)[rendererKey]) {
                (map as any)[rendererKey] = L.canvas({ pane: paneName });
            }
            const renderer = (map as any)[rendererKey];

            let geoJsonLayer;
            const baseOpts = { pane: paneName, renderer } as any;
            if (layerName === "aquaBasslineLayer") {
                geoJsonLayer = L.geoJSON(geojsonData, {
                    ...baseOpts,
                    style: (feature?: Feature) => {
                        let fillColor = defaultColor;
                        if (feature && feature.properties && typeof feature.properties.bws_label === 'string') {
                            fillColor = labelColorMap[feature.properties.bws_label] || defaultColor;
                        }
                        return {
                            color: fillColor,
                            fillColor,
                            weight: 0,
                            fillOpacity: 1,
                            stroke: false,
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const properties = feature.properties as Record<string, any>;
                        const popupContent = getPopupContent(properties, prop);
                        layer.bindPopup(popupContent);
                    },
                });
            } else {
                geoJsonLayer = L.geoJSON(geojsonData, {
                    ...baseOpts,
                    style: () => {
                        return {
                            color: color,
                            fillColor: color,
                            weight: 0,
                            fillOpacity: 1,
                            stroke: false,
                        };
                    },
                    onEachFeature: (feature, layer) => {
                        const properties = feature.properties as Record<string, any>;
                        const popupContent = getPopupContent(properties, prop);
                        layer.bindPopup(popupContent);
                    },
                });
            }

            geoJsonLayer.addTo(map);

            if (!map.scLayers) {
                map.scLayers = new Map();
            }
            map.scLayers.set(layerName, geoJsonLayer);
    }
}

function convertMultiPolygonToPolygon(
    geojsonData: FeatureCollection<Geometry, any>
): FeatureCollection<Geometry, any> {
    const updatedFeatures: Feature<Geometry, any>[] = [];

    geojsonData.features.forEach((feature) => {
        if (feature.geometry.type === "MultiPolygon") {
            (feature.geometry.coordinates as MultiPolygon["coordinates"]).forEach((polygonCoords) => {
                const polygonFeature: Feature<Polygon, any> = {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: polygonCoords,
                    },
                    properties: { ...feature.properties },
                };
                updatedFeatures.push(polygonFeature);
            });
        } else {
            updatedFeatures.push(feature);
        }
    });

    return {
        ...geojsonData,
        features: updatedFeatures,
    };
}

function getPopupContent(properties: Record<string, any>, prop: string) {
    return `
    <b>${properties?.[prop]}<br>
    `;
}