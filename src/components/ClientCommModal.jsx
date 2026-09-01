import React, { useState, useEffect, useMemo } from "react";
import { 
  Send, MessageSquare, Mail, Copy, Check, Printer, 
  ExternalLink, Sparkles, AlertCircle, RefreshCw, User, Phone, AtSign,
  Zap, Settings, CheckCircle2, QrCode, Smartphone, X
} from "lucide-react";
import QRCode from "qrcode";
import { Modal, Btn, Field, inputStyle } from "./UI";
import { 
  COMM_TEMPLATES, 
  buildWhatsAppUrl, 
  buildWaMeUrl,
  buildMailtoUrl, 
  cleanPhoneNumber 
} from "../commTemplates";
import { 
  isGatewayConfigured, 
  getGatewayConfig, 
  sendDirectWhatsApp 
} from "../lib/whatsappGateway";

export default function ClientCommModal({
  initialType = "hearing_reminder",
  initialData = {},
  clients = [],
  matters = [],
  onClose,
  onOpenGatewayConfig
}) {
  const [templateId, setTemplateId] = useState(initialType);
  const [selectedClientId, setSelectedClientId] = useState(initialData.clientId || "");
  const [clientName, setClientName] = useState(initialData.clientName || "");
  const [clientPhone, setClientPhone] = useState(initialData.clientPhone || "");
  const [clientEmail, setClientEmail] = useState(initialData.clientEmail || "");
  
  const [matterTitle, setMatterTitle] = useState(initialData.matterTitle || "");
  const [caseNumber, setCaseNumber] = useState(initialData.caseNumber || "");
  const [court, setCourt] = useState(initialData.court || "");
  const [hearingDate, setHearingDate] = useState(initialData.date || "");
  const [notes, setNotes] = useState(initialData.notes || "");
  const [outcome, setOutcome] = useState(initialData.outcome || "");
  const [nextDate, setNextDate] = useState(initialData.nextDate || "");
  const [advocate, setAdvocate] = useState(initialData.advocate || "Chambers of Adv. Adil");

  // For billing reminders
  const [amount, setAmount] = useState(initialData.amount || "");
  const [currency, setCurrency] = useState(initialData.currency || "AED");
  const [description, setDescription] = useState(initialData.description || "");

  // Editable body
  const [customBody, setCustomBody] = useState("");
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [copied, setCopied] = useState(false);

  // In-App Instant QR Code Generator
  const [showPhoneQr, setShowPhoneQr] = useState(false);
  const [phoneQrUrl, setPhoneQrUrl] = useState("");
  const [generatingQr, setGeneratingQr] = useState(false);

  // In-app direct WhatsApp dispatch states
  const hasGateway = isGatewayConfigured();
  const gatewayConfig = getGatewayConfig();
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [whatsappStatus, setWhatsappStatus] = useState(null);

  // If a client is selected from dropdown
  useEffect(() => {
    if (selectedClientId) {
      const c = clients.find((item) => item.id === selectedClientId);
      if (c) {
        setClientName(c.name || "");
        setClientPhone(c.phone || "");
        setClientEmail(c.email || "");
      }
    }
  }, [selectedClientId, clients]);

  // Current active template definition
  const currentTemplate = useMemo(() => {
    return COMM_TEMPLATES.find((t) => t.id === templateId) || COMM_TEMPLATES[0];
  }, [templateId]);

  // Payload for template generator
  const templatePayload = useMemo(() => ({
    clientName,
    clientPhone,
    clientEmail,
    matterTitle,
    caseNumber,
    court,
    date: hearingDate,
    notes,
    outcome,
    nextDate,
    advocate,
    amount,
    currency,
    description,
    hearings: initialData.hearings || [],
    customMessage: notes
  }), [
    clientName, clientPhone, clientEmail, matterTitle, caseNumber,
    court, hearingDate, notes, outcome, nextDate, advocate,
    amount, currency, description, initialData.hearings
  ]);

  // Auto-generate text when dependencies change (if not manually edited)
  useEffect(() => {
    if (!isManualEdit) {
      const generated = currentTemplate.generate(templatePayload);
      setCustomBody(generated);
    }
  }, [currentTemplate, templatePayload, isManualEdit]);

  // Generate on-screen QR code whenever phone/text changes
  useEffect(() => {
    if (showPhoneQr && customBody) {
      generateQrCode();
    }
  }, [showPhoneQr, clientPhone, customBody]);

  const generateQrCode = async () => {
    setGeneratingQr(true);
    try {
      const targetUrl = buildWaMeUrl(clientPhone, customBody);
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: "#1C2333",
          light: "#FFFFFF"
        }
      });
      setPhoneQrUrl(dataUrl);
    } catch (e) {
      console.error("Failed to generate QR code:", e);
    } finally {
      setGeneratingQr(false);
    }
  };

  const handleResetToTemplate = () => {
    setIsManualEdit(false);
    const generated = currentTemplate.generate(templatePayload);
    setCustomBody(generated);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  // Primary WhatsApp Dispatcher:
  // 1. If user has a background gateway configured, sends in background.
  // 2. Otherwise, opens WhatsApp Web directly in a new tab without popup blocker issues.
  const handleSendWhatsApp = async () => {
    if (hasGateway) {
      setSendingWhatsApp(true);
      setWhatsappStatus(null);
      try {
        await sendDirectWhatsApp({
          to: clientPhone,
          message: customBody
        });
        setWhatsappStatus({
          success: true,
          message: `Dispatched directly to WhatsApp (${cleanPhoneNumber(clientPhone)})!`
        });
      } catch (err) {
        setWhatsappStatus({
          success: false,
          error: err.message || "Failed to dispatch via gateway."
        });
      } finally {
        setSendingWhatsApp(false);
      }
    } else {
      const url = buildWhatsAppUrl(clientPhone, customBody);
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const handleOpenEmail = () => {
    const subject = currentTemplate.subject(templatePayload);
    const url = buildMailtoUrl(clientEmail, subject, customBody);
    window.location.href = url;
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chambers Dispatch Memo - ${clientName || "Client"}</title>
          <style>
            body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
            .sub { font-size: 13px; color: #555; margin-top: 4px; }
            .meta { margin-bottom: 25px; font-size: 14px; }
            .body { white-space: pre-wrap; font-size: 14px; background: #fafafa; padding: 20px; border: 1px solid #ddd; }
            .footer { margin-top: 50px; font-size: 13px; border-top: 1px solid #ccc; padding-top: 15px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${advocate.toUpperCase()}</div>
            <div class="sub">ADVOCATES & LEGAL CONSULTANTS • CHAMBERS DISPATCH NOTICE</div>
          </div>
          <div class="meta">
            <strong>To:</strong> ${clientName || "Valued Client"}<br>
            ${clientPhone ? `<strong>Phone:</strong> ${clientPhone}<br>` : ""}
            ${clientEmail ? `<strong>Email:</strong> ${clientEmail}<br>` : ""}
            <strong>Date of Notice:</strong> ${new Date().toLocaleDateString()}<br>
            ${matterTitle ? `<strong>Matter:</strong> ${matterTitle}` : ""}
          </div>
          <div class="body">${customBody}</div>
          <div class="footer">
            Docket Chambers Practice Registry • Official Client Communication
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal title="Client Communications & Alerts" onClose={onClose} maxWidth={720}>
      <div>
        {/* Template Selector Tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, borderBottom: "1px solid #E4DFD3", marginBottom: 14 }}>
          {COMM_TEMPLATES.map((tmpl) => {
            const active = templateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setTemplateId(tmpl.id);
                  setIsManualEdit(false);
                  setWhatsappStatus(null);
                }}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  borderRadius: 5,
                  cursor: "pointer",
                  border: `1px solid ${active ? "#6B2737" : "#D9D2C2"}`,
                  background: active ? "#6B2737" : "#FFFFFF",
                  color: active ? "#F7F5F0" : "#4A453C",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s"
                }}
              >
                {tmpl.title}
              </button>
            );
          })}
        </div>

        {/* Recipient Details Bar */}
        <div style={{ background: "#F4F0E8", padding: "12px 14px", borderRadius: 6, marginBottom: 14, border: "1px solid #E2DCCF" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
            <User size={13} /> Recipient Information
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>CLIENT NAME</label>
              <input
                style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }}
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setIsManualEdit(false); }}
                placeholder="Client Name"
              />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>
                <Phone size={10} /> WHATSAPP / MOBILE
              </label>
              <input
                style={{ ...inputStyle, padding: "5px 8px", fontSize: 12, fontFamily: "'IBM Plex Mono', monospace" }}
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+971... or +91..."
              />
            </div>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>
                <AtSign size={10} /> EMAIL ADDRESS
              </label>
              <input
                style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }}
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@domain.com"
              />
            </div>
          </div>
        </div>

        {/* Live Composer & Message Preview */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="#B08D57" /> Message Preview
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {isManualEdit && (
                <button
                  onClick={handleResetToTemplate}
                  title="Re-generate from template"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
                >
                  <RefreshCw size={11} /> Reset template
                </button>
              )}
              <span style={{ fontSize: 11, color: isManualEdit ? "#B08D57" : "#8A8578", fontStyle: "italic" }}>
                {isManualEdit ? "Customized draft" : "Auto-formatted"}
              </span>
            </div>
          </div>

          <textarea
            rows={9}
            value={customBody}
            onChange={(e) => {
              setCustomBody(e.target.value);
              setIsManualEdit(true);
            }}
            style={{
              ...inputStyle,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              lineHeight: 1.55,
              resize: "vertical",
              padding: "10px 12px",
              background: "#FFFEFC",
              border: "1px solid #D9D2C2"
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 11, color: "#8A8578" }}>
            <span>Formatting: *bold*, _italics_. Dispatches directly to client WhatsApp.</span>
            <span>{customBody.length} characters</span>
          </div>

          {/* Status Alert if dispatched via gateway */}
          {whatsappStatus && (
            <div style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 6,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: whatsappStatus.success ? "#E8F5E9" : "#FFEBEE",
              color: whatsappStatus.success ? "#2E7D32" : "#C62828",
              border: `1px solid ${whatsappStatus.success ? "#A5D6A7" : "#FFCDD2"}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {whatsappStatus.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                <span>{whatsappStatus.success ? whatsappStatus.message : whatsappStatus.error}</span>
              </div>
            </div>
          )}
        </div>

        {/* ON-SCREEN PHONE QR CODE DRAWER (ZERO SETUP - 100% INSTANT) */}
        {showPhoneQr && (
          <div style={{
            background: "#FFFFFF",
            border: "2px solid #25D366",
            borderRadius: 8,
            padding: "16px 20px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 6px 20px rgba(37, 211, 102, 0.12)",
            animation: "fadeIn 0.2s ease-out"
          }}>
            <div style={{ flex: 1, paddingRight: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#25D366", fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
                <Smartphone size={18} />
                Point Phone Camera at QR Code
              </div>
              <div style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.5, marginBottom: 8 }}>
                Open your <strong>phone's normal CAMERA app</strong> (the photo camera) and point at this QR code. A yellow button will appear on your phone screen: <strong>"Open in WhatsApp"</strong>.
              </div>
              <div style={{ fontSize: 11.5, color: "#B71C1C", background: "#FFEBEE", padding: "4px 8px", borderRadius: 4, display: "inline-block" }}>
                ⚠️ Do NOT scan inside WhatsApp Linked Devices. Use your phone's standard photo camera.
              </div>
            </div>

            <div style={{ textAlign: "center", position: "relative" }}>
              <div style={{ width: 150, height: 150, background: "#FFF", borderRadius: 8, border: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {phoneQrUrl ? (
                  <img src={phoneQrUrl} alt="WhatsApp QR Code" style={{ width: 140, height: 140 }} />
                ) : (
                  <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", color: "#25D366" }} />
                )}
              </div>
              <button
                onClick={() => setShowPhoneQr(false)}
                style={{ position: "absolute", top: -8, right: -8, background: "#1C2333", color: "#FFF", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Action Channels Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #E4DFD3" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="ghost"
              onClick={handleCopy}
              style={{ background: copied ? "#E8F5E9" : undefined, borderColor: copied ? "#81C784" : undefined, color: copied ? "#2E7D32" : undefined }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Text"}
            </Btn>
            <Btn variant="ghost" onClick={handlePrint} title="Generate formal printed dispatch letter">
              <Printer size={14} /> Print Memo
            </Btn>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* INSTANT PHONE QR BUTTON */}
            <Btn
              variant="ghost"
              onClick={() => setShowPhoneQr(!showPhoneQr)}
              style={{
                borderColor: showPhoneQr ? "#25D366" : undefined,
                background: showPhoneQr ? "rgba(37, 211, 102, 0.1)" : undefined,
                color: showPhoneQr ? "#25D366" : undefined
              }}
              title="Generate a QR code to scan with your phone camera"
            >
              <QrCode size={14} /> {showPhoneQr ? "Hide QR" : "Scan Phone QR"}
            </Btn>

            {/* PRIMARY WHATSAPP BUTTON (ALWAYS WORKS INSTANTLY) */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
              <Btn
                onClick={handleSendWhatsApp}
                disabled={sendingWhatsApp}
                style={{ background: "#25D366", color: "#FFFFFF", border: "none", fontWeight: 600 }}
                title="Dispatch directly to WhatsApp"
              >
                {sendingWhatsApp ? (
                  <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <MessageSquare size={14} />
                )}
                {sendingWhatsApp ? "Dispatching..." : "Send WhatsApp"}
              </Btn>
              <a
                href={buildWhatsAppUrl(clientPhone, customBody)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 10, color: "#8A8578", marginTop: 2, textDecoration: "underline" }}
              >
                Direct link fallback
              </a>
            </div>

            <Btn
              onClick={handleOpenEmail}
              variant="primary"
              title={clientEmail ? `Send Email to ${clientEmail}` : "Open Mail Client"}
            >
              <Mail size={14} /> Send Email
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
