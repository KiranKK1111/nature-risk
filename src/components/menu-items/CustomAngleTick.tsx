import React from 'react';
import { Tooltip, Box, Card, Typography } from '@mui/material';
import { CustomToolTipContent } from './radar-data';

export const CustomAngleTick = (props: any) => {
    const { payload, x, y, index, ...rest } = props;
    const dataItem = CustomToolTipContent.find(d => d.subject === payload.value);

    // Dynamically calculate label position based on axis index and total axes
    // Try to get the number of axes from the data array
    const totalAxes = CustomToolTipContent.length;
    // Use elliptical radii for label placement (distance from center)
    const labelRadiusX = 340; // horizontal radius (side labels further out)
    const labelRadiusY = 260; // vertical radius (top/bottom labels closer)
    // Try to get chart center from props, fallback to x/y
    const cx = rest.cx !== undefined ? rest.cx : x;
    const cy = rest.cy !== undefined ? rest.cy : y;
    // Calculate angle for this axis (in radians)
    const angle = (2 * Math.PI * index) / totalAxes;
    // Calculate label position using elliptical radii
    const labelX = cx + labelRadiusX * Math.cos(angle - Math.PI / 2);
    const labelY = cy + labelRadiusY * Math.sin(angle - Math.PI / 2);

    // Dynamically calculate card width based on label length
    const labelText = payload.value || '';
    // Estimate width: 8px per character, min 90, max 220
    const estimatedWidth = Math.min(Math.max(labelText.length * 8 + 40, 90), 220);
    const cardWidth = estimatedWidth;
    const cardHeight = 50;

    return (
        <foreignObject
            x={labelX - cardWidth / 2}
            y={labelY - cardHeight / 2}
            width={cardWidth}
            height={cardHeight}
            style={{ overflow: 'visible' }}
        >
            <Tooltip
                title={
                    <Box sx={{ p: 1 }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                            {dataItem?.tooltip || ''}
                        </Typography>
                    </Box>
                }
                arrow
                placement="top"
                componentsProps={{
                    popper: {
                        sx: {
                            zIndex: 20000, // or higher than your modal's z-index
                        },
                    },
                    tooltip: {
                        sx: {
                            bgcolor: '#1E293B',
                            color: 'white',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                            borderRadius: '12px',
                            maxWidth: '320px',
                            fontSize: '13px',
                            padding: '12px 16px',
                            '& .MuiTooltip-arrow': {
                                color: '#1E293B',
                            },
                        },
                    },
                }}
            >
                <Card
                    sx={{
                        px: 2.5,
                        py: 1.5,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '1px solid #E2E8F0',
                        bgcolor: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        transition: 'all 0.2s ease',
                        borderRadius: '8px',
                        minWidth: 90,
                        maxWidth: 220,
                        width: cardWidth,
                        '&:hover': {
                            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.25)',
                            borderColor: '#3B82F6',
                            transform: 'translateY(-2px)',
                        },
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: '#0F172A',
                            fontSize: '13px',
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {payload.value}
                    </Typography>
                </Card>
            </Tooltip>
        </foreignObject>
    );
};