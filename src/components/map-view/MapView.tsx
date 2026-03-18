import * as React from "react";
import { MapContainer } from 'react-leaflet';
import { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import L from 'leaflet';
import './MapView.css';
import GeoJsonLayer from '../geo-json-layer/GeoJsonLayer';
import { FeatureCollection, Geometry } from 'geojson';
import { useDispatch } from 'react-redux';
import { setAssetsName, setSelectedLayer } from '../../redux-store/actions/geoLayerAction';
import { useSelector } from 'react-redux';
import RenderGeoLayer from '../geo-tiff-layer/RenderGeoTiffLayer';
import MapLegend from '../MapLegend';
import MemoryInfoBox from '../MemoryInfoBox';
import { streamMemoryUsage } from "../../services/utils";
import { streamCpuUsage } from "../../services/dataService";
import { RenderNCLayer } from '../geo-netcdf-layer/RenderNCLayer';
import GlobioTileMap from '../geo-tiff-layer/GlobioTileMap';
import LoadingInfo from "../geo-tiff-layer/LoadingInfo";
import MapLoadingToast from "./MapLoadingToast";
import { LayerLoadEntry } from "../tree-menu/Layout";

interface MapViewProps {
  assetsName?: string,
  selectedLayer?: string;
  pointLayerData?: FeatureCollection<Geometry, any>;
  proximityLayerData?: any;
  aquaductLayerData?: any;
  activeView?: string;
  selectedSector?: string;
  selectedClient?: string;
  layerLoadStatus?: LayerLoadEntry[];
}


const MapView = forwardRef<any, MapViewProps>(({ assetsName, selectedLayer, pointLayerData, proximityLayerData, aquaductLayerData, activeView, selectedSector, selectedClient, layerLoadStatus }, ref) => {
  const dispatch = useDispatch();
  const state = useSelector((state: any) => state);
  const [showTable, setShowTable] = React.useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Lazy load clientAssets.jsx
  const ClientAssetsTable = React.useMemo(() => {
    return React.lazy(() => import('../table-view/clientAssets.jsx'));
  }, []);

  useImperativeHandle(ref, () => ({
    invalidateSize: () => {
      if (mapRef.current && mapRef.current.getContainer() && !showTable) {
        mapRef.current.invalidateSize();
      }
    }
  }), [showTable]);

  React.useEffect(() => {
    dispatch(setSelectedLayer(selectedLayer));
    dispatch(setAssetsName(assetsName));
  }, [selectedLayer, assetsName, dispatch]);


  // Memory/CPU infoBox state
  const [memory, setMemory] = React.useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percent: number;
  } | null>(null);
  const [cpu, setCpu] = React.useState<{
    total_cores: number;
    physical_cores: number;
    cpu_percent: number;
  } | null>(null);
  const [layerTimings, setLayerTimings] = React.useState<
    Array<{ key: string; label: string; duration: number }>
  >([]);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [connectionError, setConnectionError] = React.useState(false);
  const memoryReceivedRef = React.useRef(false);
  const cpuReceivedRef = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;
    // Synchronously check for memory API support before first render
    // @ts-ignore
    const hasMemoryApi = window && window.performance && window.performance.memory;
    if (!hasMemoryApi) {
      if (isMounted) setConnectionError(true);
      return;
    }
    if (isMounted) setConnectionError(false);
    memoryReceivedRef.current = false;
    cpuReceivedRef.current = false;

    // Enhanced memory stream with error handling
    const unsubscribe = streamMemoryUsage
      ? streamMemoryUsage(
        (data: any) => {
          if (!isMounted) return;
          if (data) memoryReceivedRef.current = true;
          setMemory(data);
        },
        1000,
        () => {
          if (!isMounted) return;
          if (!memoryReceivedRef.current) setConnectionError(true);
        }
      )
      : () => { };

    // Enhanced CPU stream with error handling
    const unsubscribeCpu = streamCpuUsage
      ? streamCpuUsage(
        (data: any) => {
          if (!isMounted) return;
          if (data) cpuReceivedRef.current = true;
          setCpu(data);
        },
        undefined,
        () => {
          if (!isMounted) return;
          if (!cpuReceivedRef.current) setConnectionError(true);
        }
      )
      : () => { };

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      if (unsubscribeCpu) unsubscribeCpu();
    };
  }, []);

  React.useEffect(() => {
    const handler = (e: any) => {
      const timing = e.detail;
      if (!timing) return;
      if (timing.remove) {
        setLayerTimings((prev) =>
          prev.filter((item) => item.key !== timing.key)
        );
      } else {
        setLayerTimings((prev) =>
          [timing, ...prev.filter((item) => item.key !== timing.key)].slice(0, 10)
        );
      }
    };
    window.addEventListener("layer-timing", handler);
    return () => window.removeEventListener("layer-timing", handler);
  }, []);

  const [loadedCount, setLoadedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  return (
    <div className="map-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
          center={[0, 0]}
          zoom={4}
          minZoom={2}
          maxZoom={20}
          style={{ flex: 1, height: '100%', width: '100%' }}
          maxBounds={[[-85, -180], [85, 180]]}
          maxBoundsViscosity={1.0}
          worldCopyJump={true}
          attributionControl={false}
          preferCanvas={true}
        >
          {/* REMOVE DEFAULT OSM TILE LAYER: Do not add any <TileLayer ...> here! */}
          <MapLegend activeView={activeView} />
          <RenderGeoLayer onTileLoad={setLoadedCount} onTileTotal={setTotalCount} />
          {totalCount > 0 && loadedCount < totalCount && (
            <LoadingInfo loaded={loadedCount} total={totalCount} />
          )}
          {(activeView === 'scbsitesNatureAssetView' || (selectedSector && selectedClient)) && (
            <GeoJsonLayer
              pointLayerData={pointLayerData ?? null}
              polygonLayerData={proximityLayerData ?? null}
              aquaductLayerData={aquaductLayerData ?? null}
            />
          )}
          <GlobioTileMap onTileLoad={setLoadedCount} onTileTotal={setTotalCount} />
          <RenderNCLayer year={2022} onTileLoad={setLoadedCount} onTileTotal={setTotalCount} />
        </MapContainer>
        <MapLoadingToast />
        <MemoryInfoBox
          memory={memory}
          cpu={cpu}
          layerTimings={layerTimings}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          layerLoadStatus={layerLoadStatus}
        />
      </div>
    </div>
  );
});

export default MapView;