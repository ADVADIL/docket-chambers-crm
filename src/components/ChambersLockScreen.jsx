import React, { useState } from "react";
import { Gavel, ArrowRight, ShieldCheck, Cloud } from "lucide-react";

export default function ChambersLockScreen({ session, isConnected, onUnlock, onSignOutFully }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  const email = session?.user?.email || "";
  const initials = email ? email.slice(0, 2).toUpperCase() : "CH";

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    setUnlocking(true);
    setError("");
    const res = await onUnlock(password);
    setUnlocking(false);
    if (!res?.success) {
      setError(res?.error || "Incorrect password. Try again.");
      setPassword("");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1C2333 0%, #252D40 50%, #161B26 100%)", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 12, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "0 25px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, borderBottom: "1px solid #E4DFD3", paddingBottom: 16 }}>
          <div style={{ width: 44, height: 44, background: "linear-gradient(135deg, #B08D57 0%, #6B2737 100%)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(0,0,0,0.2)" }}>
            <Gavel size={22} color="#F7F5F0" />
          </div>
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 600, color: "#1C2333", letterSpacing: -0.3 }}>Docket</div>
            <div style={{ fontSize: 10.5, color: "#8A8578", letterSpacing: 0.8, fontWeight: 700 }}>CHAMBERS PRACTICE MANAGER</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", borderRadius: 8, background: "#F4F0E8", border: "1px solid #E4DFD3", marginBottom: 18 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6B2737", color: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1C2333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email || "Chambers account"}</div>
            <div style={{ fontSize: 11.5, color: "#8A8578" }}>Authenticated counsel</div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1C2333", marginBottom: 4 }}>Session locked</div>
          <div style={{ fontSize: 12.5, color: "#8A8578", lineHeight: 1.45 }}>You've been idle a while. Enter your chambers password to resume — everything stays open where you left it.</div>
        </div>

        <form onSubmit={handleUnlock}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Chambers account password"
            style={{ width: "100%", padding: "12px 14px", border: `1.5px solid ${error ? "#6B2737" : "#D9D2C2"}`, borderRadius: 8, background: "#FFF", fontSize: 14, marginBottom: error ? 8 : 16, outline: "none" }}
          />
          {error && <div style={{ fontSize: 12, color: "#6B2737", marginBottom: 12 }}>{error}</div>}
          <button
            type="submit"
            disabled={unlocking || !password}
            style={{ width: "100%", padding: "11px 16px", borderRadius: 6, border: "none", background: "#6B2737", color: "#F7F5F0", fontSize: 14, fontWeight: 600, cursor: unlocking ? "default" : "pointer", opacity: unlocking || !password ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(107,39,55,0.25)" }}
          >
            <span>{unlocking ? "Unlocking..." : "Unlock chambers"}</span>
            {!unlocking && <ArrowRight size={15} />}
          </button>
        </form>

        <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
          <button onClick={onSignOutFully} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#8A8578" }}>Sign out fully</button>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E4DFD3", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11.5, color: "#8A8578", lineHeight: 1.5, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <ShieldCheck size={13} color="#B08D57" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Nothing closes while locked — draft outcomes and unsent fee notes stay exactly where you left them.</span>
          </div>
          {isConnected && (
            <div style={{ fontSize: 11.5, color: "#8A8578", display: "flex", gap: 6, alignItems: "center" }}>
              <Cloud size={12} color="#48C78E" />
              <span>Firm cloud sync active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
