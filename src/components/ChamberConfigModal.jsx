import React, { useState } from "react";
import { Shield, CheckCircle2, RefreshCw, Database } from "lucide-react";
import { getStoredConfig, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection, isSupabaseConfigured } from "../lib/supabase";
import { Modal, Field, Btn, inputStyle } from "./UI";

export default function ChamberConfigModal({ onClose, onSaved }) {
  const current = getStoredConfig();
  const [url, setUrl] = useState(current.url || "");
  const [key, setKey] = useState(current.key || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestAndSave = async () => {
    if (!url.trim() || !key.trim()) {
      setTestResult({ error: "Please provide both Project URL and Anon API Key." });
      return;
    }
    setTesting(true);
    setTestResult(null);

    const res = await testSupabaseConnection(url, key);
    setTesting(false);
    if (res.success) {
      saveSupabaseConfig(url, key);
      setTestResult({ success: true });
      setTimeout(() => {
        onSaved();
      }, 700);
    } else {
      setTestResult({ error: res.error });
    }
  };

  const handleClear = () => {
    clearSupabaseConfig();
    onSaved();
  };

  return (
    <Modal title="Chambers Cloud Database Sync" onClose={onClose} maxWidth={560}>
      <div style={{ marginBottom: 16, fontSize: 13, color: "#6B6255", lineHeight: 1.5 }}>
        Connect your firm's central <strong>Supabase (PostgreSQL)</strong> database. Once configured, every associate and partner laptop will sync client files, court dates, and invoices in real time.
      </div>

      <div style={{ background: "#F2EDE3", padding: "12px 14px", borderRadius: 6, marginBottom: 16, border: "1px solid #E4DFD3" }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "#6B2737", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Shield size={14} /> HOW TO GET YOUR KEYS (FREE IN 1 MINUTE):
        </div>
        <div style={{ fontSize: 11.5, color: "#6B6255" }}>
          1. Go to <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{ color: "#6B2737", fontWeight: 600 }}>supabase.com</a> and open your project.<br/>
          2. Run the SQL schema from <code>supabase/schema.sql</code> in the SQL Editor.<br/>
          3. Copy the <strong>Project URL</strong> and <strong>anon public API Key</strong> from Project Settings &gt; API.
        </div>
      </div>

      <Field label="Supabase Project URL" sub="Example: https://xyzcompany.supabase.co">
        <input style={inputStyle} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-project.supabase.co" />
      </Field>

      <Field label="Supabase Anon / Public API Key" sub="The safe client-side key (starts with eyJ...)">
        <input type="password" style={inputStyle} value={key} onChange={(e) => setKey(e.target.value)} placeholder="eyJhbGciOiJIUzI1NiIsIn..." />
      </Field>

      {testResult?.error && (
        <div style={{ padding: "10px 12px", background: "#FAF0F0", border: "1px solid #E6CDD1", borderRadius: 6, color: "#6B2737", fontSize: 12, marginBottom: 14 }}>
          <strong>Connection Failed:</strong> {testResult.error}
        </div>
      )}

      {testResult?.success && (
        <div style={{ padding: "10px 12px", background: "#EFF8F3", border: "1px solid #C4E3D2", borderRadius: 6, color: "#3D5A4C", fontSize: 12, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle2 size={16} /> <strong>Connected Successfully!</strong> Syncing chambers data...
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
        {isSupabaseConfigured() ? (
          <Btn variant="danger" onClick={handleClear}>Disconnect Cloud</Btn>
        ) : <div />}
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={handleTestAndSave} disabled={testing}>
            {testing ? <><RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} /> Testing...</> : <><Database size={14} /> Connect & Sync</>}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
