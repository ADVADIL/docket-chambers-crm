import React, { useState } from "react";
import { 
  MessageSquare, Check, AlertCircle, Sparkles, Send, 
  ExternalLink, ShieldCheck, Zap, RefreshCw, X 
} from "lucide-react";
import { Modal, Btn, Field, inputStyle } from "./UI";
import { 
  GATEWAY_PROVIDERS, 
  getGatewayConfig, 
  saveGatewayConfig, 
  clearGatewayConfig,
  isGatewayConfigured,
  sendDirectWhatsApp
} from "../lib/whatsappGateway";

export default function WhatsAppConfigModal({ onClose, onSaved }) {
  const current = getGatewayConfig();
  const [provider, setProvider] = useState(current.provider || "ultramsg");
  const [instanceId, setInstanceId] = useState(current.instanceId || "");
  const [token, setToken] = useState(current.token || "");
  const [phoneNumberId, setPhoneNumberId] = useState(current.phoneNumberId || "");
  const [apiUrl, setApiUrl] = useState(current.apiUrl || "");

  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const selectedProviderMeta = GATEWAY_PROVIDERS.find((p) => p.id === provider) || GATEWAY_PROVIDERS[0];

  const handleSave = () => {
    const success = saveGatewayConfig({
      provider,
      instanceId,
      token,
      phoneNumberId,
      apiUrl
    });
    if (success && onSaved) onSaved();
  };

  const handleDisconnect = () => {
    clearGatewayConfig();
    if (onSaved) onSaved();
  };

  const handleTestPing = async () => {
    if (!testPhone) {
      setTestResult({ success: false, error: "Enter a test WhatsApp phone number (with country code)." });
      return;
    }

    setTesting(true);
    setTestResult(null);

    // Temporarily save to test
    saveGatewayConfig({ provider, instanceId, token, phoneNumberId, apiUrl });

    try {
      await sendDirectWhatsApp({
        to: testPhone,
        message: "🏛️ *Docket Chambers CRM*: WhatsApp In-App Gateway connection test verified successfully!"
      });
      setTestResult({ success: true, message: `Test ping delivered to ${testPhone}!` });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal title="WhatsApp In-App Direct Gateway" onClose={onClose} maxWidth={620}>
      <div>
        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #1C2333 0%, #25D36615 100%)", border: "1px solid #25D36644", borderRadius: 8, padding: "14px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#25D366", fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            <Zap size={16} /> 100% In-App WhatsApp Sending (No External Tabs)
          </div>
          <div style={{ fontSize: 12, color: "#D1D5DB", lineHeight: 1.5 }}>
            By linking a WhatsApp API gateway, all hearing reminders, cause list broadcasts, and fee notes are dispatched directly from within Docket CRM in the background with delivery confirmation.
          </div>
        </div>

        {/* Provider Selector Tabs */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
            SELECT GATEWAY PROVIDER
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            {GATEWAY_PROVIDERS.map((p) => {
              const active = provider === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 6,
                    cursor: "pointer",
                    border: `1.5px solid ${active ? "#25D366" : "#E4DFD3"}`,
                    background: active ? "rgba(37, 211, 102, 0.06)" : "#FFFFFF",
                    transition: "all 0.15s"
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? "#1C2333" : "#4A453C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{p.name}</span>
                    {active && <Check size={14} color="#25D366" />}
                  </div>
                  <div style={{ fontSize: 10.5, color: "#8A8578", marginTop: 3 }}>
                    {p.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields */}
        <div style={{ background: "#FCFAF6", padding: "16px", borderRadius: 8, border: "1px solid #E4DFD3", marginBottom: 16 }}>
          {provider === "ultramsg" && (
            <>
              <Field label="Instance ID" sub="Found in your UltraMsg dashboard (e.g. instance98765)">
                <input
                  style={inputStyle}
                  value={instanceId}
                  onChange={(e) => setInstanceId(e.target.value)}
                  placeholder="instance98765"
                />
              </Field>
              <Field label="Token" sub="Your UltraMsg instance API authentication token">
                <input
                  type="password"
                  style={inputStyle}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. abc123def456"
                />
              </Field>
              <div style={{ fontSize: 11, color: "#8A8578", fontStyle: "italic" }}>
                💡 Tip: UltraMsg allows scanning a QR code with any existing WhatsApp phone to send messages seamlessly.
              </div>
            </>
          )}

          {provider === "meta" && (
            <>
              <Field label="Phone Number ID" sub="From Meta App Dashboard -> WhatsApp -> API Setup">
                <input
                  style={inputStyle}
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="1059382910..."
                />
              </Field>
              <Field label="Permanent System User Access Token" sub="Generated in Meta Business Manager with whatsapp_business_messaging">
                <input
                  type="password"
                  style={inputStyle}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="EAABw..."
                />
              </Field>
            </>
          )}

          {provider === "whapi" && (
            <>
              <Field label="API Endpoint URL (Optional)" sub="Leave default for Whapi cloud endpoint">
                <input
                  style={inputStyle}
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://gate.whapi.cloud/messages/text"
                />
              </Field>
              <Field label="Bearer API Token" sub="From your Whapi.cloud channel settings">
                <input
                  type="password"
                  style={inputStyle}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Bearer token"
                />
              </Field>
            </>
          )}

          {provider === "custom" && (
            <>
              <Field label="Custom Webhook / REST Endpoint" sub="Your chamber's custom or self-hosted bridge URL">
                <input
                  style={inputStyle}
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.yourchambers.com/send"
                />
              </Field>
              <Field label="Authorization Secret / Bearer Token" sub="Optional security header sent in Authorization: Bearer <token>">
                <input
                  type="password"
                  style={inputStyle}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Chamber secret token"
                />
              </Field>
            </>
          )}
        </div>

        {/* Live Test Ping Box */}
        <div style={{ background: "#F4F0E8", padding: "12px 14px", borderRadius: 8, marginBottom: 16, border: "1px solid #E2DCCF" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", marginBottom: 6 }}>
            Verify Connection (Optional Test Ping)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}
              placeholder="Enter your phone with country code e.g. +91..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Btn
              variant="ghost"
              onClick={handleTestPing}
              disabled={testing}
              style={{ whiteSpace: "nowrap" }}
            >
              {testing ? <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={13} />}
              {testing ? "Testing..." : "Send Test Ping"}
            </Btn>
          </div>
          {testResult && (
            <div style={{
              marginTop: 8,
              fontSize: 11.5,
              padding: "6px 10px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: testResult.success ? "#E8F5E9" : "#FFEBEE",
              color: testResult.success ? "#2E7D32" : "#C62828",
              border: `1px solid ${testResult.success ? "#A5D6A7" : "#FFCDD2"}`
            }}>
              {testResult.success ? <Check size={13} /> : <AlertCircle size={13} />}
              {testResult.success ? testResult.message : testResult.error}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #E4DFD3" }}>
          <div>
            {isGatewayConfigured() && (
              <Btn variant="danger" onClick={handleDisconnect} style={{ fontSize: 11 }}>
                Disconnect Gateway
              </Btn>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={handleSave} style={{ background: "#25D366", color: "#FFFFFF" }}>
              <ShieldCheck size={14} /> Save & Enable In-App Sending
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
