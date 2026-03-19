
import React, { useEffect, useState, useRef } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

interface LoadingInfoProps {
    loaded: number;
    total: number;
    error?: boolean;
}

const COMPLETE_DISPLAY_MS = 1200;

const LoadingInfo: React.FC<LoadingInfoProps> = ({ loaded, total, error }) => {
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const isComplete = percent === 100;
    const [visible, setVisible] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const wasLoading = useRef(false);

    useEffect(() => {
        if (total > 0 && !isComplete) {
            // Loading started
            wasLoading.current = true;
            setVisible(true);
            if (hideTimer.current) {
                clearTimeout(hideTimer.current);
                hideTimer.current = null;
            }
        } else if (isComplete && wasLoading.current) {
            // Just finished — show 100% briefly then hide
            setVisible(true);
            hideTimer.current = setTimeout(() => {
                setVisible(false);
                wasLoading.current = false;
                hideTimer.current = null;
            }, COMPLETE_DISPLAY_MS);
        } else if (total === 0) {
            setVisible(false);
            wasLoading.current = false;
        }

        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
        };
    }, [total, isComplete]);

    if (!visible) return null;

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
                opacity: isComplete ? 0 : 1,
                transition: `opacity ${COMPLETE_DISPLAY_MS}ms ease`,
            }}
        >
            {error ? (
                <Typography variant="body2" color="error" sx={{ mb: 0.5 }}>
                    No images found
                </Typography>
            ) : (
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                    {isComplete ? "Loaded!" : `Loading image: ${loaded} / ${total} (${percent}%)`}
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
                        '& .MuiLinearProgress-bar': {
                            transition: 'transform 0.4s ease',
                        },
                    }}
                />
            )}
        </Box>
    );
};

export default LoadingInfo;
