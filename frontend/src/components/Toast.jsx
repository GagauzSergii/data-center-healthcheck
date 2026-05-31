/**
 * Toast.jsx
 *
 * Animated toast notification stack using framer-motion.
 * Toasts auto-dismiss after 4 seconds.
 * Renders fixed at bottom-left of the screen.
 */

import { AnimatePresence, motion } from "framer-motion";

const ICONS = {
  incident: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    </svg>
  ),
  resolve: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
};

const STYLES = {
  incident: {
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    iconColor: "#ef4444",
    titleColor: "#dc2626",
  },
  resolve: {
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
    iconColor: "#22c55e",
    titleColor: "#16a34a",
  },
  error: {
    bg: "rgba(100,100,100,0.08)",
    border: "rgba(100,100,100,0.2)",
    iconColor: "#6b7280",
    titleColor: "#374151",
  },
};

function getTitle(toast) {
  if (toast.type === "incident") {
    const labels = {
      "OOM": "⚠ OOM Incident Triggered",
      "NETWORK_DROP": "⚠ Network Drop Triggered",
      "CPU_SPIKE": "⚠ CPU Spike Triggered",
      "STORAGE_FAILURE": "⚠ Storage Failure Triggered",
      "DB_LOCKS": "⚠ DB Locks Triggered",
      "NET_TIMEOUT": "⚠ Network Timeout Triggered"
    };
    return labels[toast.incident_type] || `⚠ ${toast.incident_type} Incident`;
  }
  if (toast.type === "resolve") return "✓ Incident Resolved";
  return "Error";
}

function getMessage(toast) {
  if (toast.type === "incident")
    return `Node #${toast.nodeId} is now CRITICAL.`;
  if (toast.type === "resolve")
    return `Node #${toast.nodeId} restored to HEALTHY.`;
  return toast.message ?? "An unexpected error occurred.";
}

export default function ToastStack({ toasts }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        left: 24,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const style = STYLES[toast.type] ?? STYLES.error;
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: -40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              style={{
                background: "rgba(255,255,255,0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: `1px solid ${style.border}`,
                borderLeft: `3px solid ${style.iconColor}`,
                borderRadius: 12,
                padding: "12px 16px",
                minWidth: 260,
                maxWidth: 320,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                pointerEvents: "auto",
              }}
            >
              {/* Icon */}
              <div style={{ color: style.iconColor, flexShrink: 0, marginTop: 1 }}>
                {ICONS[toast.type]}
              </div>
              {/* Content */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: style.titleColor,
                    marginBottom: 2,
                  }}
                >
                  {getTitle(toast)}
                </div>
                <div style={{ fontSize: 12, color: "#5c6270" }}>
                  {getMessage(toast)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
