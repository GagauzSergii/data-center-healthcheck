/**
 * ChaosPanel.jsx
 *
 * Floating glass sidebar that shows all nodes and lets the operator
 * trigger OOM / Network Drop incidents or resolve them.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// Icons for nodes
const PadlockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

export default function ChaosPanel({ nodes, onAction }) {
  const [loading, setLoading] = useState({});

  async function triggerIncident(nodeId, incidentType) {
    setLoading((prev) => ({ ...prev, [nodeId]: true }));
    try {
      await axios.post(`${API_BASE}/api/chaos/incident`, { node_id: nodeId, incident_type: incidentType });
      onAction({ type: "incident", incident_type: incidentType, nodeId, success: true });
    } catch (err) {
      onAction({ type: "error", message: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, [nodeId]: false }));
    }
  }

  async function resolveIncident(nodeId) {
    setLoading((prev) => ({ ...prev, [nodeId]: true }));
    try {
      await axios.post(`${API_BASE}/api/chaos/resolve`, { node_id: nodeId });
      onAction({ type: "resolve", nodeId, success: true });
    } catch (err) {
      onAction({ type: "error", message: err.message });
    } finally {
      setLoading((prev) => ({ ...prev, [nodeId]: false }));
    }
  }

  // Custom UI buttons based on node type to match reference image
  const renderNodeButtons = (node) => {
    if (node.status === "critical") {
      return (
        <button className="neon-btn btn-full" disabled={!!loading[node.id]} onClick={() => resolveIncident(node.id)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          Resolve Incident
        </button>
      );
    }

    if (node.name.includes("London") || node.name.includes("Kyiv")) {
      return (
        <>
          <div className="btn-row">
            <button className="neon-btn btn-half" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "OOM")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              <span>Force OOM</span>
            </button>
            <button className="neon-btn btn-half" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "NETWORK_DROP")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              <span>Simulate Lag</span>
            </button>
          </div>
          <button className="neon-btn btn-full" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "NET_TIMEOUT")}>
            Trigger Net Timeout
          </button>
        </>
      );
    } else if (node.name.includes("US")) {
      return (
        <>
          <div className="btn-row">
            <button className="neon-btn btn-half icon-only" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "CPU_SPIKE")}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
            </button>
            <button className="neon-btn btn-half text-only" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "CPU_SPIKE")}>
              Cause CPU<br/>Spike
            </button>
          </div>
          <button className="neon-btn btn-full" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "STORAGE_FAILURE")}>
            Simulate Storage Failure
          </button>
        </>
      );
    } else {
      return (
        <div className="btn-row">
          <button className="neon-btn btn-half" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "NETWORK_DROP")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>
            <span>Random Net<br/>Drop</span>
          </button>
          <button className="neon-btn btn-half" disabled={!!loading[node.id]} onClick={() => triggerIncident(node.id, "DB_LOCKS")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            <span>Trigger DB<br/>Locks</span>
          </button>
        </div>
      );
    }
  };

  return (
    <div className="panel-outer">
      <div className="panel-title">
        Chaos Engineering<br/>Control Panel
      </div>
      
      <div className="nodes-container">
        {nodes.map((node, i) => (
          <div key={node.id} className="node-block" style={{ borderBottom: i === nodes.length - 1 ? 'none' : '1px solid rgba(132, 204, 22, 0.2)' }}>
            <div className="node-header">
              <div className="node-icon-wrapper">
                {node.name.includes("AP") || node.name.includes("Kyiv") ? <GlobeIcon /> : <PadlockIcon />}
              </div>
              <span className="node-name">{node.name.replace("EU-", "").replace("US-", "US ").replace("AP-", "")}</span>
            </div>
            
            <div className="node-actions">
              {renderNodeButtons(node)}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .panel-outer {
          position: fixed;
          left: 20px;
          top: 80px;
          width: 320px;
          height: calc(100vh - 100px);
          z-index: 40;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 20px;
          border: 1px solid rgba(132, 204, 22, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
        }

        .panel-title {
          font-size: 24px;
          font-weight: 500;
          color: #111827;
          line-height: 1.2;
          margin-bottom: 24px;
          padding: 0 4px;
          flex-shrink: 0;
        }

        .nodes-container {
          background: rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          border: 1px solid rgba(132, 204, 22, 0.6);
          box-shadow: 0 0 20px rgba(132, 204, 22, 0.1);
          overflow-y: auto;
          flex: 1;
        }

        .nodes-container::-webkit-scrollbar {
          width: 4px;
        }
        
        .nodes-container::-webkit-scrollbar-thumb {
          background: rgba(132, 204, 22, 0.5);
          border-radius: 10px;
        }

        .node-block {
          padding: 16px;
          transition: background 0.3s;
        }
        .node-block:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .node-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(132, 204, 22, 0.2);
          color: #4d7c0f;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .node-name {
          font-size: 16px;
          font-weight: 500;
          color: #111827;
        }

        .node-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn-row {
          display: flex;
          gap: 8px;
        }

        .neon-btn {
          background: #1a202c;
          border: 1px solid rgba(132, 204, 22, 0.5);
          border-radius: 10px;
          color: #a3e635;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 0 10px rgba(132, 204, 22, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .neon-btn:not(:disabled):hover {
          background: #2d3748;
          box-shadow: 0 0 15px rgba(132, 204, 22, 0.3);
          border-color: rgba(132, 204, 22, 0.8);
          transform: translateY(-1px);
        }

        .neon-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-full {
          width: 100%;
          padding: 10px;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-half {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 8px;
          font-size: 12px;
          text-align: center;
          min-height: 60px;
        }

        .btn-half.icon-only {
          flex-direction: row;
        }

        .btn-half.text-only {
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
