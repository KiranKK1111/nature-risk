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
            let geoJsonLayer;
            if (layerName === "aquaBasslineLayer") {
                geoJsonLayer = L.geoJSON(geojsonData, {
                    style: (feature?: Feature) => {
                        let color = defaultColor;
                        if (feature && feature.properties && typeof feature.properties.bws_label === 'string') {
                            color = labelColorMap[feature.properties.bws_label] || defaultColor;
                        }
                        return {
                            color,
                            weight: 0,
                            fillOpacity: 0.7,
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
                    style: (feature?: Feature) => {                        
                        return {
                            color: color,
                            weight: 0,
                            fillOpacity: 0.7,
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