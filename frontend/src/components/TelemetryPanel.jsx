import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Mock SVG chart generators for "Global Network Health"
const MockLineChart = ({ color, values }) => {
  const points = values.map((val, i) => `${i * (100 / (values.length - 1))},${100 - val}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "40px", marginTop: "8px" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,100 ${points} 100,100`} fill={`${color}20`} />
    </svg>
  );
};

const MockBarChart = ({ color, values }) => {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "40px", marginTop: "8px" }}>
      {values.map((val, i) => (
        <rect
          key={i}
          x={i * (100 / values.length)}
          y={100 - val}
          width={(100 / values.length) - 2}
          height={val}
          fill={color}
        />
      ))}
    </svg>
  );
};

export default function TelemetryPanel({ nodes, connected }) {
  const [logs, setLogs] = useState([]);
  const [uptime, setUptime] = useState(0);

  // Fetch global logs periodically
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/logs`);
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch global logs", err);
      }
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `Uptime: 10 hou : ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} 1es`; // Mimicking typo from reference
  };

  const formatLogTime = (ts) => {
    const d = new Date(ts);
    return d.toISOString().split('T')[1].substring(0, 8) + ' UTC';
  };

  const activeNodesCount = nodes.filter(n => n.status === "healthy").length;
  const targetNodesCount = nodes.length;

  return (
    <div className="telemetry-panel">
      
      {/* ── Block 1: Global Status ── */}
      <div className="telemetry-block status-block">
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div className="icon-green-square">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "16px", fontWeight: 600, color: "#111827" }}>Global Status</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px", fontWeight: 500 }}>
              STATUS: <span style={{ color: "#22c55e", fontWeight: 600 }}>LIVE</span> (Active: {activeNodesCount} / Target: {targetNodesCount})
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
              {formatUptime(uptime)}
            </div>
          </div>
          <div className="status-pill">
            <div className="dot-healthy" style={{ width: 6, height: 6 }}></div>
            Live <span style={{ color: "#6b7280", fontWeight: 400 }}>{nodes.length} nodes</span>
          </div>
        </div>
      </div>

      {/* ── Block 2: Deep Telemetry Insights ── */}
      <div className="telemetry-block" style={{ flexShrink: 0, minHeight: "250px", display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Deep Telemetry Insights</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: "#4b5563" }}>ACTIVE ALERTS & INCIDENTS</span>
          <span style={{ fontSize: "11px", color: "#6b7280" }}>Sort by: <span style={{ color: "#111827", fontWeight: 500, cursor: "pointer", borderBottom: "1px dotted #ccc" }}>Run filters ▾</span></span>
        </div>
        
        <div className="logs-container">
          {logs.map((log, i) => {
            const getLogInfo = (type) => {
              switch (type) {
                case "OOM": return { msg: "Force OOM (Critical)", tag: "Warn", cls: "warn" };
                case "NETWORK_DROP": return { msg: "Network Drop (100% loss)", tag: "Warn", cls: "warn" };
                case "CPU_SPIKE": return { msg: "CPU Spike (100%)", tag: "Info", cls: "info" };
                case "STORAGE_FAILURE": return { msg: "Storage Failure (I/O Error)", tag: "Warn", cls: "warn" };
                case "DB_LOCKS": return { msg: "DB Locks Detected", tag: "Warn", cls: "warn" };
                case "NET_TIMEOUT": return { msg: "Network Timeout (30s)", tag: "Warn", cls: "warn" };
                case "RESOLVED": return { msg: "Incident Resolved", tag: "Info", cls: "info" };
                default: return { msg: `${type} Incident`, tag: "Info", cls: "info" };
              }
            };
            const info = getLogInfo(log.error_type);
            return (
              <div key={log.id} className="log-row" style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "transparent" }}>
                <span className="log-time">{formatLogTime(log.timestamp)}</span>
                <span className="log-node">| Node {log.node_name.replace("EU-","").replace("US-","US ").replace("AP-","")} |</span>
                <span className="log-msg">{info.msg}</span>
                <span className={`log-tag ${info.cls}`}>
                  [{info.tag}]
                </span>
              </div>
            );
          })}
          {logs.length === 0 && <div style={{ fontSize: "12px", color: "#9ca3af", padding: "10px" }}>No recent incidents.</div>}
        </div>
      </div>

      {/* ── Block 3: Chaos Scenario Workflow ── */}
      <div className="telemetry-block" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: "#4b5563" }}>CHAOS SCENARIO WORKFLOW</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
        <div className="scenario-item">
          <div className="scenario-border"></div>
          <div style={{ flex: 1, padding: "8px 0" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>Running CPU Spike US-West: Phase 3 of 4</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>[Execute] Target: All CPU nodes</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div className="scenario-item">
          <div className="scenario-border"></div>
          <div style={{ flex: 1, padding: "8px 0" }}>
            <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>Running CPU Spike USEast: Phase 3 of 4</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>[Execute] Target: All nodes</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      {/* ── Block 4: Global Network Health ── */}
      <div className="telemetry-block" style={{ flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: "#4b5563" }}>GLOBAL NETWORK HEALTH</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
        <div className="charts-grid">
          <div className="chart-box">
            <div className="chart-header">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            </div>
            <MockLineChart color="#22c55e" values={[30, 45, 20, 60, 40, 80, 50, 60, 30]} />
            <div className="chart-title">Avg Latency (ms)</div>
          </div>
          <div className="chart-box">
            <div className="chart-header">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <MockBarChart color="#22c55e" values={[20, 40, 60, 30, 80, 50, 70, 40, 60]} />
            <div className="chart-title">Network Throughput (Gbps)</div>
          </div>
          <div className="chart-box">
            <div className="chart-header">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
            </div>
            <MockLineChart color="#ef4444" values={[10, 15, 10, 20, 15, 25, 20, 10, 15]} />
            <div className="chart-title">Overall Node Error Rate (%)</div>
          </div>
          <div className="chart-box">
            <div className="chart-header">
              <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: 700 }}>%</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40px", marginTop: "8px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid #ef4444", borderRightColor: "#f3f4f6" }}></div>
            </div>
            <div className="chart-title">Overall Node Error Rate (%)</div>
          </div>
        </div>
      </div>

      <div className="operator-notes" style={{ flexShrink: 0 }}>
        <input type="text" placeholder="Operator Notes" style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: "12px", color: "#111827" }} />
      </div>

      <style>{`
        .telemetry-panel {
          position: fixed;
          right: 20px;
          top: 80px;
          width: 380px;
          height: calc(100vh - 100px);
          z-index: 40;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          padding-bottom: 20px;
          padding-right: 4px;
        }

        .telemetry-panel::-webkit-scrollbar {
          width: 4px;
        }

        .telemetry-panel::-webkit-scrollbar-thumb {
          background: rgba(209, 213, 219, 0.8);
          border-radius: 10px;
        }

        .telemetry-block {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 12px;
          border: 1px solid rgba(226, 228, 233, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          padding: 16px;
        }

        .status-block {
          background: #ffffff;
        }

        .icon-green-square {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #a3e635;
          color: #1a2200;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(34, 197, 94, 0.1);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          color: #16a34a;
        }

        .logs-container {
          flex: 1;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #ffffff;
        }

        .logs-container::-webkit-scrollbar {
          width: 4px;
        }

        .logs-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }

        .log-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          font-size: 10px;
          font-family: "JetBrains Mono", monospace;
          border-bottom: 1px solid #f3f4f6;
        }

        .log-time {
          color: #6b7280;
        }

        .log-node {
          color: #4b5563;
        }

        .log-msg {
          color: #111827;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .log-tag {
          font-weight: 600;
        }

        .log-tag.warn {
          color: #d97706;
        }

        .log-tag.info {
          color: #2563eb;
        }

        .scenario-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding-right: 12px;
          margin-bottom: 8px;
        }

        .scenario-border {
          width: 4px;
          height: 40px;
          background: #22c55e;
          border-radius: 6px 0 0 6px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .chart-box {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chart-title {
          font-size: 9px;
          color: #6b7280;
          text-align: center;
          margin-top: 6px;
          font-weight: 600;
        }

        .operator-notes {
          background: #ffffff;
          border-radius: 12px;
          border: 1px solid rgba(226, 228, 233, 0.8);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          padding: 12px 16px;
        }
      `}</style>
    </div>
  );
}
