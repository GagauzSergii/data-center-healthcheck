/**
 * App.jsx — Root application component
 *
 * Responsibilities:
 *  - Auth gate: shows AuthModal if no user is logged in
 *  - Polls GET /api/nodes every 3 seconds
 *  - Passes node data to GlobeView, ChaosPanel, TelemetryPanel
 *  - Manages toast notification state (auto-dismiss after 4 s)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import GlobeView from "./components/GlobeView";
import ChaosPanel from "./components/ChaosPanel";
import TelemetryPanel from "./components/TelemetryPanel";
import ToastStack from "./components/Toast";
import AuthModal from "./components/AuthModal";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
const POLL_INTERVAL_MS = 3000;
const TOAST_TTL_MS = 4000;
const STORAGE_KEY = "telemetry_auth";

let toastIdCounter = 0;

// ── Helpers for persisting auth ───────────────────────────────────────────────

function loadAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAuth(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── App component ─────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => loadAuth()); // { token, username }
  const [nodes, setNodes] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [connected, setConnected] = useState(true);
  const pollRef = useRef(null);

  // ── Auth callbacks ───────────────────────────────────────────────────────
  const handleAuth = useCallback(({ token, username }) => {
    const data = { token, username };
    saveAuth(data);
    setCurrentUser(data);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setCurrentUser(null);
    setNodes([]);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  // ── Fetch nodes ──────────────────────────────────────────────────────────
  const fetchNodes = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/nodes`);
      setNodes(data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetchNodes();
    pollRef.current = setInterval(fetchNodes, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchNodes, currentUser]);

  // ── Toast management ─────────────────────────────────────────────────────
  const addToast = useCallback((payload) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, ...payload }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      TOAST_TTL_MS
    );
    // Immediately re-fetch so the globe updates without waiting for next poll
    fetchNodes();
  }, [fetchNodes]);

  // ── Show auth screen if not logged in ────────────────────────────────────
  if (!currentUser) {
    return <AuthModal onAuth={handleAuth} />;
  }

  // ── Derive initials from username ────────────────────────────────────────
  const initials = currentUser.username
    .split(/[\s_-]/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("") || currentUser.username.slice(0, 2).toUpperCase();

  const displayName = currentUser.username.length > 14
    ? currentUser.username.slice(0, 13) + "…"
    : currentUser.username;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "var(--bg-primary)" }}>
      {/* ── Top header bar ── */}
      <header className="app-header">
        {/* Left side: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#a3e635",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a2200" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.1 }}>
              Global Telemetry
            </div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.04em" }}>
              Chaos Engineering Dashboard
            </div>
          </div>
        </div>

        {/* Center: Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
          {["OPERATIONS", "TELEMETRY", "LOGS", "SCENARIOS", "REPORTS"].map((nav, i) => (
            <div
              key={nav}
              style={{
                fontSize: 13,
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? "var(--nav-active)" : "var(--nav-gray)",
                cursor: "pointer",
                letterSpacing: "0.05em"
              }}
            >
              {nav}
            </div>
          ))}
        </div>

        {/* Right side: Profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "var(--text-secondary)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: "pointer" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

          <div style={{ position: "relative", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ position: "absolute", top: -2, right: 0, width: 6, height: 6, background: "var(--red)", borderRadius: "50%" }}></div>
          </div>

          {/* User badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f3f4f6", padding: "4px 12px 4px 4px", borderRadius: 20 }}>
            <div style={{ width: 28, height: 28, background: "#a3e635", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#1a2200" }}>
              {initials}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{displayName}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              color: "#6b7280",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontFamily: "Inter, system-ui, sans-serif",
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.color = "#6b7280"; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>

          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ cursor: "pointer" }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </div>
      </header>

      {/* ── Globe (full screen behind everything) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          top: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, rgba(255,255,255,0) 50%)",
        }}
      >
        <GlobeView nodes={nodes} />
      </div>

      {/* ── Chaos panel (left sidebar) ── */}
      <ChaosPanel nodes={nodes} onAction={addToast} />

      {/* ── Telemetry panel (right sidebar) ── */}
      <TelemetryPanel nodes={nodes} connected={connected} />

      {/* ── Toast notifications (bottom-left) ── */}
      <ToastStack toasts={toasts} />
    </div>
  );
}
