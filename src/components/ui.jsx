import React from "react";
import { X, Edit3, Trash2 } from "lucide-react";

// ---------- Shared UI primitives (moved here unchanged from DocketCRM.jsx so
// new components can reuse them without a circular import back into it) ----------

export const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 5,
  border: "1px solid #D9D2C2", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif",
  background: "#fff", color: "#22262B", outline: "none",
};

export const Badge = ({ text, color }) => (
  <span style={{ background: color + "1a", color, border: `1px solid ${color}55`, borderRadius: 4, padding: "2px 9px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, letterSpacing: 0.2, whiteSpace: "nowrap" }}>
    {text}
  </span>
);

export const EmptyState = ({ icon: Icon, title, sub }) => (
  <div style={{ textAlign: "center", padding: "64px 20px", color: "#8A8578" }}>
    <Icon size={30} strokeWidth={1.3} style={{ marginBottom: 12, opacity: 0.6 }} />
    <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, color: "#4A4438", marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 13.5 }}>{sub}</div>
  </div>
);

// `wide` is a new, additive option (for the larger Matter Command Centre modal) —
// default behavior/appearance for every existing caller is unchanged.
export const Modal = ({ title, onClose, children, wide = false }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(28,35,51,0.45)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px", zIndex: 50, overflowY: "auto" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: "#FCFAF6", borderRadius: 8, width: "100%", maxWidth: wide ? 860 : 520, border: "1px solid #E4DFD3", boxShadow: "0 20px 50px rgba(28,35,51,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #E4DFD3" }}>
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 17, color: "#22262B" }}>{title}</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  </div>
);

export const Field = ({ label, children, error }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6255", marginBottom: 5, letterSpacing: 0.3, textTransform: "uppercase" }}>{label}</label>
    {children}
    {error && <span style={{ fontSize: 11, color: "#6B2737", marginTop: 4, display: "block" }}>{error}</span>}
  </div>
);

export const Btn = ({ children, onClick, variant = "primary", style, type = "button", disabled = false }) => {
  const base = { padding: "9px 16px", borderRadius: 5, fontSize: 13.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'IBM Plex Sans', sans-serif", border: "1px solid transparent", display: "inline-flex", alignItems: "center", gap: 6, opacity: disabled ? 0.5 : 1 };
  const variants = {
    primary: { background: "#6B2737", color: "#F7F5F0" },
    ghost: { background: "transparent", color: "#6B2737", border: "1px solid #D9D2C2" },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
};

export function FormError({ error }) {
  if (!error) return null;
  return <div style={{ background: "#6B273712", border: "1px solid #6B273733", color: "#6B2737", borderRadius: 5, padding: "8px 12px", fontSize: 13, marginBottom: 14 }}>{error}</div>;
}

export function RowActions({ onEdit, onDelete }) {
  return (
    <td style={{ width: 70, textAlign: "right" }}>
      <div className="rowbtn" style={{ display: "inline-flex", gap: 4 }}>
        <button onClick={onEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}><Edit3 size={14} /></button>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}><Trash2 size={14} /></button>
      </div>
    </td>
  );
}
