import React, { useEffect, useState } from 'react'
import {
    Box,
    Typography,
    Button,
    IconButton,
    Tooltip,
    Divider,
    Select,
    MenuItem,
    Autocomplete,
    TextField,
    Chip,
    Checkbox,
    CircularProgress,
} from '@mui/material';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import MenuIcon from '@mui/icons-material/Menu';
import './Layout.css';
import ControlCenter from '../layer-control-center/ControlCenter';
import { fetchSectors, fetchGroups, fetchClients } from '../../services/dataService';

interface SidebarProps {
    sidebarCollapsed: boolean;
    setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    assetsCount: number | string;
    assetsName: string;
    activeView?: string;
    selectedSector?: string;
    selectedGroup?: string;
    selectedClient?: string[];
    showTable?: boolean;
    setShowTable?: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedSector?: React.Dispatch<React.SetStateAction<string>>;
    setSelectedGroup?: React.Dispatch<React.SetStateAction<string>>;
    setSelectedClient?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
    sidebarCollapsed,
    assetsCount,
    assetsName,
    setSidebarCollapsed,
    activeView,
    selectedSector,
    selectedGroup,
    selectedClient,
    showTable,
    setShowTable,
    setSelectedSector,
    setSelectedGroup,
    setSelectedClient
}: SidebarProps) => {
    // Dynamic data from API
    const [sectors, setSectors] = useState<{ name: string; description: string }[]>([]);
    const [groups, setGroups] = useState<{ name: string; display_name: string }[]>([]);
    const [clients, setClients] = useState<{ name: string; display_name: string }[]>([]);
    const [loadingSectors, setLoadingSectors] = useState(true);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingClients, setLoadingClients] = useState(false);

    // Fetch sectors on mount
    useEffect(() => {
        const controller = new AbortController();
        fetchSectors(controller.signal)
            .then(data => setSectors(data))
            .catch(err => { if (err?.name !== 'CanceledError') console.error('Failed to load sectors:', err); })
            .finally(() => setLoadingSectors(false));
        return () => controller.abort();
    }, []);

    // Fetch groups when sector changes
    useEffect(() => {
        if (!selectedSector) { setGroups([]); return; }
        setLoadingGroups(true);
        setGroups([]);
        if (setSelectedGroup) setSelectedGroup('');
        if (setSelectedClient) setSelectedClient([]);
        const controller = new AbortController();
        fetchGroups(selectedSector, controller.signal)
            .then(data => setGroups(data))
            .catch(err => { if (err?.name !== 'CanceledError') console.error('Failed to load groups:', err); })
            .finally(() => setLoadingGroups(false));
        return () => controller.abort();
    }, [selectedSector]);

    // Fetch clients when group changes
    useEffect(() => {
        if (!selectedGroup) { setClients([]); return; }
        setLoadingClients(true);
        setClients([]);
        if (setSelectedClient) setSelectedClient([]);
        const controller = new AbortController();
        fetchClients(selectedGroup, controller.signal)
            .then(data => setClients(data))
            .catch(err => { if (err?.name !== 'CanceledError') console.error('Failed to load clients:', err); })
            .finally(() => setLoadingClients(false));
        return () => controller.abort();
    }, [selectedGroup]);

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
                                        fontSize: { xs: 12, sm: 13 },
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
                        {!sidebarCollapsed && activeView === 'clientsNatureAssetView' && selectedSector && ((selectedClient?.length ?? 0) > 0) && setShowTable ? <Button
                            onClick={() => setShowTable((prev) => !prev)}
                            style={{
                                background: '#1976d2',
                                color: '#fff',
                                fontSize: 12,
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
                    {/* Dropdowns for sector, group and client selection */}
                    {(activeView === 'clientsNatureAssetView' || !(selectedSector && ((selectedClient?.length ?? 0) > 0))) && (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 1,
                                px: 2,
                                py: 1.5,
                                bgcolor: 'background.paper',
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            {/* Row 1: Sector + Group (side by side) */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Select
                                    size="small"
                                    displayEmpty
                                    sx={{ flex: 1, fontSize: 12 }}
                                    value={selectedSector}
                                    onChange={(e) => setSelectedSector && setSelectedSector(e.target.value)}
                                    renderValue={selected => selected ? selected : 'Select Sector'}
                                    disabled={loadingSectors}
                                >
                                    {loadingSectors ? (
                                        <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                    ) : (
                                        sectors.map(s => (
                                            <MenuItem key={s.name} value={s.name}>{s.name}</MenuItem>
                                        ))
                                    )}
                                </Select>

                                {selectedSector && (
                                    <Select
                                        size="small"
                                        displayEmpty
                                        sx={{ flex: 1, fontSize: 12 }}
                                        value={selectedGroup}
                                        onChange={(e) => setSelectedGroup && setSelectedGroup(e.target.value)}
                                        renderValue={selected => selected ? selected : 'Select Group'}
                                        disabled={loadingGroups}
                                    >
                                        {loadingGroups ? (
                                            <MenuItem disabled><CircularProgress size={16} sx={{ mr: 1 }} /> Loading...</MenuItem>
                                        ) : (
                                            groups.map(g => (
                                                <MenuItem key={g.name} value={g.name}>{g.display_name}</MenuItem>
                                            ))
                                        )}
                                    </Select>
                                )}
                            </Box>

                            {/* Row 2: Client (appears after group is selected) */}
                            {selectedGroup && (
                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={clients.map(c => c.display_name)}
                                    value={selectedClient || []}
                                    onChange={(_e, newValue) => setSelectedClient && setSelectedClient(newValue)}
                                    loading={loadingClients}
                                    disableCloseOnSelect
                                    renderOption={(props, option, { selected }) => (
                                        <li {...props} style={{ ...props.style, padding: '2px 8px', fontSize: 12 }}>
                                            <Checkbox
                                                size="small"
                                                checked={selected}
                                                sx={{ mr: 0.5, p: 0.25 }}
                                            />
                                            {option}
                                        </li>
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => (
                                            <Chip
                                                label={option}
                                                {...getTagProps({ index })}
                                                size="small"
                                                sx={{ fontSize: 10, height: 20 }}
                                            />
                                        ))
                                    }
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            placeholder={selectedClient?.length ? '' : 'Search Client...'}
                                            sx={{ '& .MuiInputBase-root': { fontSize: 12, py: '2px' } }}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingClients ? <CircularProgress size={16} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    sx={{ width: '100%' }}
                                />
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
