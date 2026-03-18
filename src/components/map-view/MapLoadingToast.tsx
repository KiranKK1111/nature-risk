import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { layerSections } from '../layer-control-center/layerConfig';

/**
 * Floating toast overlay on the map that shows which layers are currently loading.
 * Renders one pill per loading layer, auto-hides when nothing is loading.
 */
export default function MapLoadingToast(): JSX.Element | null {
    const layersState = useSelector((state: any) => state.geoJson?.layers || {});

    // Build list of currently-loading layer labels
    const loadingLayers: string[] = [];
    for (const section of layerSections) {
        for (const cb of section.checkboxes) {
            if (cb.stateKey && layersState[cb.stateKey]?.loading) {
                loadingLayers.push(cb.label);
            }
        }
    }

    if (loadingLayers.length === 0) return null;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 72,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                pointerEvents: 'none',
                alignItems: 'center',
            }}
        >
            {loadingLayers.map((label) => (
                <Box
                    key={label}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        bgcolor: 'rgba(30, 30, 30, 0.88)',
                        color: '#fff',
                        px: 2.5,
                        py: 1,
                        borderRadius: 999,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(8px)',
                        fontSize: 13,
                        fontWeight: 500,
                        animation: 'fadeSlideIn 0.3s ease-out',
                    }}
                >
                    <CircularProgress size={14} thickness={5} sx={{ color: '#60a5fa' }} />
                    Loading {label}...
                </Box>
            ))}
            <style>
                {`
                    @keyframes fadeSlideIn {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
        </Box>
    );
}
