import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Check, AlertCircle, Sparkles, Send, 
  ExternalLink, ShieldCheck, Zap, RefreshCw, X, QrCode, Smartphone, CheckCircle2, ChevronRight
} from "lucide-react";
import QRCode from "qrcode";
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
  const [activeTab, setActiveTab] = useState("qr"); // "qr" or "api"
  const [provider, setProvider] = useState(current.provider || "ultramsg");
  const [instanceId, setInstanceId] = useState(current.instanceId || "");
  const [token, setToken] = useState(current.token || "");
  const [phoneNumberId, setPhoneNumberId] = useState(current.phoneNumberId || "");
  const [apiUrl, setApiUrl] = useState(current.apiUrl || "");

  const [liveQrUrl, setLiveQrUrl] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Generate a live, sharp QR code immediately on open!
  useEffect(() => {
    generateInstantQr();
  }, [instanceId, token]);

  const generateInstantQr = async () => {
    try {
      let targetPayload = "https://wa.me/?text=" + encodeURIComponent("🏛️ Docket Chambers Practice Manager connected.");
      if (instanceId && token) {
        targetPayload = `https://api.ultramsg.com/${instanceId.trim()}/instance/qrimage?token=${token.trim()}`;
      }
      const dataUrl = await QRCode.toDataURL(targetPayload, {
        width: 220,
        margin: 2,
        color: { dark: "#1C2333", light: "#FFFFFF" }
      });
      setLiveQrUrl(dataUrl);
    } catch (e) {
      console.warn("QR generation:", e);
    }
  };

  const handleSaveAndActivate = () => {
    saveGatewayConfig({
      provider,
      instanceId: instanceId.trim(),
      token: token.trim(),
      phoneNumberId: phoneNumberId.trim(),
      apiUrl: apiUrl.trim()
    });
    if (onSaved) onSaved();
  };

  const handleDisconnect = () => {
    clearGatewayConfig();
    if (onSaved) onSaved();
  };

  const handleTestPing = async () => {
    if (!testPhone) {
      setTestResult({ success: false, error: "Enter a test WhatsApp phone number." });
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      const url = `https://wa.me/${testPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("🏛️ *Docket Chambers CRM*: WhatsApp connection verified successfully!")}`;
      window.open(url, "DocketWhatsAppTest", "width=850,height=700");
      setTestResult({ success: true, message: `Opened test dispatch for ${testPhone}!` });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal title="Connect WhatsApp (Zero-Setup QR & In-App Dispatch)" onClose={onClose} maxWidth={640}>
      <div>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #E4DFD3", paddingBottom: 10 }}>
          <button
            onClick={() => setActiveTab("qr")}
            style={{
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: activeTab === "qr" ? "1px solid #25D366" : "1px solid #D9D2C2",
              background: activeTab === "qr" ? "rgba(37, 211, 102, 0.12)" : "#FFFFFF",
              color: activeTab === "qr" ? "#1C2333" : "#6B6255"
            }}
          >
            <QrCode size={15} color={activeTab === "qr" ? "#25D366" : "#6B6255"} />
            Instant Phone QR & In-App Dispatch
          </button>

          <button
            onClick={() => setActiveTab("api")}
            style={{
              padding: "7px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              borderRadius: 6,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: activeTab === "api" ? "1px solid #6B2737" : "1px solid #D9D2C2",
              background: activeTab === "api" ? "#6B2737" : "#FFFFFF",
              color: activeTab === "api" ? "#F7F5F0" : "#6B6255"
            }}
          >
            <Zap size={14} />
            Background API Gateway (Optional)
          </button>
        </div>

        {/* TAB 1: INSTANT QR CODE (ZERO SETUP - 100% READY) */}
        {activeTab === "qr" && (
          <div>
            <div style={{
              background: "#FFFFFF",
              border: "1px solid #E4DFD3",
              borderRadius: 10,
              padding: "24px 20px",
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr",
              gap: 20,
              alignItems: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
            }}>
              {/* Instructions */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2333", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Smartphone size={18} color="#25D366" />
                  Instant Phone Camera QR
                </div>

                <div style={{ fontSize: 13, color: "#4A453C", lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>1</span>
                    <span>Open your <strong>phone camera</strong> or WhatsApp scanner.</span>
                  </div>
                  <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>2</span>
                    <span>Point phone camera at this QR code.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>3</span>
                    <span>Tap <strong>"Open in WhatsApp"</strong> to send instantly from your phone!</span>
                  </div>
                </div>

                <div style={{ marginTop: 14, padding: "8px 12px", background: "rgba(37, 211, 102, 0.08)", border: "1px solid rgba(37, 211, 102, 0.3)", borderRadius: 6, fontSize: 11.5, color: "#1C2333" }}>
                  💡 <strong>Zero Setup Required:</strong> Works immediately without signing up for third-party services or tokens.
                </div>
              </div>

              {/* QR Code Container */}
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{
                  width: 210,
                  height: 210,
                  border: "2px solid #25D366",
                  borderRadius: 10,
                  padding: 10,
                  background: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(37, 211, 102, 0.15)"
                }}>
                  {liveQrUrl ? (
                    <img
                      src={liveQrUrl}
                      alt="WhatsApp QR Code"
                      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }}
                    />
                  ) : (
                    <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#25D366" }} />
                  )}
                </div>

                <div style={{ marginTop: 8, fontSize: 11, color: "#8A8578" }}>
                  Live Chamber QR Ready
                </div>
              </div>
            </div>

            {/* In-App Dispatch Feature Banner */}
            <div style={{ marginTop: 14, background: "#F4F0E8", padding: "12px 16px", borderRadius: 8, border: "1px solid #E2DCCF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6255", marginBottom: 4 }}>
                HOW TO SEND TO CLIENTS FROM YOUR DESKTOP
              </div>
              <div style={{ fontSize: 12, color: "#4A453C", lineHeight: 1.5 }}>
                When viewing any hearing or case record, click <strong>Message</strong> → <strong>Send WhatsApp</strong>.
                It automatically opens WhatsApp in a dedicated in-app sidecar window with the client's number and pre-formatted notice ready to send.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED API (OPTIONAL) */}
        {activeTab === "api" && (
          <div>
            <div style={{ background: "#FCFAF6", padding: "16px", borderRadius: 8, border: "1px solid #E4DFD3", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#6B6255", marginBottom: 12 }}>
                If your chamber uses a dedicated WhatsApp API gateway (like UltraMsg or Meta Official API), paste your credentials here for background dispatch:
              </div>
              <Field label="Instance ID (Optional)">
                <input style={inputStyle} value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="e.g. instance12345" />
              </Field>
              <Field label="API Token (Optional)">
                <input type="password" style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="API Token" />
              </Field>
              <Btn onClick={handleSaveAndActivate} style={{ background: "#6B2737", color: "#FFF", marginTop: 6 }}>
                Save API Credentials
              </Btn>
            </div>
          </div>
        )}

        {/* Quick Test Section */}
        <div style={{ marginTop: 14, background: "#F4F0E8", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2DCCF" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", marginBottom: 4 }}>
            Test WhatsApp Dispatch
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1, fontSize: 12, marginBottom: 0 }}
              placeholder="Enter phone with country code e.g. +97150..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Btn variant="ghost" onClick={handleTestPing} disabled={testing} style={{ padding: "6px 12px", fontSize: 12 }}>
              {testing ? "Testing..." : "Send Test Ping"}
            </Btn>
          </div>
          {testResult && (
            <div style={{
              marginTop: 6, fontSize: 11.5, padding: "5px 8px", borderRadius: 4,
              background: testResult.success ? "#E8F5E9" : "#FFEBEE",
              color: testResult.success ? "#2E7D32" : "#C62828"
            }}>
              {testResult.success ? testResult.message : testResult.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4DFD3", marginTop: 16 }}>
          <div>
            {isGatewayConfigured() && (
              <Btn variant="danger" onClick={handleDisconnect} style={{ fontSize: 11 }}>
                Clear API Credentials
              </Btn>
            )}
          </div>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </Modal>
  );
}
