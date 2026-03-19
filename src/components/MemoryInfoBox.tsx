import React from "react";
import { useSelector } from "react-redux";
import { layerSections } from "./layer-control-center/layerConfig";
import { LayerLoadEntry } from "./tree-menu/Layout";
import { useDraggable } from "../hooks/useDraggable";
const MonitorHeartIcon = ({ size = 16, color = "#1976d2" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
        <path d="M15.11 12.45L14 10.24l-3.11 6.21c-.16.34-.51.55-.89.55s-.73-.21-.89-.55L7.38 13H2v-2h6c.38 0 .72.21.89.55L10 13.76l3.11-6.21c.34-.68 1.45-.68 1.79 0L16.62 11H22v2h-6c-.38 0-.72-.21-.89-.55z"/>
    </svg>
);

const ExpandIcon = ({ expanded, color = "#90a4ae" }: { expanded: boolean; color?: string }) => (
    <svg width={18} height={18} viewBox="0 0 24 24" fill={color}
        style={{ transform: expanded ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }}>
        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
    </svg>
);

interface MemoryInfoBoxProps {
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    percent: number;
  } | null;
  cpu: {
    total_cores: number;
    physical_cores: number;
    cpu_percent: number;
  } | null;
  layerTimings: Array<{ key: string; label: string; duration: number }>;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  layerLoadStatus?: LayerLoadEntry[];
}

// Collect all mainCheck stateKeys so we can exclude "Select All" from the active list
const mainCheckStateKeys = new Set<string>();
for (const section of layerSections) {
  if (section.mainCheck?.stateKey) {
    mainCheckStateKeys.add(section.mainCheck.stateKey);
  }
}

