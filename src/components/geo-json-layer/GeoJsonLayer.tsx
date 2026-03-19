import { finishLayerTiming } from '../MapLegend';
import * as React from "react";
import { useMap } from 'react-leaflet';
import { Map } from 'leaflet';
import RenderPointLayer, { MarkerClickData, getPopupContentsForClientAssets, getPopupContentsForSCBAssets } from './RenderPointLayer';
import { useEffect, useRef, useState, useCallback } from 'react';
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

        // Popup state
        const [popupData, setPopupData] = useState<{ properties: Record<string, any>; selectedLayer: string } | null>(null);
        const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
        const [popupReady, setPopupReady] = useState(false);
        const [measuredHeight, setMeasuredHeight] = useState(0);
        const popupRef = useRef<HTMLDivElement>(null);

        const POPUP_WIDTH = 280;
        const POPUP_MARGIN = 12;
        const ARROW_HEIGHT = 12;
        const ARROW_GAP = 6;

        const handleMarkerClick = useCallback((data: MarkerClickData) => {
            const point = map.latLngToContainerPoint(data.latlng);
            setPopupPosition({ x: point.x, y: point.y });
            setPopupData({ properties: data.properties, selectedLayer: data.selectedLayer });
            setPopupReady(false); // reset so we measure first
        }, [map]);

        // Measure popup height after invisible render, then show it
        useEffect(() => {
            if (popupData && !popupReady && popupRef.current) {
                setMeasuredHeight(popupRef.current.offsetHeight);
                setPopupReady(true);
            }
        }, [popupData, popupReady]);

        // Close popup on map move/zoom or click outside
        useEffect(() => {
            if (!map) return;
            const closePopup = () => { setPopupData(null); setPopupReady(false); };
            map.on('movestart', closePopup);
            map.on('zoomstart', closePopup);
            map.on('click', closePopup);
            return () => {
                map.off('movestart', closePopup);
                map.off('zoomstart', closePopup);
                map.off('click', closePopup);
            };
        }, [map]);

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
                    map,
                    handleMarkerClick)
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

    const popupItems = popupData
        ? popupData.selectedLayer === 'clientsNatureAssetView'
            ? getPopupContentsForClientAssets(popupData.properties)
            : popupData.selectedLayer === 'scbsitesNatureAssetView'
                ? getPopupContentsForSCBAssets(popupData.properties)
                : []
        : [];

    // Compute smart popup placement to stay within map bounds
    const mapContainer = map?.getContainer();
    const mapW = mapContainer?.clientWidth || 800;
    const mapH = mapContainer?.clientHeight || 600;
    const { x: mx, y: my } = popupPosition;

    const popupH = measuredHeight || 160;

    // Decide: show above or below the marker
    const spaceAbove = my - POPUP_MARGIN;
    const spaceBelow = mapH - my - POPUP_MARGIN;
    const showAbove = spaceAbove >= popupH + ARROW_HEIGHT + ARROW_GAP || spaceAbove >= spaceBelow;

    // Horizontal: center on marker, but clamp to stay within map
    let popupLeft = mx - POPUP_WIDTH / 2;
    popupLeft = Math.max(POPUP_MARGIN, Math.min(popupLeft, mapW - POPUP_WIDTH - POPUP_MARGIN));

    // Vertical
    let popupTop: number;
    if (showAbove) {
        popupTop = my - popupH - ARROW_HEIGHT - ARROW_GAP;
        popupTop = Math.max(POPUP_MARGIN, popupTop);
    } else {
        popupTop = my + ARROW_HEIGHT + ARROW_GAP;
        popupTop = Math.min(mapH - popupH - POPUP_MARGIN, popupTop);
    }

    // Build the popup content (shared between measure & visible render)
    const popupContent = (
        <div className="marker-popup-card">
            {/* Header */}
            <div className="marker-popup-header">
                <div className="marker-popup-header-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#fff"/>
                    </svg>
                </div>
                <span className="marker-popup-header-title">
                    {popupItems.find(i => i.label === 'Asset Name')?.value || 'Asset Details'}
                </span>
            </div>
            {/* Close */}
            <button
                className="marker-popup-close"
                onClick={() => { setPopupData(null); setPopupReady(false); }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
            </button>
            {/* Content */}
            <div className="marker-popup-body">
                {popupItems
                    .filter(item => item.label !== 'Asset Name')
                    .map((item, idx) => {
                    const isCoord = item.label === 'Latitude' || item.label === 'Longitude';
                    return (
                        <div key={idx} className="marker-popup-row">
                            <span className="marker-popup-label">{item.label}</span>
                            <span className={isCoord ? 'marker-popup-value marker-popup-value--coord' : 'marker-popup-value'}>
                                {item.value}
                            </span>
                        </div>
                    );
                })}
                {popupItems.length === 0 && (
                    <div className="marker-popup-row">
                        <span className="marker-popup-label">No data available</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Phase 1: invisible render to measure height */}
            {popupData && !popupReady && (
                <div
                    ref={popupRef}
                    style={{
                        position: 'absolute',
                        visibility: 'hidden',
                        width: POPUP_WIDTH,
                        left: -9999,
                        top: -9999,
                        zIndex: -1,
                    }}
                >
                    {popupContent}
                </div>
            )}
            {/* Phase 2: visible popup at correct position */}
            {popupData && popupReady && (
                <>
                    {/* SVG arrow + connector drawn between popup and marker */}
                    <svg
                        className="marker-popup-arrow-svg"
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: mapW,
                            height: mapH,
                            pointerEvents: 'none',
                            zIndex: 1001,
                        }}
                    >
                        <defs>
                            <filter id="arrowShadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.15"/>
                            </filter>
                            <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#fff" />
                                <stop offset="100%" stopColor="#f0f4f8" />
                            </linearGradient>
                            <linearGradient id="arrowGradUp" x1="0%" y1="100%" x2="0%" y2="0%">
                                <stop offset="0%" stopColor="#1565c0" />
                                <stop offset="100%" stopColor="#1e88e5" />
                            </linearGradient>
                        </defs>
                        {showAbove ? (
                            /* Arrow pointing DOWN from popup to marker */
                            <path
                                d={`M ${mx - 10} ${popupTop + popupH} Q ${mx} ${popupTop + popupH + ARROW_HEIGHT + 2} ${mx + 10} ${popupTop + popupH}`}
                                fill="url(#arrowGrad)"
                                stroke="#e0e4e8"
                                strokeWidth="0.5"
                                filter="url(#arrowShadow)"
                            />
                        ) : (
                            /* Arrow pointing UP from popup to marker */
                            <path
                                d={`M ${mx - 10} ${popupTop} Q ${mx} ${popupTop - ARROW_HEIGHT - 2} ${mx + 10} ${popupTop}`}
                                fill="url(#arrowGradUp)"
                                stroke="rgba(13,71,161,0.3)"
                                strokeWidth="0.5"
                                filter="url(#arrowShadow)"
                            />
                        )}
                    </svg>
                    {/* Popup card */}
                    <div
                        style={{
                            position: 'absolute',
                            left: popupLeft,
                            top: popupTop,
                            width: POPUP_WIDTH,
                            zIndex: 1000,
                            animation: `popupFadeIn 0.22s cubic-bezier(0.21, 1.02, 0.73, 1)`,
                        }}
                    >
                        {popupContent}
                    </div>
                    {/* Marker highlight — layered ring + glow */}
                    <div
                        className="marker-popup-highlight"
                        style={{ left: mx, top: my }}
                    >
                        <div className="marker-popup-highlight-glow" />
                        <div className="marker-popup-highlight-ring" />
                        <div className="marker-popup-highlight-dot" />
                    </div>
                </>
            )}
        </>
    );
}