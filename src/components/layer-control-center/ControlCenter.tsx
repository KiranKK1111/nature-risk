import React from 'react';
import { layerSections, LayerCheckboxConfig, MainCheckboxConfig } from './layerConfig';
import { pushLayerTiming, removeLayerTiming, startLayerTiming } from '../MapLegend';
import '../map-view/map.css';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setLayerOption, setLayerVisibility } from '../../redux-store/actions/geoLayerAction';
import { Checkbox, FormControlLabel, FormGroup, Tooltip, Typography, Accordion, AccordionSummary, AccordionDetails, Box, Card, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getAssetUrl } from '../../utils/publicPath';

export default function ControlCenter(): JSX.Element {
    const dispatch = useDispatch();

    // Use new generic state structure
    const layersState = useSelector((state: any) => state.geoJson?.layers || {});
    const getReduxValue = (stateKey?: string): boolean => {
        if (!stateKey) return false;
        return layersState[stateKey]?.visible || false;
    };
    
    // For storing selected options for layers with options (like MSA)
    const getReduxOption = (stateKey?: string, defaultOption?: string): string => {
        if (!stateKey) return defaultOption || '';
        return layersState[stateKey]?.selectedOption || defaultOption || '';
    };

    // Get loading state for a layer
    const getReduxLoading = (stateKey?: string): boolean => {
        if (!stateKey) return false;
        return layersState[stateKey]?.loading || false;
    };

    // Get error state for a layer
    const getReduxError = (stateKey?: string): string | null => {
        if (!stateKey) return null;
        return layersState[stateKey]?.error || null;
    };

    // Handler for dropdown/slider option change (e.g., MSA scenario)
    const handleOptionChange = (stateKey: string, value: string | number) => {
        dispatch(setLayerOption(stateKey, value));
    };

    // Generic handler for all checkboxes
    const handleDisableLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        // Find config for this checkbox or mainCheck
        let config: LayerCheckboxConfig | MainCheckboxConfig | undefined;
        let sectionForConfig: typeof layerSections[0] | undefined;
        for (const section of layerSections) {
            config = section.checkboxes.find(cb => cb.key === name);
            if (config) {
                sectionForConfig = section;
                break;
            }
            if (!config && section.mainCheck && section.mainCheck.key === name) {
                config = section.mainCheck;
                sectionForConfig = section;
                break;
            }
        }
        if (!config) return;
        // Mutual exclusivity for 'freshWaterUse', 'aerosol', 'biogeochemicalFlows', and 'biosphereIntegrity' layers: enabling one disables all others in all sections
        if (
            checked &&
            sectionForConfig &&
            (
                (sectionForConfig.sectionKey === 'freshWaterUse' && config && 'key' in config) ||
                (sectionForConfig.sectionKey === 'aerosol' && config && 'key' in config) ||
                (sectionForConfig.sectionKey === 'biogeochemicalFlows' && config && 'key' in config) ||
                (sectionForConfig.sectionKey === 'biosphereIntegrity' && config && 'key' in config)
            )
        ) {
            layerSections.forEach(section => {
                section.checkboxes.forEach(subConfig => {
                    if (!(section.sectionKey === sectionForConfig.sectionKey && subConfig.key === config.key)) {
                        dispatch(setLayerVisibility(subConfig.stateKey, false));
                    }
                });
                // Also disable mainCheck if present and not the current config
                if (
                    section.mainCheck &&
                    !(section.sectionKey === sectionForConfig.sectionKey && section.mainCheck.key === config.key)
                ) {
                    dispatch(setLayerVisibility(section.mainCheck.stateKey, false));
                }
            });
        }

        // If enabling any layer in landSystemChange, disable all layers in freshWaterUse, aerosol, biogeochemicalFlows, biosphereIntegrity
        if (
            checked &&
            sectionForConfig &&
            sectionForConfig.sectionKey === 'landSystemChange' &&
            config && 'key' in config
        ) {
            const sectionsToDisable = ['freshWaterUse', 'aerosol', 'biogeochemicalFlows', 'biosphereIntegrity'];
            layerSections.forEach(section => {
                if (sectionsToDisable.includes(section.sectionKey)) {
                    section.checkboxes.forEach(subConfig => {
                        dispatch(setLayerVisibility(subConfig.stateKey, false));
                    });
                    if (section.mainCheck) {
                        dispatch(setLayerVisibility(section.mainCheck.stateKey, false));
                    }
                }
            });
        }

        if (
            checked &&
            sectionForConfig &&
            sectionForConfig.sectionKey === 'landSystemChange' &&
            config && 'key' in config &&
            ['keyBiodiversity', 'iucn', 'ramsar', 'whs'].includes(config.key)
        ) {
            sectionForConfig.checkboxes.forEach(subConfig => {
                if (['landUseChange', 'lu'].includes(subConfig.key)) {
                    dispatch(setLayerVisibility(subConfig.stateKey, false));
                }
            });
        }

        // Timing start
        if (sectionForConfig && sectionForConfig.mainCheck && config.key === sectionForConfig.mainCheck.key) {
            // Main section checkbox toggled
            // Special logic for proximity 'Select All'
            if (sectionForConfig.sectionKey === 'landSystemChange' && config.key === 'proximity') {
                const proximityKeys = [
                    { key: 'keyBiodiversity', stateKey: 'KBAPOL2024STREAM_Layer' },
                    { key: 'iucn', stateKey: 'WDPA00STREAM_Layer' },
                    { key: 'ramsar', stateKey: 'RAMSARSTREAM_Layer' },
                    { key: 'whs', stateKey: 'WHS_STREAM_Layer' },
                ];
                if (checked) {
                    proximityKeys.forEach(subConfig => {
                        startLayerTiming(subConfig.key, subConfig.key);
                        dispatch(setLayerVisibility(subConfig.stateKey, true));
                    });
                } else {
                    proximityKeys.forEach(subConfig => {
                        removeLayerTiming(subConfig.key);
                        dispatch(setLayerVisibility(subConfig.stateKey, false));
                    });
                }
            } else {
                // Default: all sublayers in section, but NOT for landSystemChange
                if (checked) {
                    if (sectionForConfig.sectionKey !== 'landSystemChange') {
                        sectionForConfig.checkboxes.forEach(subConfig => {
                            const label = subConfig.label || subConfig.key;
                            startLayerTiming(subConfig.key, label);
                            dispatch(setLayerVisibility(subConfig.stateKey, true));
                        });
                    }
                } else {
                    if (sectionForConfig.sectionKey !== 'landSystemChange') {
                        sectionForConfig.checkboxes.forEach(subConfig => {
                            removeLayerTiming(subConfig.key);
                            dispatch(setLayerVisibility(subConfig.stateKey, false));
                        });
                    }
                }
            }
        } else if (checked && 'label' in config) {
            // Single sublayer checkbox toggled on
            const label = 'label' in config && config.label ? config.label : config.key;
            startLayerTiming(config.key, label);
        }

        // Mutual exclusivity for 'tree cover loss' and 'land use' in landSystemChange
        if (
            checked &&
            sectionForConfig &&
            sectionForConfig.sectionKey === 'landSystemChange' &&
            config &&
            'key' in config &&
            (config.key === 'landUseChange' || config.key === 'lu')
        ) {
            // If enabling 'tree cover loss', disable all except itself
            sectionForConfig.checkboxes.forEach(subConfig => {
                if (subConfig.key !== config.key) {
                    dispatch(setLayerVisibility(subConfig.stateKey, false));
                }
            });
        } else if (
            checked &&
            sectionForConfig &&
            sectionForConfig.oneCheckBoxAtATime &&
            config &&
            'key' in config &&
            (!sectionForConfig.mainCheck || config.key !== sectionForConfig.mainCheck.key)
        ) {
            sectionForConfig.checkboxes.forEach(subConfig => {
                if (subConfig.key !== config?.key) {
                    dispatch(setLayerVisibility(subConfig.stateKey, false));
                }
            });
        }

        // If enabling any sub-layer, also enable its mainCheck
        if (checked && sectionForConfig && sectionForConfig.mainCheck && config.key !== sectionForConfig.mainCheck.key) {
            const mainCheck = sectionForConfig.mainCheck;
            dispatch(setLayerVisibility(mainCheck.stateKey, true));
        }

        // If disabling any sub-layer, check if all sub-layers are now disabled, then disable mainCheck
        if (!checked && sectionForConfig && sectionForConfig.mainCheck && config.key !== sectionForConfig.mainCheck.key) {
            const allSubLayersDisabled = sectionForConfig.checkboxes.every(subConfig => {
                if (subConfig.key === config?.key) return true; // This one is being disabled now
                return !getReduxValue(subConfig.stateKey);
            });
            if (allSubLayersDisabled) {
                const mainCheck = sectionForConfig.mainCheck;
                dispatch(setLayerVisibility(mainCheck.stateKey, false));
            }
        }

        // If enabling/disabling any mainCheck, also enable/disable all its sub-layers
        // But for landSystemChange, this is handled above for proximity only, so skip here
        if (sectionForConfig && sectionForConfig.mainCheck && config.key === sectionForConfig.mainCheck.key && sectionForConfig.sectionKey !== 'landSystemChange') {
            if (checked) {
                sectionForConfig.checkboxes.forEach(subConfig => {
                    dispatch(setLayerVisibility(subConfig.stateKey, true));
                });
            } else {
                sectionForConfig.checkboxes.forEach(subConfig => {
                    dispatch(setLayerVisibility(subConfig.stateKey, false));
                });
            }
        }

        // Dispatch the generic layer visibility action
        if (config.stateKey) {
            dispatch(setLayerVisibility(config.stateKey, checked));
        }
        // Timing end and update state
        if (config) {
            const configKey = config.key;
            // Only remove timing for sublayer if not mainCheck
            if (!checked && (!sectionForConfig || !sectionForConfig.mainCheck || configKey !== sectionForConfig.mainCheck.key)) {
                removeLayerTiming(configKey);
            }
        }
    };

    return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', flex: 1, minHeight: 0 }}>
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: { xs: 1, sm: 2 }, bgcolor: '#f7fafd' }}>
                {layerSections.map((section, idx) => (
                    <Accordion key={section.sectionKey} defaultExpanded={idx === 0} sx={{
                        mb: 2,
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(33,147,176,0.10)',
                        bgcolor: '#fff',
                        '&:before': { display: 'none' },
                        overflow: 'hidden',
                    }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{
                            bgcolor: '#e3f2fd',
                            borderBottom: '1px solid #b0bec5',
                            minHeight: 48,
                            '& .MuiTypography-root': { fontWeight: 700, fontSize: 16 },
                        }}>
                            <Typography>{section.title}</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0.5, pt: 1.5 }}>
                            <Card elevation={0} sx={{ bgcolor: 'transparent', boxShadow: 'none', p: 0 }}>
                                {/* Checkbox group */}
                                <FormGroup sx={{ ml: 0, gap: 0.5 }}>
                                    {section.checkboxes.map((checkbox: LayerCheckboxConfig) => {
                                        if (checkbox.isHeading) {
                                            return (
                                                <Box key={checkbox.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1, pl: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: 15, color: '#1976d2' }}>{checkbox.label}</Typography>
                                                    {checkbox.tooltip && (
                                                        <Tooltip title={checkbox.tooltip} placement="right" arrow>
                                                            <img src={getAssetUrl('static/images/info-icon.png')} alt="Info" style={{ maxWidth: "15px" }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            );
                                        }
                                        // Special logic for 'Select All' proximity checkbox
                                        if (
                                            section.sectionKey === 'landSystemChange' &&
                                            checkbox.key === 'proximity'
                                        ) {
                                            // List of proximity layer stateKeys
                                            const proximityKeys = [
                                                'KBAPOL2024STREAM_Layer',
                                                'WDPA00STREAM_Layer',
                                                'RAMSARSTREAM_Layer',
                                                'WHS_STREAM_Layer',
                                            ];
                                            const allEnabled = proximityKeys.every(k => getReduxValue(k));
                                            return (
                                                <Box key={checkbox.key} sx={{ mb: 0.5, pl: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                name={checkbox.key}
                                                                checked={allEnabled}
                                                                onChange={handleDisableLayer}
                                                                size="small"
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <Typography sx={{ fontSize: 14, lineHeight: 1 }}>{checkbox.label}</Typography>
                                                                {checkbox.tooltip && (
                                                                    <Tooltip title={checkbox.tooltip} placement="right" arrow>
                                                                        <img src={getAssetUrl('static/images/info-icon.png')} alt="Info" style={{ maxWidth: "15px" }} />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                </Box>
                                            );
                                        }
                                        // Special rendering for Land Use (lu) with a year slider
                                        if (checkbox.key === 'lu' && Array.isArray(checkbox.options)) {
                                            // Extract years from options
                                            const years = checkbox.options.map(opt => Number(opt.key)).sort((a, b) => a - b);
                                            const selectedYear = Number(getReduxOption(checkbox.stateKey, checkbox.defaultOption));
                                            const isLoading = getReduxLoading(checkbox.stateKey);
                                            const layerError = getReduxError(checkbox.stateKey);
                                            return (
                                                <Box key={checkbox.key} sx={{ mb: 0.5, pl: 2 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                name={checkbox.key}
                                                                checked={getReduxValue(checkbox.stateKey)}
                                                                onChange={handleDisableLayer}
                                                                size="small"
                                                                disabled={isLoading}
                                                            />
                                                        }
                                                        label={
                                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                {isLoading && (
                                                                    <CircularProgress size={14} thickness={5} sx={{ mr: 0.5 }} />
                                                                )}
                                                                <Typography sx={{ fontSize: 14, lineHeight: 1, color: layerError ? 'error.main' : 'inherit' }}>
                                                                    {checkbox.label}{layerError ? ' (failed)' : ''}
                                                                </Typography>
                                                                {checkbox.tooltip && (
                                                                    <Tooltip title={layerError || checkbox.tooltip} placement="right" arrow>
                                                                        <img src={getAssetUrl('static/images/info-icon.png')} alt="Info" style={{ maxWidth: "15px" }} />
                                                                    </Tooltip>
                                                                )}
                                                            </Box>
                                                        }
                                                    />
                                                    {/* Year selector for Land Use */}
                                                    {getReduxValue(checkbox.stateKey) && (
                                                        <Box sx={{
                                                            pt: 0.5, pb: 1,
                                                            display: 'flex',
                                                            flexWrap: 'nowrap',
                                                            justifyContent: 'center',
                                                            gap: 0.2,
                                                            pr: 1.5,
                                                            width: '100%',
                                                        }}>
                                                            {years.map(year => (
                                                                <Box
                                                                    key={year}
                                                                    onClick={() => handleOptionChange(checkbox.stateKey!, year)}
                                                                    sx={{
                                                                        textAlign: 'center',
                                                                        px: 1,
                                                                        py: 0.3,
                                                                        fontSize: 11,
                                                                        lineHeight: 1.4,
                                                                        whiteSpace: 'nowrap',
                                                                        fontWeight: selectedYear === year ? 600 : 400,
                                                                        color: selectedYear === year ? '#fff' : '#546e7a',
                                                                        background: selectedYear === year
                                                                            ? 'linear-gradient(135deg, #1976d2, #1565c0)'
                                                                            : '#eceff1',
                                                                        borderRadius: '10px',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease',
                                                                        userSelect: 'none',
                                                                        '&:hover': {
                                                                            background: selectedYear === year
                                                                                ? 'linear-gradient(135deg, #1565c0, #0d47a1)'
                                                                                : '#cfd8dc',
                                                                        },
                                                                    }}
                                                                >
                                                                    {year}
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    )}
                                                </Box>
                                            );
                                        }
                                        // Default rendering for other checkboxes
                                        const isLayerLoading = getReduxLoading(checkbox.stateKey);
                                        const layerErr = getReduxError(checkbox.stateKey);
                                        return (
                                            <Box key={checkbox.key} sx={{ mb: 0.5, pl: 2 }}>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            name={checkbox.key}
                                                            checked={getReduxValue(checkbox.stateKey)}
                                                            onChange={handleDisableLayer}
                                                            size="small"
                                                            disabled={isLayerLoading}
                                                        />
                                                    }
                                                    label={
                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                                            {isLayerLoading && (
                                                                <CircularProgress size={14} thickness={5} sx={{ mr: 0.5 }} />
                                                            )}
                                                            <Typography sx={{ fontSize: 14, lineHeight: 1, color: layerErr ? 'error.main' : 'inherit' }}>
                                                                {checkbox.label}{layerErr ? ' (failed)' : ''}
                                                            </Typography>
                                                            {checkbox.tooltip && (
                                                                <Tooltip title={layerErr || checkbox.tooltip} placement="right" arrow>
                                                                    <img src={getAssetUrl('static/images/info-icon.png')} alt="Info" style={{ maxWidth: "15px" }} />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    }
                                                />
                                            </Box>
                                        );
                                    })}
                                </FormGroup>
                            </Card>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
}