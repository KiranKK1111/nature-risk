import React from 'react'
import {
    Box,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Divider,
    Select,
    MenuItem,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import './Layout.css';
import ControlCenter from '../layer-control-center/ControlCenter';

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    assetsCount: number | string;
    assetsName: string;
    activeView?: string;
    selectedSector?: string;
    selectedClient?: string;
    showTable?: boolean;
    setShowTable?: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedSector?: React.Dispatch<React.SetStateAction<string>>;
    setSelectedClient?: React.Dispatch<React.SetStateAction<string>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    sidebarCollapsed, 
    assetsCount, 
    assetsName, 
    setSidebarCollapsed,
    activeView,
    selectedSector,
    selectedClient,
    showTable,
    setShowTable,
    setSelectedSector,
    setSelectedClient
}: SidebarProps) => {
    return (
        <Box
            sx={{
                width: sidebarCollapsed ? 56 : 400,
                minWidth: 56,
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                borderRight: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
                transition: 'width 0.3s',
                position: 'relative',
                zIndex: 2,
            }}
        >
            {/* Collapse/Expand Button */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                    p: 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    minHeight: 48,
                    bgcolor: 'background.paper',
                    width: '100%',
                }}
            >
                <Tooltip title={sidebarCollapsed ? 'Expand' : 'Collapse'}>
                    <span
                        style={
                            sidebarCollapsed
                                ? {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#fff',
                                    borderRadius: '50%',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                                    width: 40,
                                    height: 40,
                                    margin: '0 auto',
                                }
                                : { width: '100%' }
                        }
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                gap: { xs: 1, sm: 2, md: 3 }, // Responsive gap
                                flexWrap: 'wrap',
                            }}
                        >
                            {!sidebarCollapsed && (
                                <Typography
                                    variant="h6"
                                    sx={{
                                        flexGrow: 1,
                                        fontSize: { xs: 13, sm: 14 },
                                        fontWeight: 600,
                                        textAlign: 'left',
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    Total {assetsName} Assets: {Number(assetsCount).toLocaleString()}
                                </Typography>
                            )}
                            <IconButton
                                size={sidebarCollapsed ? 'medium' : 'small'}
                                onClick={() => setSidebarCollapsed((prev) => !prev)}
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                                sx={
                                    sidebarCollapsed
                                        ? {
                                            m: 0,
                                            p: 0,
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            backgroundColor: '#fff',
                                            boxShadow: 3,
                                            transition: 'background 0.2s',
                                            '&:hover': {
                                                backgroundColor: '#f5f5f5',
                                            },
                                        }
                                        : {
                                            ml: { xs: 1, sm: 2 },
                                            flexShrink: 0,
                                        }
                                }
                            >
                                {sidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />}
                            </IconButton>
                        </Box>
                        {!sidebarCollapsed && activeView === 'clientsNatureAssetView' && selectedSector && selectedClient && setShowTable ? <Button
                            onClick={() => setShowTable((prev) => !prev)}
                            style={{
                                background: '#1976d2',
                                color: '#fff',
                                width: sidebarCollapsed ? 0 : 'inherit',
                            }}
                        >
                            {showTable ? 'Show Map View' : 'Show Client Assets Table'}
                        </Button> : null}
                    </span>
                </Tooltip>
            </Box>
            <Divider />
            {/* Sidebar Content */}
            {!sidebarCollapsed ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    {/* Dropdowns for client and sector selection */}
                    {(activeView === 'clientsNatureAssetView' || !(selectedSector && selectedClient)) && (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                px: 2,
                                py: 1,
                                alignItems: 'center',
                                bgcolor: 'background.paper',
                                borderBottom: 1,
                                borderColor: 'divider',
                                justifyContent: 'center',
                            }}
                        >
                            <Select
                                size="small"
                                displayEmpty
                                sx={{ width: selectedSector ? 150 : '100%' }}
                                value={selectedSector}
                                onChange={(e) => setSelectedSector && setSelectedSector(e.target.value)}
                                renderValue={selected => selected ? selected : 'Select Sector'}
                            >
                                <MenuItem value="Metals & Minings">Metals & Minings</MenuItem>
                            </Select>

                            {selectedSector && (
                                <Select
                                    size="small"
                                    displayEmpty
                                    sx={{ width: 150 }}
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient &&setSelectedClient(e.target.value)}
                                    renderValue={selected => selected ? selected : 'Select Client'}
                                >
                                    <MenuItem value="Glencore">Glencore</MenuItem>
                                </Select>
                            )}

                        </Box>
                    )}
                    <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                        <ControlCenter />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            writingMode: 'vertical-rl',
                            textOrientation: 'mixed',
                            fontWeight: 700,
                            letterSpacing: 2,
                            color: 'text.secondary',
                            fontSize: '1rem',
                            opacity: 0.7,
                        }}
                    >
                        CONTROL CENTER
                    </Typography>
                </Box>
            )}
        </Box>
    )
}
