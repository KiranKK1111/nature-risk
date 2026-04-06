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
import { client } from '../../services/axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

// ── Point-in-polygon breach detection ─────────────────────────────────────────

function pointInRing(px: number, py: number, ring: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1];
        const xj = ring[j][0], yj = ring[j][1];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
            inside = !inside;
        }
    }
    return inside;
}

function pointInFeatureGeom(lng: number, lat: number, feature: GeoJSON.Feature): boolean {
    const geom = feature.geometry as any;
    if (!geom) return false;
    if (geom.type === 'Polygon') {
        const ring: number[][] = geom.coordinates[0];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [x, y] of ring) {
            if (x < minX) minX = x; if (y < minY) minY = y;
            if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
        if (lng < minX || lng > maxX || lat < minY || lat > maxY) return false;
        return pointInRing(lng, lat, ring);
    }
    if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
            const ring = poly[0];
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const [x, y] of ring) {
                if (x < minX) minX = x; if (y < minY) minY = y;
                if (x > maxX) maxX = x; if (y > maxY) maxY = y;
            }
            if (lng >= minX && lng <= maxX && lat >= minY && lat <= maxY) {
                if (pointInRing(lng, lat, ring)) return true;
            }
        }
    }
    return false;
}

function isPointInLayer(lng: number, lat: number, fc?: GeoJSON.FeatureCollection | null): boolean {
    if (!fc?.features?.length) return false;
    return fc.features.some(f => pointInFeatureGeom(lng, lat, f));
}

// Pre-computed property keys → raster layer name mapping (for Client assets)
const PRECOMPUTED_RASTER_CHECKS: Array<{
    name: string;
    test: (p: Record<string, any>) => boolean | null;  // null = property absent
}> = [
    { name: 'Tree Cover Loss', test: p => {
        const keys = ['def_100', 'def_1000', 'def_5000', 'def_10000', 'def_20000', 'def_50000'];
        return keys.some(k => p[k] != null) ? keys.some(k => Number(p[k]) > 0) : null;
    }},
    { name: 'MSA', test: p => p['MSA_100'] != null ? Number(p['MSA_100']) < 0.8 : null },
    { name: 'Land Use', test: p => p['lu_cat_2020'] != null ? true : null },
    { name: 'BOD', test: p => p['bod'] != null ? Number(p['bod']) > 0 : null },
    { name: 'TDS', test: p => p['tds'] != null ? Number(p['tds']) > 0 : null },
    { name: 'PM2.5', test: p => p['pm2.5_2022'] != null ? Number(p['pm2.5_2022']) > 0 : null },
    { name: 'CO', test: p => p['co_2022'] != null ? Number(p['co_2022']) > 0 : null },
    { name: 'NH3', test: p => p['nh3_2022'] != null ? Number(p['nh3_2022']) > 0 : null },
    { name: 'SO2', test: p => p['so2_2022'] != null ? Number(p['so2_2022']) > 0 : null },
    { name: 'NOx', test: p => p['nox_2022'] != null ? Number(p['nox_2022']) > 0 : null },
    { name: 'Hg', test: p => p['hg_2022'] != null ? Number(p['hg_2022']) > 0 : null },
];

