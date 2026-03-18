import { useState } from 'react';
import {
  Box,
  CssBaseline,
  Snackbar,
  Alert,
  ButtonGroup,
  Button,
} from '@mui/material';
import React from 'react';
import './Layout.css';
import MapView from '../map-view/MapView';
import { setLayerData, setLayerError } from '../../redux-store/actions/geoLayerAction';
import { retrieveAquaductStreamingData, retrieveStreamingData } from '../../services/dataService';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';
import { useDispatch, useSelector } from 'react-redux';
import { useRef, useEffect } from 'react';
import TableView from '../table-view/TableView';
import MenuItems from '../menu-items/MenuItems';
import { Sidebar } from './Sidebar';
import { MapInterface } from './MapInterface';

export interface LayerLoadEntry {
  key: string;
  label: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  error?: string;
}

export default function Layout() {
  const [showTable, setShowTable] = React.useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    {
      open: false,
      message: '',
      severity: 'success',
    }
  );
  const [activeView, setActiveView] = useState<'clientsNatureAssetView' | 'scbsitesNatureAssetView'>('scbsitesNatureAssetView');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('scbsitesNatureAssetView');
  const geoJsonData = useSelector((state: any) => state.geoJson) || {};
  const layers = geoJsonData.layers || {};
  const assetsCount = useSelector((state: any) => state.geoJson.assetsCount);
  const assetsName = useSelector((state: any) => state.geoJson.assetsName);

  // Per-layer loading status for MemoryInfoBox progressive display
  const [layerLoadStatus, setLayerLoadStatus] = useState<LayerLoadEntry[]>([]);

  const mapViewRef = useRef<any>(null);

  useEffect(() => {
    if (mapViewRef.current && typeof mapViewRef.current.invalidateSize === 'function') {
      setTimeout(() => {
        if (mapViewRef.current && typeof mapViewRef.current.invalidateSize === 'function') {
          mapViewRef.current.invalidateSize();
        }
      }, 300);
    }
  }, [sidebarCollapsed]);

  const dispatch = useDispatch();

  // Shared layers config (fetched only once on mount)
  const getSharedLayerConfigs = (signal: AbortSignal) => [
    { key: 'KBAPOL2024STREAM_Layer', label: 'Key Biodiversity Areas', fetch: () => retrieveStreamingData('KBAPOL2024STREAM', API_ENDPOINTS.LOAD_IBAT_KBA_STREAM, signal) },
    { key: 'WDPA00STREAM_Layer', label: 'IUCN Protected Areas', fetch: () => retrieveStreamingData('WDPA00STREAM', API_ENDPOINTS.LOAD_IBAT_KBA_STREAM, signal) },
    { key: 'RAMSARSTREAM_Layer', label: 'RAMSAR Wetlands', fetch: () => retrieveStreamingData('RAMSARSTREAM', API_ENDPOINTS.LOAD_IBAT_KBA_STREAM, signal) },
    { key: 'WHS_STREAM_Layer', label: 'World Heritage Sites', fetch: () => retrieveStreamingData('WHS-STREAM', API_ENDPOINTS.LOAD_IBAT_KBA_STREAM, signal) },
    { key: 'aquaductBassline_Layer', label: 'Water Baseline Stress', fetch: () => retrieveAquaductStreamingData(API_ENDPOINTS.LOAD_AQUADUCT_BASSLINE_DATA, signal) },
  ];

  // Load all (shared + per-view) layers on every activeView change
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchAll = async () => {
      const signal = controller.signal;
      const sharedConfigs = getSharedLayerConfigs(signal);
      const sharedToFetch = sharedConfigs.filter(cfg => !layers[cfg.key] || !layers[cfg.key].data || Object.keys(layers[cfg.key].data).length === 0);

      const layerConfigs: Record<string, Array<{ key: string; label: string; fetch: () => Promise<any> }>> = {
        clientsNatureAssetView: [
          { key: 'pointLayerForClientAsset', label: 'Client Assets', fetch: () => retrieveStreamingData('ClientAssetLocation', API_ENDPOINTS.GET_SCASSETS, signal) },
        ],
        scbsitesNatureAssetView: [
          { key: 'pointLayerForSCBAsset', label: 'SCB Assets', fetch: () => retrieveStreamingData('AssetLocation', API_ENDPOINTS.GET_SCASSETS, signal) },
        ],
      };
      const perViewConfigs = layerConfigs[activeView] || [];
      const perViewToFetch = perViewConfigs.filter(cfg => !layers[cfg.key] || !layers[cfg.key].data || Object.keys(layers[cfg.key].data).length === 0);
      const allToFetch = [...sharedToFetch, ...perViewToFetch];

      if (allToFetch.length === 0) {
        setLayerLoadStatus([]);
        return;
      }

      // Initialize all entries as "pending", then immediately mark "loading"
      const initialStatus: LayerLoadEntry[] = allToFetch.map(cfg => ({
        key: cfg.key,
        label: cfg.label,
        status: 'loading',
      }));
      setLayerLoadStatus(initialStatus);

      await Promise.allSettled(
        allToFetch.map(async (cfg) => {
          try {
            const data = await cfg.fetch();
            if (!cancelled) {
              dispatch(setLayerData(cfg.key, data));
              setLayerLoadStatus(prev =>
                prev.map(e => e.key === cfg.key ? { ...e, status: 'loaded' } : e)
              );
            }
          } catch (err: any) {
            if (!cancelled && err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
              console.error(`Failed to load layer ${cfg.key}:`, err);
              dispatch(setLayerError(cfg.key, err?.message || 'Failed to load'));
              setLayerLoadStatus(prev =>
                prev.map(e => e.key === cfg.key ? { ...e, status: 'error', error: err?.message || 'Failed' } : e)
              );
            }
          }
        })
      );
    };
    fetchAll();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeView]);

  useEffect(() => {
    if (selectedSector && selectedClient) {
      setActiveView('clientsNatureAssetView');
    }
  }, [selectedSector, selectedClient]);

  useEffect(() => {
    setSelectedOption(activeView);
  }, [activeView]);

  // Build proximityLayerData and aquaductLayerData from generic layers state
  const proximityLayerData = {
    KBAPOL2024STREAM_Layer: {
      layerData: layers.KBAPOL2024STREAM_Layer?.data,
      showLayer: layers.KBAPOL2024STREAM_Layer?.visible,
    },
    WDPA00STREAM_Layer: {
      layerData: layers.WDPA00STREAM_Layer?.data,
      showLayer: layers.WDPA00STREAM_Layer?.visible,
    },
    RAMSARSTREAM_Layer: {
      layerData: layers.RAMSARSTREAM_Layer?.data,
      showLayer: layers.RAMSARSTREAM_Layer?.visible,
    },
    WHS_STREAM_Layer: {
      layerData: layers.WHS_STREAM_Layer?.data,
      showLayer: layers.WHS_STREAM_Layer?.visible,
    },
  };

  const aquaductLayerData = {
    AQUA_BASSLINE_Layer: {
      layerData: layers.aquaductBassline_Layer?.data,
      showLayer: layers.aquaductBassline_Layer?.visible,
    },
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <div className="layout-container">
      <CssBaseline />
      <Box className="layout-box" sx={{ bgcolor: 'background.default' }}>
        {/* Sidebar */}
        <Sidebar
          sidebarCollapsed={sidebarCollapsed}
          assetsCount={assetsCount}
          assetsName={assetsName}
          setSidebarCollapsed={setSidebarCollapsed}
          activeView={activeView}
          selectedSector={selectedSector}
          selectedClient={selectedClient}
          showTable={showTable}
          setShowTable={setShowTable}
          setSelectedSector={setSelectedSector}
          setSelectedClient={setSelectedClient}
        />

        {/* Map */}
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          <MapInterface
            activeView={activeView}
            selectedSector={selectedSector}
            selectedClient={selectedClient}
            showTable={showTable}
            setActiveView={setActiveView}
            mapViewRef={mapViewRef}
            proximityLayerData={proximityLayerData}
            aquaductLayerData={aquaductLayerData}
            selectedOption={selectedOption}
            layers={layers}
            layerLoadStatus={layerLoadStatus}
          />
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}
