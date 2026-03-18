
import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

interface LoadingInfoProps {
    loaded: number;
    total: number;
    error?: boolean;
}

const LoadingInfo: React.FC<LoadingInfoProps> = ({ loaded, total, error }) => {
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    // Hide when progress is 100%
    if (percent === 100) return null;
    return (
        <Box
            sx={{
                position: "absolute",
                left: "50%",
                bottom: 32,
                transform: "translateX(-50%)",
                zIndex: 1200,
                background: "rgba(30,30,30,0.92)",
                color: "#fff",
                px: 2.5,
                py: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                pointerEvents: "none",
                borderRadius: 999,
                minWidth: 220,
                maxWidth: 320,
                boxShadow: 3,
            }}
        >
            {error ? (
                <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
                    No images found
                </Typography>
            ) : (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Images loaded: {loaded} / {total} ({percent}%)
                </Typography>
            )}
            {!error && (
                <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                        width: "90%",
                        height: 12,
                        borderRadius: 999,
                        background: "#444",
                        mt: 0.5,
                    }}
                />
            )}
        </Box>
    );
};

export default LoadingInfo;
