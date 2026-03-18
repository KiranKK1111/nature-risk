import { finishLayerTiming } from '../MapLegend';
import * as React from "react";
import { useMap } from 'react-leaflet';
import { Map } from 'leaflet';
import RenderPointLayer from './RenderPointLayer';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import RenderPolygonLayer from './RenderPolygonLayer';
import {
    AQUA_BASSLINE_COLOR,
    IUCN_I_III_COLOR,
    KEY_BIODIVERSITY_COLOR,
    RAMSAR_COLOR,
    SCB_ASSETS_COLOR,
    WHS_COLOR
} from './color-constants';
import { useDispatch } from 'react-redux';
import { setAssetsCount, setLoadingData } from '../../redux-store/actions/geoLayerAction';


interface GeoJsonLayerProps {
    pointLayerData: GeoJSON.FeatureCollection | null;
    polygonLayerData: any;
    aquaductLayerData: any;
}


export default function GeoJsonLayer({ pointLayerData, polygonLayerData, aquaductLayerData }: GeoJsonLayerProps): JSX.Element {
        const map: Map = useMap();
        const prevDataRef = useRef<{ [key: string]: any }>({});
        const dispatch = useDispatch();
        const selectedLayer = useSelector((state: any) => state.geoJson.selectedLayer);
        const [assetsCountState, setAssetsCountState] = useState(0);    
        const layers = useSelector((state: any) => state.geoJson.layers);

        // --- Timing for all config keys ---
        // MSA Layer
        useEffect(() => {
            if (layers?.show_MSA_Layer?.visible) {
                finishLayerTiming('msa');
            }
        }, [layers?.show_MSA_Layer?.visible]);

        // Land Use Layer
        useEffect(() => {
            if (layers?.show_Land_Use_Layer?.visible) {
                finishLayerTiming('lu');
            }
        }, [layers?.show_Land_Use_Layer?.visible]);

        // Tree Cover Loss (GFC)
        useEffect(() => {
            if (layers?.isGFCLayerEnabled?.visible) {
                finishLayerTiming('landUseChange');
            }
        }, [layers?.isGFCLayerEnabled?.visible]);

        // Water Baseline Stress
        useEffect(() => {
            if (layers?.aquaductBassline_Layer?.visible) {
                finishLayerTiming('waterBasslineStress');
            }
        }, [layers?.aquaductBassline_Layer?.visible]);

        // Biogeochemical flows: BOD
        useEffect(() => {
            if (layers?.show_BOD_Layer?.visible) {
                finishLayerTiming('bod');
            }
        }, [layers?.show_BOD_Layer?.visible]);

        // Biogeochemical flows: TDS
        useEffect(() => {
            if (layers?.show_TDS_Layer?.visible) {
                finishLayerTiming('tds');
            }
        }, [layers?.show_TDS_Layer?.visible]);

        // Edgar (Air Quality) layers
        useEffect(() => {
            if (layers?.show_Edgar_PM25_Layer?.visible) finishLayerTiming('edgar_pm25');
            if (layers?.show_Edgar_CO_Layer?.visible) finishLayerTiming('edgar_co');
            if (layers?.show_Edgar_NH3_Layer?.visible) finishLayerTiming('edgar_nh3');
            if (layers?.show_Edgar_SO2_Layer?.visible) finishLayerTiming('edgar_so2');
            if (layers?.show_Edgar_NOx_Layer?.visible) finishLayerTiming('edgar_nox');
            if (layers?.show_Edgar_Hg_Layer?.visible) finishLayerTiming('edgar_hg');
        }, [
            layers?.show_Edgar_PM25_Layer?.visible,
            layers?.show_Edgar_CO_Layer?.visible,
            layers?.show_Edgar_NH3_Layer?.visible,
            layers?.show_Edgar_SO2_Layer?.visible,
            layers?.show_Edgar_NOx_Layer?.visible,
            layers?.show_Edgar_Hg_Layer?.visible
        ]);



    // Remove all layers if proximity layer is disabled
    useEffect(() => {
        if (!layers.isProximityLayerEnabled?.visible) {
            // Remove polygon layers
            RenderPolygonLayer(
                "ibatKBALayer",
                KEY_BIODIVERSITY_COLOR,
                "natname",
                selectedLayer,
                polygonLayerData?.KBAPOL2024STREAM_Layer?.layerData,
                false,
                map
            );
            RenderPolygonLayer(
                "ibatWDPALayer",
                IUCN_I_III_COLOR,
                "IUCN_CAT",
                selectedLayer,
                polygonLayerData?.WDPA00STREAM_Layer?.layerData,
                false,
                map
            );
            RenderPolygonLayer(
                "ibatRAMSARLayer",
                RAMSAR_COLOR,
                "DESIG_ENG",
                selectedLayer,
                polygonLayerData?.RAMSARSTREAM_Layer?.layerData,
                false,
                map
            );
            RenderPolygonLayer(
                "ibatWHSLayer",
                WHS_COLOR,
                "DESIG_ENG",
                selectedLayer,
                polygonLayerData?.WHS_STREAM_Layer?.layerData,
                false,
                map
            );
            // Reset previous data references so layers reappear when re-enabled
            prevDataRef.current = {};
        }
    }, [layers.isProximityLayerEnabled?.visible, map, selectedLayer, pointLayerData, polygonLayerData]);

    // Point Layer
    useEffect(() => {
        if (pointLayerData && pointLayerData.features && pointLayerData.features.length > 0) {
            if (pointLayerData !== prevDataRef.current.pointLayerData) {
                dispatch(setLoadingData(true));
                RenderPointLayer(
                    "assetLayer",
                    SCB_ASSETS_COLOR,
                    selectedLayer,
                    pointLayerData,
                    true,
                    map)
                    .then((minDistancesLength) => {
                        setAssetsCountState(minDistancesLength);
                    })
                    .catch((error) => {
                        console.error('Error rendering point layer:', error);
                    })
                    .finally(() => {
                        dispatch(setLoadingData(false));
                    });
                prevDataRef.current.pointLayerData = pointLayerData;
            }
        }
    }, [map, pointLayerData, selectedLayer, layers.isProximityLayerEnabled?.visible]);

    // KBA Layer
    useEffect(() => {
        if (!layers.isProximityLayerEnabled?.visible) return;
        // dispatch(setLoadingData(true));
        const kba = polygonLayerData?.KBAPOL2024STREAM_Layer;
        if (kba && kba.layerData && kba.layerData.features && kba.layerData.features.length > 0) {
            if (kba.layerData !== prevDataRef.current.kbaLayerData ||
                kba.showLayer !== prevDataRef.current.kbaShowLayer) {
                RenderPolygonLayer(
                    "ibatKBALayer",
                    KEY_BIODIVERSITY_COLOR,
                    "natname",
                    selectedLayer,
                    kba.layerData,
                    kba.showLayer,
                    map
                );
                finishLayerTiming('keyBiodiversity');
                prevDataRef.current.kbaLayerData = kba.layerData;
                prevDataRef.current.kbaShowLayer = kba.showLayer;
            }
        }
        // dispatch(setLoadingData(false));
    }, [map, polygonLayerData?.KBAPOL2024STREAM_Layer?.layerData, polygonLayerData?.KBAPOL2024STREAM_Layer?.showLayer, selectedLayer, layers.isProximityLayerEnabled?.visible]);

    // WDPA Layer
    useEffect(() => {
        if (!layers.isProximityLayerEnabled?.visible) return;
        // dispatch(setLoadingData(true));
        const wdpa = polygonLayerData?.WDPA00STREAM_Layer;
        if (wdpa && wdpa.layerData && wdpa.layerData.features && wdpa.layerData.features.length > 0) {
            if (wdpa.layerData !== prevDataRef.current.wdpaLayerData ||
                wdpa.showLayer !== prevDataRef.current.wdpaShowLayer) {
                RenderPolygonLayer(
                    "ibatWDPALayer",
                    IUCN_I_III_COLOR,
                    "IUCN_CAT",
                    selectedLayer,
                    wdpa.layerData,
                    wdpa.showLayer,
                    map
                );
                finishLayerTiming('iucn');
                prevDataRef.current.wdpaLayerData = wdpa.layerData;
                prevDataRef.current.wdpaShowLayer = wdpa.showLayer;
            }
        }
        // dispatch(setLoadingData(false));
    }, [map, polygonLayerData?.WDPA00STREAM_Layer?.layerData, polygonLayerData?.WDPA00STREAM_Layer?.showLayer, selectedLayer, layers.isProximityLayerEnabled?.visible]);

    // RAMSAR Layer
    useEffect(() => {
        if (!layers.isProximityLayerEnabled?.visible) return;
        // dispatch(setLoadingData(true));
        const ramsar = polygonLayerData?.RAMSARSTREAM_Layer;
        if (ramsar && ramsar.layerData && ramsar.layerData.features && ramsar.layerData.features.length > 0) {
            if (ramsar.layerData !== prevDataRef.current.ramsarLayerData ||
                ramsar.showLayer !== prevDataRef.current.ramsarShowLayer) {
                RenderPolygonLayer(
                    "ibatRAMSARLayer",
                    RAMSAR_COLOR,
                    "DESIG_ENG",
                    selectedLayer,
                    ramsar.layerData,
                    ramsar.showLayer,
                    map
                );
                finishLayerTiming('ramsar');
                prevDataRef.current.ramsarLayerData = ramsar.layerData;
                prevDataRef.current.ramsarShowLayer = ramsar.showLayer;
            }
        }
        // dispatch(setLoadingData(false));
    }, [map, polygonLayerData?.RAMSARSTREAM_Layer?.layerData, polygonLayerData?.RAMSARSTREAM_Layer?.showLayer, selectedLayer, layers.isProximityLayerEnabled?.visible]);

    // WHS Layer
    useEffect(() => {
        if (!layers.isProximityLayerEnabled?.visible) return;
        // dispatch(setLoadingData(true));
        const whs = polygonLayerData?.WHS_STREAM_Layer;
        if (whs && whs.layerData && whs.layerData.features && whs.layerData.features.length > 0) {
            if (whs.layerData !== prevDataRef.current.whsLayerData ||
                whs.showLayer !== prevDataRef.current.whsShowLayer) {
                RenderPolygonLayer(
                    "ibatWHSLayer",
                    WHS_COLOR,
                    "DESIG_ENG",
                    selectedLayer,
                    whs.layerData,
                    whs.showLayer,
                    map
                );
                finishLayerTiming('whs');
                prevDataRef.current.whsLayerData = whs.layerData;
                prevDataRef.current.whsShowLayer = whs.showLayer;
            }
        }
        // dispatch(setLoadingData(false));
    }, [map, polygonLayerData?.WHS_STREAM_Layer?.layerData, polygonLayerData?.WHS_STREAM_Layer?.showLayer, selectedLayer, layers.isProximityLayerEnabled?.visible]);

    // Aquaduct
    useEffect(() => {
        // if (!isProximityLayerEnabled) return;
        // dispatch(setLoadingData(true));
        const aqua = aquaductLayerData?.AQUA_BASSLINE_Layer;
        if (aqua && aqua.layerData && aqua.layerData.features && aqua.layerData.features.length > 0) {
            if (aqua.layerData !== prevDataRef.current.aquaLayerData ||
                aqua.showLayer !== prevDataRef.current.aquaShowLayer) {
                RenderPolygonLayer(
                    "aquaBasslineLayer",
                    AQUA_BASSLINE_COLOR,
                    "bws_label",
                    selectedLayer,
                    aqua.layerData,
                    aqua.showLayer,
                    map
                );
                prevDataRef.current.aquaLayerData = aqua.layerData;
                prevDataRef.current.aquaShowLayer = aqua.showLayer;
            }
        }
        // dispatch(setLoadingData(false));
    }, [map, aquaductLayerData?.AQUA_BASSLINE_Layer?.layerData, aquaductLayerData?.AQUA_BASSLINE_Layer?.showLayer, selectedLayer]);

    useEffect(() => {
        dispatch(setAssetsCount(assetsCountState));
    }, [assetsCountState, dispatch]);

    return <></>;
}