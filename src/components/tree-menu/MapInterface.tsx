import React from 'react'
import {
    Box,
    Button,
    ButtonGroup,
} from '@mui/material';
import './Layout.css';
import TableView from '../table-view/TableView';
import MapView from '../map-view/MapView';
import MenuItems from '../menu-items/MenuItems';
import { LayerLoadEntry } from './Layout';

interface MapInterfaceProps {
    activeView?: string;
    selectedSector?: string;
    selectedClient?: string;
    showTable?: boolean;
    setActiveView?: (view: 'clientsNatureAssetView' | 'scbsitesNatureAssetView') => void;
    mapViewRef?: React.Ref<any>;
    proximityLayerData?: any;
    aquaductLayerData?: any;
    selectedOption?: string;
    layers?: any;
    layerLoadStatus?: LayerLoadEntry[];
}

export const MapInterface: React.FC<MapInterfaceProps> = ({
    activeView,
    selectedSector,
    selectedClient,
    showTable,
    setActiveView,
    mapViewRef,
    proximityLayerData,
    aquaductLayerData,
    selectedOption,
    layers,
    layerLoadStatus,
}) => {
    return (
        <Box sx={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {/* View Toggle Buttons */}
            {!showTable && selectedSector && selectedClient ? (<Box
                sx={{
                    position: 'absolute',
                    top: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                }}
            >
                <ButtonGroup
                    variant="contained"
                    sx={{
                        bgcolor: 'white',
                        boxShadow: 3,
                        '& .MuiButton-root': {
                            bgcolor: 'white',
                            color: 'text.primary',
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 4,
                            py: 1,
                            '&:hover': {
                                bgcolor: 'grey.100',
                            },
                        },
                        '& .MuiButton-root.active': {
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'primary.dark',
                            },
                        },
                    }}
                >
                    <Button
                        className={activeView === 'clientsNatureAssetView' ? 'active' : ''}
                        onClick={() => setActiveView && setActiveView('clientsNatureAssetView')}
                    >
                        Clients Overview
                    </Button>
                    <Button
                        className={activeView === 'scbsitesNatureAssetView' ? 'active' : ''}
                        onClick={() => setActiveView && setActiveView('scbsitesNatureAssetView')}
                    >
                        SCB Assets View
                    </Button>
                </ButtonGroup>
            </Box>) : null}
            {
                showTable ? (
                    <Box sx={{ m: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <TableView />
                    </Box>
                ) : (
                    <MapView
                        ref={mapViewRef}
                        assetsName={activeView === 'clientsNatureAssetView' ? 'Client' : 'SC'}
                        selectedLayer={selectedOption}
                        pointLayerData={
                            activeView === 'clientsNatureAssetView'
                                ? (selectedSector && selectedClient ? layers.pointLayerForClientAsset?.data : null)
                                : layers.pointLayerForSCBAsset?.data
                        }
                        proximityLayerData={proximityLayerData}
                        aquaductLayerData={aquaductLayerData}
                        activeView={activeView}
                        selectedSector={selectedSector}
                        selectedClient={selectedClient}
                        layerLoadStatus={layerLoadStatus}
                    />
                )
            }

            {/* MenuItems positioned below view toggle buttons */}
            {!showTable && selectedSector && selectedClient && activeView === 'clientsNatureAssetView' && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        zIndex: 999,
                    }}
                >
                    <MenuItems />
                </Box>
            )}
        </Box>
    )
}
