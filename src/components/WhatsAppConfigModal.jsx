import React, { useState, useEffect } from "react";
import { 
  MessageSquare, Check, AlertCircle, Sparkles, Send, 
  ExternalLink, ShieldCheck, Zap, RefreshCw, X, QrCode, Smartphone, CheckCircle2, ChevronRight
} from "lucide-react";
import { Modal, Btn, Field, inputStyle } from "./UI";
import { 
  GATEWAY_PROVIDERS, 
  getGatewayConfig, 
  saveGatewayConfig, 
  clearGatewayConfig,
  isGatewayConfigured,
  sendDirectWhatsApp,
  getQrCodeUrl,
  checkInstanceStatus
} from "../lib/whatsappGateway";

export default function WhatsAppConfigModal({ onClose, onSaved }) {
  const current = getGatewayConfig();
  const [activeTab, setActiveTab] = useState("qr"); // "qr" or "api"
  const [provider, setProvider] = useState(current.provider || "ultramsg");
  const [instanceId, setInstanceId] = useState(current.instanceId || "");
  const [token, setToken] = useState(current.token || "");
  const [phoneNumberId, setPhoneNumberId] = useState(current.phoneNumberId || "");
  const [apiUrl, setApiUrl] = useState(current.apiUrl || "");

  const [qrKey, setQrKey] = useState(Date.now());
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Check live status on load
  useEffect(() => {
    if (isGatewayConfigured()) {
      checkStatus();
    }
  }, []);

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await checkInstanceStatus({ provider, instanceId, token });
      setConnectionStatus(res);
    } catch (e) {
      console.warn("Status check failed:", e);
    } finally {
      setCheckingStatus(false);
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
    setQrKey(Date.now());
    checkStatus();
    if (onSaved) onSaved();
  };

  const handleDisconnect = () => {
    clearGatewayConfig();
    setConnectionStatus(null);
    if (onSaved) onSaved();
  };

  const handleRefreshQr = () => {
    setQrKey(Date.now());
    checkStatus();
  };

  const handleTestPing = async () => {
    if (!testPhone) {
      setTestResult({ success: false, error: "Enter a test WhatsApp phone number." });
      return;
    }
    setTesting(true);
    setTestResult(null);

    try {
      await sendDirectWhatsApp({
        to: testPhone,
        message: "🏛️ *Docket Chambers CRM*: In-App WhatsApp connection verified successfully!"
      });
      setTestResult({ success: true, message: `Delivered test ping to ${testPhone}!` });
    } catch (err) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  const qrImageUrl = (instanceId && token) 
    ? `https://api.ultramsg.com/${instanceId.trim()}/instance/qrimage?token=${token.trim()}&t=${qrKey}` 
    : null;

  return (
    <Modal title="Connect WhatsApp (WhatsApp Web QR Scan)" onClose={onClose} maxWidth={640}>
      <div>
        {/* Navigation Tabs: QR Code vs API Settings */}
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
            Scan QR Code (WhatsApp Web)
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
            API & Token Credentials
          </button>
        </div>

        {/* TAB 1: SCAN QR CODE (WHATSAPP WEB STYLE) */}
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
              {/* Instructions list */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1C2333", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <Smartphone size={18} color="#25D366" />
                  Link Chamber Phone
                </div>

                <div style={{ fontSize: 13, color: "#4A453C", lineHeight: 1.6 }}>
                  <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>1</span>
                    <span>Open <strong>WhatsApp</strong> on your phone.</span>
                  </div>
                  <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>2</span>
                    <span>Tap <strong>Menu (⋮)</strong> or <strong>Settings</strong> → <strong>Linked Devices</strong>.</span>
                  </div>
                  <div style={{ marginBottom: 8, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>3</span>
                    <span>Tap <strong>Link a Device</strong>.</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ background: "#25D366", color: "#FFF", borderRadius: "50%", width: 18, height: 18, fontSize: 11, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>4</span>
                    <span>Point phone camera at this QR code.</span>
                  </div>
                </div>

                {connectionStatus?.connected && (
                  <div style={{ marginTop: 14, padding: "8px 12px", background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 6, color: "#2E7D32", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={16} />
                    <span><strong>Connected:</strong> {connectionStatus.phone || "Chamber WhatsApp Active"}</span>
                  </div>
                )}
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
                  position: "relative",
                  boxShadow: "0 8px 24px rgba(37, 211, 102, 0.15)"
                }}>
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="WhatsApp Web QR Code"
                      style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 6 }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: "center", padding: 12, color: "#8A8578" }}>
                      <QrCode size={48} color="#D1D5DB" style={{ marginBottom: 8 }} />
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: "#1C2333" }}>Instance ID & Token Required</div>
                      <div style={{ fontSize: 10.5, marginTop: 4 }}>Enter your instance credentials below to render your live WhatsApp QR code.</div>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    onClick={handleRefreshQr}
                    style={{ background: "none", border: "1px solid #D9D2C2", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#6B6255", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <RefreshCw size={11} /> Refresh QR Code
                  </button>

                  <button
                    onClick={checkStatus}
                    disabled={checkingStatus}
                    style={{ background: "#25D366", color: "#FFF", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    {checkingStatus ? <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={11} />}
                    {checkingStatus ? "Checking..." : "Check Status"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Instance Link Helper */}
            <div style={{ marginTop: 16, background: "#F4F0E8", padding: "14px 16px", borderRadius: 8, border: "1px solid #E2DCCF" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6255", marginBottom: 8 }}>
                ENTER YOUR QR INSTANCE CREDENTIALS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr auto", gap: 10, alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>INSTANCE ID</label>
                  <input
                    style={{ ...inputStyle, padding: "6px 10px", fontSize: 12, marginBottom: 0 }}
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    placeholder="e.g. instance12345"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>TOKEN</label>
                  <input
                    type="password"
                    style={{ ...inputStyle, padding: "6px 10px", fontSize: 12, marginBottom: 0 }}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Instance token from UltraMsg"
                  />
                </div>
                <Btn onClick={handleSaveAndActivate} style={{ background: "#25D366", color: "#FFFFFF", padding: "6px 14px", fontSize: 12 }}>
                  Load QR Code
                </Btn>
              </div>
              <div style={{ fontSize: 11, color: "#8A8578", marginTop: 8 }}>
                💡 Don't have a QR instance yet? Create a free instance on <a href="https://ultramsg.com" target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 600 }}>ultramsg.com</a> or <a href="https://whapi.cloud" target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 600 }}>whapi.cloud</a> in 1 minute, paste credentials, and scan your phone!
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ADVANCED API CREDENTIALS */}
        {activeTab === "api" && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", marginBottom: 6 }}>
                PROVIDER TYPE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                {GATEWAY_PROVIDERS.map((p) => {
                  const active = provider === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        cursor: "pointer",
                        border: `1.5px solid ${active ? "#6B2737" : "#E4DFD3"}`,
                        background: active ? "rgba(107, 39, 55, 0.06)" : "#FFFFFF",
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? "#6B2737" : "#4A453C"
                      }}
                    >
                      {p.name}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: "#FCFAF6", padding: "16px", borderRadius: 8, border: "1px solid #E4DFD3", marginBottom: 14 }}>
              {provider === "ultramsg" && (
                <>
                  <Field label="Instance ID" sub="UltraMsg Dashboard Instance ID">
                    <input style={inputStyle} value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="instance12345" />
                  </Field>
                  <Field label="Token" sub="Instance API Token">
                    <input type="password" style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" />
                  </Field>
                </>
              )}

              {provider === "meta" && (
                <>
                  <Field label="Phone Number ID" sub="From Meta WhatsApp App Setup">
                    <input style={inputStyle} value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="10582910..." />
                  </Field>
                  <Field label="Permanent Access Token" sub="System user access token">
                    <input type="password" style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="EAABw..." />
                  </Field>
                </>
              )}

              {provider === "whapi" && (
                <>
                  <Field label="API Endpoint (Optional)">
                    <input style={inputStyle} value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://gate.whapi.cloud/messages/text" />
                  </Field>
                  <Field label="Bearer API Token">
                    <input type="password" style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Whapi Token" />
                  </Field>
                </>
              )}

              {provider === "custom" && (
                <>
                  <Field label="REST Endpoint">
                    <input style={inputStyle} value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.yourchambers.com/send" />
                  </Field>
                  <Field label="Auth Token (Optional)">
                    <input type="password" style={inputStyle} value={token} onChange={(e) => setToken(e.target.value)} placeholder="Secret token" />
                  </Field>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={handleSaveAndActivate} style={{ background: "#6B2737", color: "#FFF" }}>
                Save API Credentials
              </Btn>
            </div>
          </div>
        )}

        {/* Live Test Ping Section */}
        <div style={{ marginTop: 14, background: "#F4F0E8", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2DCCF" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", marginBottom: 4 }}>
            Verify Delivery (Send Test Ping)
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1, fontSize: 12, marginBottom: 0 }}
              placeholder="Your phone number e.g. +91 98401..."
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
            />
            <Btn variant="ghost" onClick={handleTestPing} disabled={testing} style={{ padding: "6px 12px", fontSize: 12 }}>
              {testing ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={12} />}
              {testing ? "Testing..." : "Send Test"}
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
                Disconnect WhatsApp
              </Btn>
            )}
          </div>
          <Btn variant="ghost" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </Modal>
  );
}
