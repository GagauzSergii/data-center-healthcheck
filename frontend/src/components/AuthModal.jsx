/**
 * AuthModal.jsx — Full-screen auth overlay.
 * Modern split layout: brand panel (left) + form panel (right).
 * English UI. Same lime-green / dark palette as the dashboard.
 */

import { useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

/* ── Micro icons ─────────────────────────────────────────────────────────── */
const GlobeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ animation: "auth-spin 0.7s linear infinite", display: "block" }}>
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
  </svg>
);

/* ── Features list shown in the brand panel ──────────────────────────────── */
const FEATURES = [
  "Real-time global node monitoring",
  "Chaos engineering simulations",
  "Deep telemetry insights & alerts",
  "Multi-region incident management",
];

/* ── Main component ──────────────────────────────────────────────────────── */
export default function AuthModal({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setPassword(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Username is required"); return; }
    if (!password)         { setError("Password is required"); return; }
    setLoading(true);
    try {
      const url = `${API_BASE}/api/auth/${mode === "login" ? "login" : "register"}`;
      const { data } = await axios.post(url, { username: username.trim(), password });
      onAuth({ token: data.access_token, username: data.username });
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail
        : Array.isArray(detail) ? detail.map(d => d.msg).join("; ")
        : "Connection error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">
      <style>{`
        @keyframes auth-spin   { to { transform: rotate(360deg); } }
        @keyframes auth-in     { from { opacity:0; transform:translateY(18px) scale(.97); } to { opacity:1; transform:none; } }
        @keyframes auth-err-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        @keyframes auth-blob   { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.12) translate(24px,-16px);} }
        @keyframes auth-blob2  { 0%,100%{transform:scale(1) translate(0,0);} 50%{transform:scale(1.08) translate(-20px,12px);} }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          position: fixed; inset: 0; z-index: 200;
          display: grid; grid-template-columns: 1fr 1fr;
          min-height: 100vh; overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Left brand panel ── */
        .auth-brand {
          position: relative;
          background: #0f1a00;
          display: flex; flex-direction: column;
          justify-content: space-between;
          padding: 48px 52px;
          overflow: hidden;
        }

        .auth-brand-blob {
          position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none;
        }
        .auth-brand-blob-1 {
          width: 420px; height: 420px;
          background: rgba(163,230,53,0.22);
          top: -80px; left: -80px;
          animation: auth-blob 9s ease-in-out infinite;
        }
        .auth-brand-blob-2 {
          width: 320px; height: 320px;
          background: rgba(163,230,53,0.10);
          bottom: 40px; right: -60px;
          animation: auth-blob2 11s ease-in-out infinite;
        }

        .auth-brand-logo {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 12px;
        }
        .auth-brand-logo-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: #a3e635;
          display: flex; align-items: center; justify-content: center;
          color: #0f1a00;
          box-shadow: 0 0 24px rgba(163,230,53,0.5);
        }
        .auth-brand-logo-name {
          font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;
        }
        .auth-brand-logo-sub {
          font-size: 11px; color: rgba(255,255,255,0.45); letter-spacing: 0.04em; margin-top: 1px;
        }

        .auth-brand-body {
          position: relative; z-index: 1;
        }
        .auth-brand-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(163,230,53,0.12);
          border: 1px solid rgba(163,230,53,0.25);
          border-radius: 999px;
          padding: 5px 12px;
          font-size: 11px; font-weight: 600;
          color: #a3e635; letter-spacing: 0.06em;
          margin-bottom: 28px;
        }
        .auth-brand-tag-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a3e635;
          box-shadow: 0 0 6px #a3e635;
          animation: auth-blob 2s ease-in-out infinite;
        }

        .auth-brand-heading {
          font-size: 38px; font-weight: 800;
          color: #ffffff; line-height: 1.12;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }
        .auth-brand-heading span { color: #a3e635; }

        .auth-brand-desc {
          font-size: 14px; color: rgba(255,255,255,0.5);
          line-height: 1.65; max-width: 340px;
          margin-bottom: 36px;
        }

        .auth-features {
          display: flex; flex-direction: column; gap: 12px;
        }
        .auth-feature-item {
          display: flex; align-items: center; gap: 10px;
        }
        .auth-feature-check {
          width: 22px; height: 22px; border-radius: 6px;
          background: rgba(163,230,53,0.15);
          border: 1px solid rgba(163,230,53,0.3);
          color: #a3e635;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .auth-feature-text {
          font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 400;
        }

        .auth-brand-footer {
          position: relative; z-index: 1;
          font-size: 11px; color: rgba(255,255,255,0.22);
        }

        /* ── Right form panel ── */
        .auth-form-panel {
          background: #fafafa;
          display: flex; align-items: center; justify-content: center;
          padding: 48px 40px;
          position: relative;
        }

        .auth-form-card {
          width: 100%; max-width: 380px;
          animation: auth-in 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* Tabs */
        .auth-tabs {
          display: grid; grid-template-columns: 1fr 1fr;
          background: #eeeeee;
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 36px;
          gap: 2px;
        }
        .auth-tab {
          padding: 10px;
          border-radius: 9px;
          font-size: 13px; font-weight: 600;
          text-align: center; cursor: pointer;
          transition: all 0.2s ease;
          color: #9ca3af;
          border: none; background: none;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .auth-tab.active {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }

        .auth-form-title {
          font-size: 24px; font-weight: 700;
          color: #111827; letter-spacing: -0.5px;
          margin-bottom: 6px;
        }
        .auth-form-sub {
          font-size: 13px; color: #6b7280;
          margin-bottom: 28px; line-height: 1.5;
        }

        /* Fields */
        .auth-field { margin-bottom: 16px; }
        .auth-label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: #374151; letter-spacing: 0.02em;
          margin-bottom: 6px;
        }
        .auth-input-wrap { position: relative; }
        .auth-input-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: #9ca3af; pointer-events: none;
          display: flex; align-items: center;
        }
        .auth-input {
          width: 100%;
          padding: 11px 14px 11px 40px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px; color: #111827;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .auth-input::placeholder { color: #c4c9d4; }
        .auth-input:focus {
          border-color: #a3e635;
          box-shadow: 0 0 0 3px rgba(163,230,53,0.16);
        }
        .auth-input.pw-input { padding-right: 42px; }
        .auth-pw-toggle {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9ca3af; display: flex; align-items: center;
          padding: 4px; transition: color 0.15s;
        }
        .auth-pw-toggle:hover { color: #374151; }

        /* Error */
        .auth-error {
          display: flex; align-items: flex-start; gap: 9px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 9px;
          padding: 10px 13px;
          font-size: 12.5px; color: #dc2626;
          margin-bottom: 16px;
          animation: auth-err-in 0.2s ease both;
        }
        .auth-error svg { flex-shrink: 0; margin-top: 1px; }

        /* Submit */
        .auth-submit {
          width: 100%;
          padding: 13px 20px;
          background: #1a2200;
          color: #a3e635;
          border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700;
          letter-spacing: 0.04em;
          cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(26,34,0,0.22);
          margin-top: 8px;
        }
        .auth-submit:not(:disabled):hover {
          background: #2d3a00;
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(26,34,0,0.28);
        }
        .auth-submit:not(:disabled):active { transform: translateY(0); }
        .auth-submit:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Divider */
        .auth-divider {
          display: flex; align-items: center; gap: 12px; margin: 22px 0;
        }
        .auth-divider-line { flex: 1; height: 1px; background: #e5e7eb; }
        .auth-divider-text { font-size: 11px; color: #9ca3af; white-space: nowrap; }

        /* Switch link */
        .auth-switch {
          text-align: center; font-size: 13px; color: #6b7280; margin-top: 20px;
        }
        .auth-switch-link {
          color: #65a30d; font-weight: 600; cursor: pointer;
          margin-left: 4px; text-decoration: none;
          transition: color 0.15s;
        }
        .auth-switch-link:hover { color: #4d7c0f; text-decoration: underline; }

        @media (max-width: 800px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-brand { display: none; }
          .auth-form-panel { background: #ffffff; }
        }
      `}</style>

      {/* ── Left brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand-blob auth-brand-blob-1" />
        <div className="auth-brand-blob auth-brand-blob-2" />

        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon"><GlobeIcon /></div>
          <div>
            <div className="auth-brand-logo-name">Global Telemetry</div>
            <div className="auth-brand-logo-sub">CHAOS ENGINEERING PLATFORM</div>
          </div>
        </div>

        <div className="auth-brand-body">
          <div className="auth-brand-tag">
            <div className="auth-brand-tag-dot" />
            LIVE — 6 Nodes Online
          </div>
          <h1 className="auth-brand-heading">
            Monitor.<br/>Simulate.<br/><span>Resolve.</span>
          </h1>
          <p className="auth-brand-desc">
            Enterprise-grade chaos engineering and real-time telemetry for global data-center infrastructure.
          </p>
          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f} className="auth-feature-item">
                <div className="auth-feature-check"><CheckIcon /></div>
                <span className="auth-feature-text">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-brand-footer">
          © 2026 Global Telemetry Platform · All rights reserved
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${mode === "login" ? " active" : ""}`} onClick={() => switchMode("login")}>
              Sign In
            </button>
            <button className={`auth-tab${mode === "register" ? " active" : ""}`} onClick={() => switchMode("register")}>
              Create Account
            </button>
          </div>

          <div className="auth-form-title">
            {mode === "login" ? "Welcome back" : "Get started"}
          </div>
          <div className="auth-form-sub">
            {mode === "login"
              ? "Sign in to your operator account to access the dashboard."
              : "Create a new account to start monitoring your infrastructure."}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-username">Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><UserIcon /></span>
                <input
                  id="auth-username"
                  className="auth-input"
                  type="text"
                  placeholder="e.g. operator_01"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><LockIcon /></span>
                <input
                  id="auth-password"
                  className="auth-input pw-input"
                  type={showPw ? "text" : "password"}
                  placeholder={mode === "register" ? "At least 6 characters" : "Enter your password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOpenIcon /> : <EyeClosedIcon />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? <SpinnerIcon /> : <ArrowRightIcon />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login" ? (
              <>Don't have an account?<span className="auth-switch-link" onClick={() => switchMode("register")}>Sign up</span></>
            ) : (
              <>Already have an account?<span className="auth-switch-link" onClick={() => switchMode("login")}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
