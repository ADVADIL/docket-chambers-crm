import React, { useState, useEffect, useMemo } from "react";
import { 
  Send, MessageSquare, Mail, Copy, Check, Printer, 
  ExternalLink, Sparkles, AlertCircle, RefreshCw, User, Phone, AtSign
} from "lucide-react";
import { Modal, Btn, Field, inputStyle } from "./UI";
import { 
  COMM_TEMPLATES, 
  buildWhatsAppUrl, 
  buildMailtoUrl, 
  cleanPhoneNumber 
} from "../commTemplates";

export default function ClientCommModal({
  initialType = "hearing_reminder",
  initialData = {},
  clients = [],
  matters = [],
  onClose
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

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(clientPhone, customBody);
    window.open(url, "_blank", "noopener,noreferrer");
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
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 10, borderBottom: "1px solid #E4DFD3", marginBottom: 16 }}>
          {COMM_TEMPLATES.map((tmpl) => {
            const active = templateId === tmpl.id;
            return (
              <button
                key={tmpl.id}
                onClick={() => {
                  setTemplateId(tmpl.id);
                  setIsManualEdit(false);
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
        <div style={{ background: "#F4F0E8", padding: "12px 14px", borderRadius: 6, marginBottom: 16, border: "1px solid #E2DCCF" }}>
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
                placeholder="+971... or 98..."
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
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={13} color="#B08D57" /> Message Composer & Preview
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
            rows={11}
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
            <span>Tip: Formatting with *asterisks* creates bold text in WhatsApp.</span>
            <span>{customBody.length} characters</span>
          </div>
        </div>

        {/* Action Channels Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4DFD3" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              variant="ghost"
              onClick={handleCopy}
              style={{ background: copied ? "#E8F5E9" : undefined, borderColor: copied ? "#81C784" : undefined, color: copied ? "#2E7D32" : undefined }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied to Clipboard!" : "Copy Text"}
            </Btn>
            <Btn variant="ghost" onClick={handlePrint} title="Generate formal printed dispatch letter">
              <Printer size={14} /> Print Memo
            </Btn>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn
              onClick={handleOpenWhatsApp}
              style={{ background: "#25D366", color: "#FFFFFF", border: "none" }}
              title={clientPhone ? `Send WhatsApp to ${clientPhone}` : "Open WhatsApp"}
            >
              <MessageSquare size={15} /> Send WhatsApp
            </Btn>
            <Btn
              onClick={handleOpenEmail}
              variant="primary"
              title={clientEmail ? `Send Email to ${clientEmail}` : "Open Mail Client"}
            >
              <Mail size={15} /> Send Email
            </Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}
