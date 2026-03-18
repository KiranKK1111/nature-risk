import { Box } from '@mui/material';
import { Check } from 'lucide-react';
import React from 'react';

interface ShimmerLoaderProps {
    progress: number;
    layerNames?: string[];
}

function buildLoadingSteps(layerNames?: string[]) {
    if (layerNames && layerNames.length > 0) {
        return layerNames.map((name, i) => ({
            label: `Loading ${name}`,
            threshold: ((i + 1) / layerNames.length) * 100,
        }));
    }
    // Fallback when no layer names provided
    return [
        { label: 'Initializing Dashboard', threshold: 25 },
        { label: 'Loading Environmental Data', threshold: 50 },
        { label: 'Rendering Layers', threshold: 75 },
        { label: 'Finalizing', threshold: 100 },
    ];
}

export function ShimmerLoader({ progress, layerNames }: ShimmerLoaderProps) {
    const loadingSteps = buildLoadingSteps(layerNames);
    const activeStep = loadingSteps.findIndex(step => progress < step.threshold);
    const currentStep = activeStep === -1 ? loadingSteps.length : activeStep;

    return (
        <Box
            sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 1400,
                background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #ECFDF5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                overflow: 'hidden',
            }}
        >
            {/* Animated background orbs */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '20%',
                    left: '10%',
                    width: '288px',
                    height: '288px',
                    bgcolor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'pulse 3s ease-in-out infinite',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '20%',
                    right: '10%',
                    width: '384px',
                    height: '384px',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    animation: 'pulse 3s ease-in-out infinite',
                    animationDelay: '1s',
                }}
            />

            <Box
                sx={{
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: '768px',
                    width: '100%',
                }}
            >
                {/* Progress Steps */}
                <Box
                    sx={{
                        mb: 6,
                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '20px',
                        p: 4,
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08)',
                        maxHeight: '60vh',
                        overflowY: 'auto',
                    }}
                >

                    {/* Custom Stepper */}
                    <Box sx={{ width: '100%' }}>
                        {loadingSteps.map((step, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: index < loadingSteps.length - 1 ? 2.5 : 0,
                                    position: 'relative',
                                }}
                            >
                                {/* Step Circle */}
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: index < currentStep ? 'none' : '2px solid #CBD5E1',
                                        bgcolor: index < currentStep ? '#10B981' : index === currentStep ? '#3B82F6' : '#F1F5F9',
                                        color: 'white',
                                        fontWeight: 700,
                                        fontSize: '14px',
                                        transition: 'all 0.4s ease',
                                        boxShadow: index === currentStep ? '0 4px 12px rgba(59, 130, 246, 0.4)' : index < currentStep ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                                        position: 'relative',
                                        zIndex: 2,
                                        flexShrink: 0,
                                        animation: index === currentStep ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                    }}
                                >
                                    {index < currentStep ? (
                                        <Check className="w-5 h-5" />
                                    ) : index === currentStep ? (
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                bgcolor: 'white',
                                                borderRadius: '50%',
                                                animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
                                            }}
                                        />
                                    ) : (
                                        <Box sx={{ color: '#94A3B8', fontWeight: 600 }}>{index + 1}</Box>
                                    )}
                                </Box>

                                {/* Step Label */}
                                <Box sx={{ ml: 3, flex: 1, textAlign: 'left' }}>
                                    <Box
                                        sx={{
                                            fontSize: '15px',
                                            fontWeight: index <= currentStep ? 700 : 500,
                                            color: index <= currentStep ? '#0F172A' : '#94A3B8',
                                            transition: 'all 0.3s ease',
                                            mb: 0.5,
                                        }}
                                    >
                                        {step.label}
                                    </Box>
                                    {index === currentStep && (
                                        <Box
                                            sx={{
                                                fontSize: '12px',
                                                color: '#3B82F6',
                                                fontWeight: 600,
                                                animation: 'fadeIn 0.3s ease-in',
                                            }}
                                        >
                                            In Progress...
                                        </Box>
                                    )}
                                    {index < currentStep && (
                                        <Box
                                            sx={{
                                                fontSize: '12px',
                                                color: '#10B981',
                                                fontWeight: 600,
                                            }}
                                        >
                                            Completed
                                        </Box>
                                    )}
                                </Box>

                                {/* Connector Line */}
                                {index < loadingSteps.length - 1 && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: 19,
                                            top: 40,
                                            width: 2,
                                            height: 32,
                                            bgcolor: index < currentStep ? '#10B981' : '#E2E8F0',
                                            transition: 'all 0.4s ease',
                                            zIndex: 1,
                                        }}
                                    />
                                )}
                            </Box>
                        ))}
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mt: 4, px: 1 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1.5,
                            }}
                        >
                            <Box sx={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
                                Loading Progress
                            </Box>
                            <Box sx={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6' }}>
                                {Math.round(progress)}%
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                height: 12,
                                bgcolor: '#F1F5F9',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                border: '1px solid #E2E8F0',
                                position: 'relative',
                            }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 50%, #8B5CF6 100%)',
                                    borderRadius: '20px',
                                    transition: 'width 0.3s ease',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&::after': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                                        animation: 'shimmerSlide 1.5s infinite',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Loading text */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            bgcolor: '#3B82F6',
                            borderRadius: '50%',
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                    />
                    <Box
                        sx={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#64748B',
                            letterSpacing: '0.05em',
                            animation: 'pulse 2s ease-in-out infinite',
                        }}
                    >
                        Loading Environmental Dashboard...
                    </Box>
                </Box>
            </Box>

            <style>
                {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes shimmerSlide {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
            </style>
        </Box>
    );
}
