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

export default function Auth({ onBypass, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase client is not initialized. Check your project URL and key.");
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim()
        });

        if (signUpError) throw signUpError;

        if (data?.session) {
          setSuccessMsg("Account registered and authenticated successfully!");
          if (onClose) setTimeout(onClose, 800);
        } else {
          setSuccessMsg("Registration submitted! Please sign in with your new credentials.");
          setIsSignUp(false);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (signInError) throw signInError;
        if (onClose) onClose();
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify email and password.");
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
      background: "rgba(28, 35, 51, 0.75)",
      backdropFilter: "blur(4px)",
      position: "fixed",
      inset: 0,
      zIndex: 99999,
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
        padding: "36px 32px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.25s ease-out",
        position: "relative"
      }}>
        {onClose && (
          <button
            onClick={onClose}
            title="Close"
            style={{
              position: "absolute",
              right: 18,
              top: 18,
              background: "none",
              border: "none",
              fontSize: 18,
              color: "#8A8578",
              cursor: "pointer",
              padding: 4
            }}
          >
            ✕
          </button>
        )}

        {/* Header Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, borderBottom: "1px solid #E4DFD3", paddingBottom: 16 }}>
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

        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#1C2333", marginBottom: 4 }}>
            {isSignUp ? "Register Counsel Account" : "Counsel & Associate Sign In"}
          </div>
          <div style={{ fontSize: 12.5, color: "#8A8578", lineHeight: 1.4 }}>
            {isSignUp 
              ? "Create your chambers credentials to gain full authorization to manage, edit, and delete legal dockets." 
              : "Sign in with your chamber account to unlock full write and delete permissions."}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
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
            minLength={6}
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

          {successMsg && (
            <div style={{
              background: "#E8F5E9",
              border: "1px solid #C8E6C9",
              color: "#2E7D32",
              padding: "9px 12px",
              borderRadius: 6,
              fontSize: 12.5,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 6
            }}>
              <UserCheck size={15} />
              <span>{successMsg}</span>
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
            <span>{loading ? "Processing..." : isSignUp ? "Create Counsel Account" : "Sign In to Chambers"}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Toggle between Sign In and Sign Up */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(""); setSuccessMsg(""); }}
            style={{
              background: "none",
              border: "none",
              color: "#6B2737",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "underline"
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need a counsel account? Register here"}
          </button>
        </div>

        {/* Informational Footer */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #E4DFD3", textAlign: "center" }}>
          <div style={{ fontSize: 11.5, color: "#8A8578", lineHeight: 1.5 }}>
            <Shield size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, color: "#B08D57" }} />
            Protected by Chambers Row-Level Security. Anonymous visitors have read-only access.
          </div>
        </div>
      </div>
    </div>
  );
}
