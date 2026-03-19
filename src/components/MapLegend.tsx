import React from "react";
import { CLIENT_ASSETS_COLOR, SCB_ASSETS_COLOR, SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION } from "./geo-json-layer/color-constants";
import { useSelector } from "react-redux";
import { LEGEND_DATA } from "./LegendData";
import { useDraggable } from "../hooks/useDraggable";
import "./map-view/map.css";

const LayersIcon = ({ size = 16, color = "#1976d2" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
    </svg>
);

const ExpandIcon = ({ expanded, color = "#1976d2" }: { expanded: boolean; color?: string }) => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={color}
        style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }}>
        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </svg>
);

interface MapLegendProps {
    activeView?: string;
}

// --- Layer timing tracker ---
const layerTimingStart: Record<string, { label: string; start: number }> = {};

// Call this when layer loading starts
export function startLayerTiming(key: string, label: string) {
    layerTimingStart[key] = { label, start: performance.now() };
}

// Call this when layer loading finishes
export function finishLayerTiming(key: string) {
    const entry = layerTimingStart[key];
    if (entry) {
        const duration = performance.now() - entry.start;
        pushLayerTiming({ key, label: entry.label, duration });
        delete layerTimingStart[key];
    }
}

// Remove timing entry
export function pushLayerTiming(timing: {
    key: string;
    label: string;
    duration: number;
    remove?: boolean;
}) {
    window.dispatchEvent(new CustomEvent("layer-timing", { detail: timing }));
}

export function removeLayerTiming(key: string) {
    window.dispatchEvent(
        new CustomEvent("layer-timing", { detail: { key, remove: true } })
    );
    delete layerTimingStart[key];
}

function renderLegends(layers: any) {
    return Object.entries(LEGEND_DATA)
        .filter(([layerKey]) => layers?.[layerKey]?.visible)
        .map(([layerKey, items]) =>
            items.map((item: any, idx: number) => (
                <li key={layerKey + idx}>
                    <span
                        className="legend-icon"
                        style={{
                            background: item.color,
                            borderRadius: 2,
                        }}
                    />
                    <span>{item.label || item.range}</span>
                </li>
            ))
        );
}

export default function MapLegend({ activeView }: MapLegendProps): JSX.Element {
    const layers = useSelector((state: any) => state?.geoJson?.layers ?? {});
    const [legendExpanded, setLegendExpanded] = React.useState(true);
    const { elementRef, positionStyle, onMouseDown, onClickCapture, parkToCorner, restorePosition } = useDraggable();

    const legendBoxStyle: React.CSSProperties = {
        position: "absolute",
        top: 16,
        right: 16,
        background: "linear-gradient(135deg, #f8fafc 60%, #e3f0ff 100%)",
        borderRadius: 10,
        padding: legendExpanded ? "10px 14px 8px 14px" : "6px 12px",
        boxShadow: "0 2px 12px 0 #b3c6e033, 0 0 0 1px #b3c6e044 inset",
        zIndex: 1301,
        fontSize: 12,
        minWidth: legendExpanded ? 180 : undefined,
        maxWidth: 260,
        border: "1px solid #b3c6e044",
        color: "#1a237e",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        letterSpacing: 0.1,
        userSelect: "none",
        backdropFilter: "blur(2px)",
        transition: "box-shadow 0.3s ease",
        ...positionStyle,
    };

    return (
        <div ref={elementRef} style={legendBoxStyle}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: legendExpanded ? 4 : 0,
                    cursor: "grab",
                }}
                onMouseDown={onMouseDown}
                onClickCapture={onClickCapture}
                onClick={() => {
                    const next = !legendExpanded;
                    setLegendExpanded(next);
                    if (!next) parkToCorner();
                    else restorePosition();
                }}
            >
                <div style={{ fontWeight: 700, color: "#1976d2", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <LayersIcon />
                    {legendExpanded && "Legend"}
                </div>
                <ExpandIcon expanded={legendExpanded} color="#1976d2" />
            </div>
            {legendExpanded && (
                <>
                    <ul className="legend-list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
                        {activeView === "clientsNatureAssetView" ? (
                            <>
                                <li>
                                    <span className="legend-circle-icon" style={{ background: CLIENT_ASSETS_COLOR }}></span>
                                    Client Assets not within Sensitive Area
                                </li>
                                <li>
                                    <span className="legend-circle-icon" style={{ background: SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION }}></span>
                                    Client Assets within Sensitive Area
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <span className="legend-circle-icon" style={{ background: SCB_ASSETS_COLOR }}></span>
                                    Sustainable Assets
                                </li>
                                <li>
                                    <span className="legend-circle-icon" style={{ background: SCB_ASSETS_COLOR_ON_NEGETIVE_CONDITION }}></span>
                                    Unsustainable Assets
                                </li>
                            </>
                        )}
                        {renderLegends(layers)}
                    </ul>
                </>
            )}
        </div>
    );
}