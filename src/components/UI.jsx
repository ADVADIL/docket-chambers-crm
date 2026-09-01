import React from "react";
import { X, AlertCircle } from "lucide-react";

export function Badge({ text, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2.5px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.2,
        background: color ? `${color}18` : "#8A857818",
        color: color || "#8A8578",
        border: `1px solid ${color ? `${color}35` : "#8A857835"}`,
      }}
    >
      {text}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", color: "#8A8578" }}>
      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EFEBE1", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={20} color="#6B6255" />
      </div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: "#22262B", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12.5, maxWidth: 300, margin: "0 auto" }}>{sub}</div>
    </div>
  );
}

export function Modal({ title, onClose, children, maxWidth = 500 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(28,35,51,0.55)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FCFAF6",
          border: "1px solid #E4DFD3",
          borderRadius: 10,
          width: "100%",
          maxWidth,
          boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
          animation: "modalSlide 0.18s ease-out",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, fontWeight: 600, color: "#22262B" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: "20px 20px" }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, sub, error, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
        {label}
      </label>
      {sub && <div style={{ fontSize: 11, color: "#8A8578", marginBottom: 4 }}>{sub}</div>}
      {children}
      {error && (
        <div style={{ color: "#6B2737", fontSize: 11, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", disabled, style, title }) {
  const base = {
    padding: "7px 14px",
    borderRadius: 5,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "none",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.15s",
    fontFamily: "'IBM Plex Sans', sans-serif",
  };
  const variants = {
    primary: { background: "#6B2737", color: "#F7F5F0" },
    secondary: { background: "#B08D57", color: "#F7F5F0" },
    ghost: { background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2" },
    danger: { background: "#A63D40", color: "#F7F5F0" },
  };
  return (
    <button
      title={title}
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.opacity = "0.85")}
      onMouseLeave={(e) => !disabled && (e.currentTarget.style.opacity = "1")}
    >
      {children}
    </button>
  );
}

export const inputStyle = {
  width: "100%",
  padding: "7px 10px",
  border: "1px solid #D9D2C2",
  borderRadius: 5,
  fontSize: 13,
  background: "#FFFFFF",
  color: "#22262B",
  fontFamily: "'IBM Plex Sans', sans-serif",
  outline: "none",
};
