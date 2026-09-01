import React, { useState } from "react";
import { Gavel, Lock, Mail, AlertCircle, ArrowRight, Shield, UserCheck } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabase";

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #D9D2C2",
  fontSize: 13.5,
  fontFamily: "'IBM Plex Sans', sans-serif",
  background: "#FFFFFF",
  color: "#22262B",
  outline: "none",
  marginBottom: 14,
};

export default function Auth({ onBypass }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase client is not initialized. Check your project URL and key.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) {
        throw signInError;
      }
    } catch (err) {
      setError(err.message || "Failed to authenticate with chambers database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #1C2333 0%, #242B3D 50%, #161B26 100%)",
      fontFamily: "'IBM Plex Sans', sans-serif",
      padding: 20
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{
        background: "#FCFAF6",
        border: "1px solid #E4DFD3",
        borderRadius: 12,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.25s ease-out"
      }}>
        {/* Header Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 26, borderBottom: "1px solid #E4DFD3", paddingBottom: 18 }}>
          <div style={{
            width: 44,
            height: 44,
            background: "linear-gradient(135deg, #B08D57 0%, #6B2737 100%)",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 6px 15px rgba(0,0,0,0.2)"
          }}>
            <Gavel size={22} color="#F7F5F0" />
          </div>
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 600, color: "#1C2333", letterSpacing: -0.3 }}>
              Docket
            </div>
            <div style={{ fontSize: 10.5, color: "#8A8578", letterSpacing: 0.8, fontWeight: 700 }}>
              CHAMBERS PRACTICE MANAGER
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1C2333", marginBottom: 4 }}>
            Associate & Counsel Login
          </div>
          <div style={{ fontSize: 12.5, color: "#8A8578" }}>
            Sign in with your chamber email to access cause lists, matter dockets, and client files.
          </div>
        </div>

        <form onSubmit={handleSignIn}>
          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#6B6255", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <Mail size={12} /> Email Address
          </label>
          <input
            type="email"
            required
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="advocate@chambers.com"
            autoFocus
          />

          <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 700, color: "#6B6255", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>
            <Lock size={12} /> Password
          </label>
          <input
            type="password"
            required
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <div style={{
              background: "#FFEBEE",
              border: "1px solid #FFCDD2",
              color: "#C62828",
              padding: "9px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 6,
              border: "none",
              background: "#6B2737",
              color: "#F7F5F0",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.75 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
              boxShadow: "0 4px 12px rgba(107, 39, 55, 0.25)"
            }}
          >
            <span>{loading ? "Verifying Credentials..." : "Sign In to Chambers"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Informational Footer */}
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #E4DFD3", textAlign: "center" }}>
          <div style={{ fontSize: 11.5, color: "#8A8578", lineHeight: 1.5, marginBottom: 12 }}>
            <Shield size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, color: "#B08D57" }} />
            Chamber accounts are managed by the firm administrator in the Supabase Dashboard.
          </div>

          {onBypass && (
            <button
              onClick={onBypass}
              style={{
                background: "none",
                border: "none",
                color: "#6B6255",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
                padding: 4
              }}
            >
              Continue in Local Chamber Mode (Offline)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
