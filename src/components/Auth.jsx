import React, { useState } from "react";
import { Gavel } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";

const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 5,
  border: "1px solid #D9D2C2", fontSize: 14, fontFamily: "'IBM Plex Sans', sans-serif",
  background: "#fff", color: "#22262B", outline: "none", marginBottom: 12,
};

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F7F5F0", fontFamily: "'IBM Plex Sans', sans-serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>
      <form onSubmit={handleSignIn} style={{
        background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 10,
        padding: "36px 32px", width: 340, boxShadow: "0 20px 50px rgba(28,35,51,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #B08D57 0%, #6B2737 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Gavel size={20} color="#F7F5F0" />
          </div>
          <div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 600, color: "#22262B" }}>Docket</div>
            <div style={{ fontSize: 11, color: "#8A8578", letterSpacing: 0.4 }}>CHAMBERS PRACTICE MANAGER</div>
          </div>
        </div>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6255", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Email</label>
        <input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#6B6255", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.3 }}>Password</label>
        <input type="password" required style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />

        {error && <div style={{ color: "#6B2737", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button type="submit" disabled={loading} style={{
          width: "100%", padding: "10px 16px", borderRadius: 5, border: "none",
          background: "#6B2737", color: "#F7F5F0", fontSize: 14, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
        }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <div style={{ fontSize: 11.5, color: "#8A8578", marginTop: 16, textAlign: "center" }}>
          Accounts are created by the firm administrator in the Supabase dashboard — there is no public sign-up.
        </div>
      </form>
    </div>
  );
}