const MemoryInfoBox: React.FC<MemoryInfoBoxProps> = ({ memory, cpu, layerTimings, isCollapsed, setIsCollapsed, layerLoadStatus = [] }) => {
  const layersState = useSelector((state: any) => state.geoJson?.layers || {});
  const { elementRef, positionStyle, onMouseDown, onClickCapture, parkToCorner, restorePosition } = useDraggable();

  // Derive active layers from Redux — only individual layers the user toggled visible
  // Skip headings and "Select All" mainCheck entries
  const activeVisibleLayers: Array<{ key: string; label: string; loading: boolean; error?: string }> = [];
  for (const section of layerSections) {
    for (const cb of section.checkboxes) {
      if (cb.isHeading || !cb.stateKey) continue;
      // Skip "Select All" / mainCheck entries — they aren't real data layers
      if (mainCheckStateKeys.has(cb.stateKey)) continue;
      const layerState = layersState[cb.stateKey];
      if (layerState?.visible) {
        activeVisibleLayers.push({
          key: cb.stateKey,
          label: cb.label,
          loading: !!layerState.loading,
          error: layerState.error,
        });
      }
    }
  }

  // Filter render timings to only show currently visible layers
  const activeStateKeys = new Set(activeVisibleLayers.map(l => l.key));
  const activeLabels = new Set(activeVisibleLayers.map(l => l.label));
  const visibleTimings = layerTimings.filter(
    t => activeStateKeys.has(t.key) || activeLabels.has(t.label)
  );

  // Background data fetches (from Layout initial load, not yet toggled on)
  const fetchingLayers = layerLoadStatus.filter(
    e => e.status === 'loading' && !activeVisibleLayers.some(a => a.key === e.key)
  );

  // Data fetch progress bar: how many of the initial fetches are done?
  const totalFetch = layerLoadStatus.length;
  const loadedFetch = layerLoadStatus.filter(e => e.status === 'loaded').length;
  const errorFetch = layerLoadStatus.filter(e => e.status === 'error').length;
  const doneFetch = loadedFetch + errorFetch;
  const fetchPercent = totalFetch > 0 ? Math.round((doneFetch / totalFetch) * 100) : 100;
  const fetchComplete = totalFetch === 0 || doneFetch === totalFetch;
  const fetchHasErrors = errorFetch > 0;

  const hasMetrics = (memory && memory.usedJSHeapSize != null && memory.jsHeapSizeLimit != null && memory.percent != null)
    || (cpu && cpu.cpu_percent != null && cpu.total_cores != null && cpu.physical_cores != null);
  const hasActiveLayers = activeVisibleLayers.length > 0 || fetchingLayers.length > 0;

  if (!hasMetrics && !hasActiveLayers && fetchComplete) {
    return null;
  }

  const anyLoading = activeVisibleLayers.some(l => l.loading) || fetchingLayers.length > 0;
  const anyErrors = activeVisibleLayers.some(l => !!l.error);

  return (
    <div
      ref={elementRef}
      style={{
        position: "absolute",
        bottom: 16,
        right: 16,
        background: "linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(232,243,255,0.95) 100%)",
        borderRadius: 10,
        padding: isCollapsed ? "6px 12px" : "10px 14px 8px 14px",
        boxShadow: "0 2px 12px 0 rgba(25,118,210,0.08), 0 0 0 1px rgba(25,118,210,0.06)",
        zIndex: 1301,
        fontSize: 12,
        minWidth: isCollapsed ? "auto" : 210,
        maxWidth: 250,
        border: "1px solid rgba(179,198,224,0.3)",
        color: "#1a237e",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
        letterSpacing: 0.1,
        userSelect: "none",
        backdropFilter: "blur(8px)",
        transition: "box-shadow 0.25s ease",
        overflow: "hidden",
        ...positionStyle,
      }}
    >
      {/* Header — drag handle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: isCollapsed ? 0 : 5,
          cursor: "grab",
        }}
        onMouseDown={onMouseDown}
        onClickCapture={onClickCapture}
        onClick={() => {
          const next = !isCollapsed;
          setIsCollapsed(next);
          if (next) parkToCorner(true);
          else restorePosition(true);
        }}
      >
        <div style={{ fontWeight: 700, color: "#1976d2", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <MonitorHeartIcon />
          {!isCollapsed && "System Metrics"}
          {(!fetchComplete || anyLoading) && (
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#1976d2",
              display: "inline-block",
              animation: "memPulse 1.2s ease-in-out infinite",
            }} />
          )}
        </div>
        <ExpandIcon expanded={!isCollapsed} />
      </div>

      {/* Data Fetch Progress Bar — always visible when data is being fetched */}
      {!isCollapsed && totalFetch > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3,
          }}>
            <span style={{ fontWeight: 600, color: "#0288d1", fontSize: 11 }}>
              Data Fetch
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: fetchHasErrors ? "#d32f2f" : fetchComplete ? "#388e3c" : "#1976d2",
            }}>
              {fetchComplete
                ? (fetchHasErrors ? `${loadedFetch}/${totalFetch} loaded` : "Complete")
                : `${doneFetch} / ${totalFetch}`
              }
            </span>
          </div>
          {/* Progress track */}
          <div style={{
            height: 5, borderRadius: 3,
            background: "#e8eaf6",
            overflow: "hidden",
            position: "relative",
            border: "1px solid #c5cae9",
          }}>
            {/* Filled portion */}
            <div style={{
              height: "100%",
              width: `${fetchPercent}%`,
              borderRadius: 3,
              background: fetchHasErrors
                ? "linear-gradient(90deg, #ef5350 0%, #e53935 100%)"
                : fetchComplete
                  ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                  : "linear-gradient(90deg, #42a5f5 0%, #1e88e5 100%)",
              transition: "width 0.5s ease, background 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Shimmer animation while loading */}
              {!fetchComplete && (
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                  animation: "progressShimmer 1.5s ease-in-out infinite",
                }} />
              )}
            </div>
          </div>
          {/* Per-layer mini status dots */}
          <div style={{
            display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap", alignItems: "center",
          }}>
            {layerLoadStatus.map((entry) => (
              <div
                key={entry.key}
                title={`${entry.label}: ${entry.status}`}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: entry.status === 'loaded' ? "#43e97b"
                    : entry.status === 'error' ? "#ef5350"
                    : "#90caf9",
                  transition: "background 0.3s ease",
                  animation: entry.status === 'loading' ? "memPulse 1s ease-in-out infinite" : undefined,
                  cursor: "default",
                }}
              />
            ))}
            <span style={{ fontSize: 9, color: "#90a4ae", marginLeft: 3 }}>
              {!fetchComplete && `${fetchPercent}%`}
            </span>
          </div>
        </div>
      )}

      {/* Active Layers */}
      {!isCollapsed && hasActiveLayers && (
        <div style={{ marginBottom: 8 }}>
          <div style={{
            fontWeight: 600, color: "#0288d1", marginBottom: 3, fontSize: 11,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Active Layers</span>
            <span style={{
              fontSize: 10, fontWeight: 600,
              color: anyErrors ? "#d32f2f" : anyLoading ? "#1976d2" : "#388e3c",
            }}>
              {anyLoading ? "Loading..." : `${activeVisibleLayers.length} active`}
            </span>
          </div>

          <ul style={{
            margin: 0, padding: 0, listStyle: "none",
          }}>
            {/* Background data fetches (not yet toggled on) */}
            {fetchingLayers.map((entry) => (
              <li
                key={entry.key}
                style={{
                  fontSize: 11, padding: "2px 0",
                  borderBottom: "1px solid #e3f2fd",
                  display: "flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{
                  width: 10, height: 10, flexShrink: 0,
                  border: "1.5px solid #90a4ae",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }} />
                <span style={{ flex: 1, color: "#78909c", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 10 }}>
                  {entry.label}
                </span>
                <span style={{ fontSize: 9, color: "#90a4ae", flexShrink: 0 }}>fetching</span>
              </li>
            ))}

            {/* Visible (toggled-on) layers */}
            {activeVisibleLayers.map((layer) => {
              const timing = layerTimings.find(t => t.label === layer.label || t.key === layer.key);
              return (
                <li
                  key={layer.key}
                  style={{
                    fontSize: 11, padding: "2px 0",
                    borderBottom: "1px solid #e3f2fd",
                    display: "flex", alignItems: "center", gap: 5,
                    animation: "fadeGreen 0.5s ease",
                  }}
                >
                  {layer.loading ? (
                    <span style={{
                      width: 10, height: 10, flexShrink: 0,
                      border: "1.5px solid #1976d2",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.8s linear infinite",
                    }} />
                  ) : layer.error ? (
                    <span style={{ fontSize: 11, flexShrink: 0, width: 10, textAlign: "center", color: "#d32f2f" }}>✗</span>
                  ) : (
                    <span style={{ fontSize: 11, flexShrink: 0, width: 10, textAlign: "center", color: "#388e3c" }}>✓</span>
                  )}

                  <span style={{
                    flex: 1,
                    color: layer.error ? "#d32f2f" : layer.loading ? "#1565c0" : "#388e3c",
                    fontWeight: layer.loading ? 600 : 400,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    fontSize: 10,
                  }}>
                    {layer.label}
                  </span>

                  <span style={{
                    fontSize: 10, flexShrink: 0, minWidth: 32, textAlign: "right",
                    color: layer.error ? "#d32f2f" : layer.loading ? "#90a4ae" : "#388e3c",
                    fontWeight: 500,
                  }}>
                    {layer.loading ? "..." : layer.error ? "Failed" : timing ? `${timing.duration.toFixed(0)}ms` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* No active layers */}
      {!isCollapsed && !hasActiveLayers && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: "#0288d1", marginBottom: 2, fontSize: 11 }}>
            Active Layers
          </div>
          <div style={{ color: "#b0bec5", fontStyle: "italic", fontSize: 10 }}>
            No layers enabled
          </div>
        </div>
      )}

      {/* RAM */}
      {!isCollapsed && memory && memory.usedJSHeapSize != null && memory.jsHeapSizeLimit != null && memory.percent != null && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2, fontSize: 11, letterSpacing: 0.2 }}>
            RAM
          </div>
          <div style={{ fontSize: 10, marginBottom: 2, color: "#607d8b" }}>
            {(memory.usedJSHeapSize / 1048576).toFixed(0)}<span style={{ color: "#90a4ae" }}>/</span>{(memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB
            <b style={{ marginLeft: 6, color: memory.percent < 80 ? "#388e3c" : "#d32f2f" }}>
              {memory.percent.toFixed(0)}%
            </b>
          </div>
          <div style={{
            height: 4, borderRadius: 2,
            background: "#e8eaf6",
            overflow: "hidden",
            border: "1px solid #c5cae9",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min(memory.percent, 100)}%`,
              background: memory.percent < 70
                ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                : memory.percent < 90
                  ? "linear-gradient(90deg, #ffd54f 0%, #ffb300 100%)"
                  : "linear-gradient(90deg, #ff6a6a 0%, #d32f2f 100%)",
              borderRadius: 2, transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      {/* CPU */}
      {!isCollapsed && cpu && cpu.cpu_percent != null && cpu.total_cores != null && cpu.physical_cores != null && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2, fontSize: 11, letterSpacing: 0.2 }}>
            CPU
          </div>
          <div style={{ fontSize: 10, marginBottom: 2, color: "#607d8b", display: "flex", alignItems: "center", gap: 6 }}>
            <b style={{ color: cpu.cpu_percent < 80 ? "#388e3c" : "#d32f2f" }}>{cpu.cpu_percent.toFixed(0)}%</b>
            <span style={{
              flex: 1, height: 4, borderRadius: 2,
              background: "#e8eaf6", overflow: "hidden",
              border: "1px solid #c5cae9",
            }}>
              <span style={{
                display: "block", height: "100%",
                width: `${Math.min(cpu.cpu_percent, 100)}%`,
                background: cpu.cpu_percent < 70
                  ? "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"
                  : cpu.cpu_percent < 90
                    ? "linear-gradient(90deg, #ffd54f 0%, #ffb300 100%)"
                    : "linear-gradient(90deg, #ff6a6a 0%, #d32f2f 100%)",
                borderRadius: 2, transition: "width 0.3s",
              }} />
            </span>
            <span style={{ fontSize: 9, color: "#90a4ae" }}>{cpu.total_cores}c</span>
          </div>
        </div>
      )}

      {/* Render Timings — only for currently visible layers */}
      {!isCollapsed && visibleTimings.length > 0 && (
        <>
          <div style={{ fontWeight: 600, color: "#0288d1", marginBottom: 2, fontSize: 11 }}>
            Render Timings
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {visibleTimings.map((item) => (
              <li
                key={item.key}
                style={{
                  fontSize: 10, padding: "1px 0",
                  borderBottom: "1px solid #90caf911",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}
              >
                <span style={{ color: "#1565c0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 100 }}>
                  {item.label}
                </span>
                <span style={{ color: "#0288d1", marginLeft: 6, fontSize: 10 }}>
                  {item.duration.toFixed(0)}ms
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes memPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
          @keyframes fadeGreen {
            from { background-color: rgba(56, 142, 60, 0.12); }
            to { background-color: transparent; }
          }
          @keyframes progressShimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}
      </style>
    </div>
  );
};

export default MemoryInfoBox;