async function computeBreachLayers(
    lat: number,
    lng: number,
    properties: Record<string, any>,
    polyData: any,
    aquaData: any,
): Promise<string[]> {
    const breachSet = new Set<string>();

    // ── Polygon layers — spatial proximity check (~1km buffer) ─────────────────
    if (isPointInLayer(lng, lat, polyData?.KBAPOL2024STREAM_Layer?.layerData))
        breachSet.add('KBA');
    if (isPointInLayer(lng, lat, polyData?.WDPA00STREAM_Layer?.layerData))
        breachSet.add('IUCN');
    if (isPointInLayer(lng, lat, polyData?.RAMSARSTREAM_Layer?.layerData))
        breachSet.add('Ramsar');
    if (isPointInLayer(lng, lat, polyData?.WHS_STREAM_Layer?.layerData))
        breachSet.add('WHS');

    // ── Aquaduct Water Stress (spatial containment) ──────────────────────────────
    if (isPointInLayer(lng, lat, aquaData?.AQUA_BASSLINE_Layer?.layerData))
        breachSet.add('Water Stress');

    // ── Raster / image layers ──────────────────────────────────────────────────
    // Fast path: use pre-computed properties if available (Client assets have them)
    let needBackendSample = false;
    for (const check of PRECOMPUTED_RASTER_CHECKS) {
        const result = check.test(properties);
        if (result === true) breachSet.add(check.name);
        if (result === null) needBackendSample = true;  // property absent → need backend
    }

    // Slow path: if any raster property was missing, call backend to sample actual pixels
    if (needBackendSample) {
        try {
            const resp = await client.get(API_ENDPOINTS.SAMPLE_RASTER, { params: { lat, lng } });
            const rasterBreaches: string[] = resp.data?.breaches ?? [];
            const alreadyResolved = new Set(
                PRECOMPUTED_RASTER_CHECKS
                    .filter(c => c.test(properties) !== null)
                    .map(c => c.name)
            );
            for (const name of rasterBreaches) {
                if (!alreadyResolved.has(name)) breachSet.add(name);
            }
        } catch (err) {
            console.warn('Raster breach sampling failed:', err);
        }
    }

    return Array.from(breachSet);
}


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
        const [popupData, setPopupData] = useState<{ properties: Record<string, any>; selectedLayer: string; isUnsustainable: boolean; breachLayers: string[] } | null>(null);
        const [breachLoading, setBreachLoading] = useState(false);
        const [popupPosition, setPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
        const [popupReady, setPopupReady] = useState(false);
        const [measuredHeight, setMeasuredHeight] = useState(0);
        const [measuredWidth, setMeasuredWidth] = useState(0);
        const popupRef = useRef<HTMLDivElement>(null);

        const POPUP_MAX_WIDTH = 260;
        const POPUP_MARGIN = 12;
        const ARROW_HEIGHT = 10;
        const ARROW_GAP = 5;

        const polygonLayerDataRef = useRef<any>(null);
        const aquaductLayerDataRef = useRef<any>(null);
        useEffect(() => { polygonLayerDataRef.current = polygonLayerData; }, [polygonLayerData]);
        useEffect(() => { aquaductLayerDataRef.current = aquaductLayerData; }, [aquaductLayerData]);

        // Track selected marker so we can bring it to front and restore it later
        const selectedMarkerRef = useRef<{ marker: L.CircleMarker; origStyle: L.CircleMarkerOptions } | null>(null);

        const restoreSelectedMarker = useCallback(() => {
            if (selectedMarkerRef.current) {
                const { marker, origStyle } = selectedMarkerRef.current;
                marker.setStyle({
                    radius: origStyle.radius as number,
                    weight: origStyle.weight as number,
                    color: origStyle.color as string,
                    fillColor: origStyle.fillColor as string,
                    fillOpacity: origStyle.fillOpacity as number,
                    opacity: origStyle.opacity as number,
                });
                selectedMarkerRef.current = null;
            }
        }, []);

        const handleMarkerClick = useCallback(async (data: MarkerClickData) => {
            const point = map.latLngToContainerPoint(data.latlng);
            setPopupPosition({ x: point.x, y: point.y });

            // Restore previously selected marker
            restoreSelectedMarker();

            // Bring clicked marker to front and highlight it
            const marker = data.marker;
            const opts = marker.options;
            selectedMarkerRef.current = {
                marker,
                origStyle: { radius: opts.radius, weight: opts.weight, color: opts.color, fillColor: opts.fillColor, fillOpacity: opts.fillOpacity, opacity: opts.opacity },
            };
            marker.bringToFront();
            marker.setStyle({ radius: 12, weight: 3, fillOpacity: 1, opacity: 1 });

            // Show popup immediately, breach row shows a spinner until resolved
            setBreachLoading(data.isUnsustainable);
            setPopupData({ properties: data.properties, selectedLayer: data.selectedLayer, isUnsustainable: data.isUnsustainable, breachLayers: [] });
            setPopupReady(false);
            if (data.isUnsustainable) {
                const breachLayers = await computeBreachLayers(data.latlng.lat, data.latlng.lng, data.properties, polygonLayerDataRef.current, aquaductLayerDataRef.current);
                setBreachLoading(false);
                setPopupData(prev => prev ? { ...prev, breachLayers } : null);
            }
        }, [map, restoreSelectedMarker]);

        const visiblePopupRef = useRef<HTMLDivElement>(null);

        // Measure popup height after invisible render, then show it
        useEffect(() => {
            if (popupData && !popupReady && popupRef.current) {
                setMeasuredHeight(popupRef.current.offsetHeight);
                setMeasuredWidth(popupRef.current.offsetWidth);
                setPopupReady(true);
            }
        }, [popupData, popupReady]);

        // Live-track visible popup size so arrow repositions when breach text arrives
        useEffect(() => {
            const el = visiblePopupRef.current;
            if (!el || !popupReady) return;
            let rafId: number;
            const ro = new ResizeObserver(([entry]) => {
                cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => {
                    const { height, width } = entry.contentRect;
                    setMeasuredHeight(Math.ceil(height));
                    setMeasuredWidth(Math.ceil(width));
                });
            });
            ro.observe(el);
            return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
        }, [popupReady, popupData]);

        // Close popup on map move/zoom or click outside
        useEffect(() => {
            if (!map) return;
            const closePopup = () => {
                setPopupData(null);
                setPopupReady(false);
                setBreachLoading(false);
                restoreSelectedMarker();
            };
            map.on('movestart', closePopup);
            map.on('zoomstart', closePopup);
            map.on('click', closePopup);
            return () => {
                map.off('movestart', closePopup);
                map.off('zoomstart', closePopup);
                map.off('click', closePopup);
            };
        }, [map, restoreSelectedMarker]);

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
            ? getPopupContentsForClientAssets(popupData.properties, popupData.isUnsustainable ? popupData.breachLayers : undefined)
            : popupData.selectedLayer === 'scbsitesNatureAssetView'
                ? getPopupContentsForSCBAssets(popupData.properties, popupData.isUnsustainable ? popupData.breachLayers : undefined)
                : []
        : [];

    // Compute smart popup placement to stay within map bounds
    const mapContainer = map?.getContainer();
    const mapW = mapContainer?.clientWidth || 800;
    const mapH = mapContainer?.clientHeight || 600;
    const { x: mx, y: my } = popupPosition;

    const popupH = measuredHeight || 160;
    const popupW = measuredWidth || POPUP_MAX_WIDTH;

    // Decide: show above or below the marker
    const spaceAbove = my - POPUP_MARGIN;
    const spaceBelow = mapH - my - POPUP_MARGIN;
    const showAbove = spaceAbove >= popupH + ARROW_HEIGHT + ARROW_GAP || spaceAbove >= spaceBelow;

    // Horizontal: center on marker, but clamp to stay within map
    let popupLeft = mx - popupW / 2;
    popupLeft = Math.max(POPUP_MARGIN, Math.min(popupLeft, mapW - popupW - POPUP_MARGIN));

    // Vertical
    let popupTop: number;
    if (showAbove) {
        popupTop = my - popupH - ARROW_HEIGHT - ARROW_GAP;
        popupTop = Math.max(POPUP_MARGIN, popupTop);
    } else {
        popupTop = my + ARROW_HEIGHT + ARROW_GAP;
        popupTop = Math.min(mapH - popupH - POPUP_MARGIN, popupTop);
    }

    // Clamp arrow X to stay within the popup card bounds (with padding for border-radius)
    const ARROW_PADDING = 16;
    const arrowX = Math.max(popupLeft + ARROW_PADDING, Math.min(mx, popupLeft + popupW - ARROW_PADDING));

    // Color scheme based on marker type
    const isRed = popupData?.isUnsustainable ?? false;
    const headerGradient = isRed
        ? 'linear-gradient(135deg, #b71c1c 0%, #d32f2f 50%, #e53935 100%)'
        : 'linear-gradient(135deg, #0d47a1 0%, #1976d2 50%, #2196f3 100%)';
    // Build the popup content (shared between measure & visible render)
    const popupContent = (
        <div className="marker-popup-card">
            {/* Header */}
            <div className="marker-popup-header" style={{ background: headerGradient }}>
                <div className="marker-popup-header-icon">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#fff"/>
                    </svg>
                </div>
                <span className="marker-popup-header-title">
                    {popupItems.find(i => i.label === 'Asset Name')?.value || 'Asset Details'}
                </span>
                {/* Close */}
                <button
                    className="marker-popup-close"
                    onClick={() => { setPopupData(null); setPopupReady(false); }}
                >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                </button>
            </div>
            {/* Content */}
            <div className="marker-popup-body">
                {popupItems
                    .filter(item => item.label !== 'Asset Name')
                    .map((item, idx) => {
                    const isCoord = item.label === 'Latitude' || item.label === 'Longitude';
                    const isBreach = item.label === 'Breach';
                    return (
                        <div key={idx} className={isBreach ? 'marker-popup-row marker-popup-row--breach' : 'marker-popup-row'}>
                            <span className="marker-popup-label">{item.label}</span>
                            <span className={
                                isBreach ? 'marker-popup-value marker-popup-value--breach'
                                : isCoord ? 'marker-popup-value marker-popup-value--coord'
                                : 'marker-popup-value'
                            }>
                                {isBreach && breachLoading
                                    ? <span className="breach-spinner" />
                                    : item.value}
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
                        maxWidth: POPUP_MAX_WIDTH,
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
                        </defs>
                        {showAbove ? (
                            /* Popup is above marker: triangle points DOWN from popup bottom to marker */
                            <polygon
                                points={`${arrowX - 10},${popupTop + popupH} ${arrowX + 10},${popupTop + popupH} ${mx},${my}`}
                                fill="#fff"
                                stroke="#e0e4e8"
                                strokeWidth="0.5"
                                filter="url(#arrowShadow)"
                            />
                        ) : (
                            /* Popup is below marker: triangle points UP from popup top to marker */
                            <polygon
                                points={`${arrowX - 10},${popupTop} ${arrowX + 10},${popupTop} ${mx},${my}`}
                                fill={isRed ? '#b71c1c' : '#1565c0'}
                                stroke={isRed ? 'rgba(183,28,28,0.3)' : 'rgba(13,71,161,0.3)'}
                                strokeWidth="0.5"
                                filter="url(#arrowShadow)"
                            />
                        )}
                    </svg>
                    {/* Popup card */}
                    <div
                        ref={visiblePopupRef}
                        style={{
                            position: 'absolute',
                            left: popupLeft,
                            top: popupTop,
                            maxWidth: POPUP_MAX_WIDTH,
                            zIndex: 1000,
                            animation: `popupFadeIn 0.22s cubic-bezier(0.21, 1.02, 0.73, 1)`,
                            transition: 'top 0.15s ease, left 0.15s ease',
                        }}
                    >
                        {popupContent}
                    </div>
                    {/* Marker highlight — layered ring + glow */}
                    <div
                        className="marker-popup-highlight"
                        style={{ left: mx, top: my }}
                    >
                        <div className="marker-popup-highlight-glow" style={isRed ? {
                            background: 'radial-gradient(circle, rgba(211,47,47,0.15) 0%, rgba(211,47,47,0.05) 50%, transparent 70%)',
                        } : undefined} />
                        <div className="marker-popup-highlight-ring" style={isRed ? {
                            borderColor: 'rgba(211,47,47,0.8)',
                        } : undefined} />
                        <div className="marker-popup-highlight-dot" style={isRed ? {
                            background: '#d32f2f',
                            boxShadow: '0 0 6px rgba(211,47,47,0.6)',
                        } : undefined} />
                    </div>
                </>
            )}
        </>
    );
}