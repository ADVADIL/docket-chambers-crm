import React, { useState } from "react";
import { MATTER_STATUSES, BILL_STATUSES, PRACTICE_AREAS, COURTS, STATUTORY_DEADLINE_TYPES, INQUIRY_STATUSES, INQUIRY_SOURCES } from "../constants";
import { uid, todayISO } from "../utils";
import { Modal, Field, Btn, inputStyle } from "./UI";

export function ClientForm({ record, onClose, onSave }) {
  const [f, setF] = useState(record || { id: uid(), name: "", company: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!f.name.trim()) newErrors.name = "Client name is required";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) newErrors.email = "Invalid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Modal title={record ? "Edit Client File" : "Register New Client"} onClose={onClose}>
      <Field label="Full Name / Entity Name *" error={errors.name}>
        <input style={{ ...inputStyle, borderColor: errors.name ? "#6B2737" : "#D9D2C2" }} value={f.name} onChange={set("name")} autoFocus placeholder="e.g. Al-Mansoor Trading LLC" />
      </Field>
      <Field label="Company / Organization"><input style={inputStyle} value={f.company} onChange={set("company")} placeholder="e.g. Parent Company" /></Field>
      <Field label="Email Address" error={errors.email}>
        <input style={{ ...inputStyle, borderColor: errors.email ? "#6B2737" : "#D9D2C2" }} value={f.email} onChange={set("email")} placeholder="counsel@entity.com" />
      </Field>
      <Field label="Phone / Mobile"><input style={inputStyle} value={f.phone} onChange={set("phone")} placeholder="+971 5X XXX XXXX" /></Field>
      <Field label="Chamber Notes"><textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={f.notes} onChange={set("notes")} placeholder="Key contacts, billing instructions..." /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f)}>Save Client Record</Btn>
      </div>
    </Modal>
  );
}

export function MatterForm({ record, clients = [], onClose, onSave }) {
  const safeClients = Array.isArray(clients) ? clients : [];
  const [f, setF] = useState(record || { 
    id: uid(), 
    title: "", 
    clientId: safeClients[0]?.id || "", 
    caseNumber: "",
    court: COURTS[0] || "",
    practiceArea: PRACTICE_AREAS[0], 
    advocate: "", 
    status: "Intake", 
    filingDate: todayISO(), 
    deadlineDate: "",
    deadlineType: STATUTORY_DEADLINE_TYPES[0],
    deadlineNotes: "",
    notes: "" 
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!f.title.trim()) newErrors.title = "Matter title is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Modal title={record ? "Edit Matter Docket" : "Open New Case Docket"} onClose={onClose} maxWidth={580}>
      <Field label="Matter Title / Cause Title *" error={errors.title}>
        <input style={{ ...inputStyle, borderColor: errors.title ? "#6B2737" : "#D9D2C2" }} value={f.title} onChange={set("title")} autoFocus placeholder="e.g. Apex vs. Port Authority" />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Suit / Case / Petition No.">
            <input style={inputStyle} value={f.caseNumber || ""} onChange={set("caseNumber")} placeholder="e.g. ARB/2026/89 or CS 412/2026" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Court / Judicial Forum">
            <select style={inputStyle} value={f.court || COURTS[0]} onChange={set("court")}>
              {COURTS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Client">
            <select style={inputStyle} value={f.clientId} onChange={set("clientId")}>
              <option value="">— Unassigned —</option>
              {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Practice Area">
            <select style={inputStyle} value={f.practiceArea} onChange={set("practiceArea")}>
              {PRACTICE_AREAS.map((area) => (<option key={area} value={area}>{area}</option>))}
            </select>
          </Field>
        </div>
      </div>

      <Field label="Assigned Advocate / Lead Counsel">
        <input style={inputStyle} value={f.advocate} onChange={set("advocate")} placeholder="e.g. Adv. Mohamed Adil" />
      </Field>

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Procedural Stage / Status">
            <select style={inputStyle} value={f.status} onChange={set("status")}>
              {MATTER_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Filing / Registry Date">
            <input type="date" style={inputStyle} value={f.filingDate} onChange={set("filingDate")} />
          </Field>
        </div>
      </div>

      {/* Statutory Limitation & Critical Deadline Section */}
      <div style={{ background: "#FBF9F5", border: "1px solid #EFEBE1", padding: "12px 14px", borderRadius: 6, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#6B6255", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Statutory Limitation & Filing Deadline (Optional)
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>DEADLINE TYPE</label>
            <select style={inputStyle} value={f.deadlineType || STATUTORY_DEADLINE_TYPES[0]} onChange={set("deadlineType")}>
              {STATUTORY_DEADLINE_TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div style={{ width: 150 }}>
            <label style={{ display: "block", fontSize: 10.5, color: "#8A8578", marginBottom: 2 }}>CUTOFF DATE</label>
            <input type="date" style={inputStyle} value={f.deadlineDate || ""} onChange={set("deadlineDate")} />
          </div>
        </div>
      </div>

      <Field label="Case Notes & Strategic Diary">
        <textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={f.notes} onChange={set("notes")} placeholder="Key facts, legal issues, prayer sought, limitation notes..." />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f)}>Save Case Docket</Btn>
      </div>
    </Modal>
  );
}

export function HearingForm({ record, matters = [], onClose, onSave }) {
  const safeMatters = Array.isArray(matters) ? matters : [];
  const [f, setF] = useState(record || { id: uid(), matterId: safeMatters[0]?.id || "", date: todayISO(), time: "", court: COURTS[0], notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!f.matterId) newErrors.matterId = "Select a matter";
    if (!f.date) newErrors.date = "Hearing date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Modal title={record ? "Edit Hearing Listing" : "Schedule Hearing / Listing"} onClose={onClose}>
      <Field label="Matter *" error={errors.matterId}>
        <select style={{ ...inputStyle, borderColor: errors.matterId ? "#6B2737" : "#D9D2C2" }} value={f.matterId} onChange={set("matterId")}>
          <option value="">— Select matter —</option>
          {safeMatters.map((m) => (<option key={m.id} value={m.id}>{m.title}</option>))}
        </select>
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Hearing Date *" error={errors.date}>
            <input type="date" style={{ ...inputStyle, borderColor: errors.date ? "#6B2737" : "#D9D2C2" }} value={f.date} onChange={set("date")} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Time">
            <input type="time" style={inputStyle} value={f.time || ""} onChange={set("time")} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Court / Forum">
            <select style={inputStyle} value={f.court} onChange={set("court")}>
              {COURTS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </Field>
        </div>
      </div>
      <Field label="Hearing Agenda / Notes"><textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={f.notes} onChange={set("notes")} placeholder="Submissions, witnesses, documents to carry..." /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f)}>Save Listing</Btn>
      </div>
    </Modal>
  );
}

export function BillingForm({ record, matters = [], onClose, onSave }) {
  const safeMatters = Array.isArray(matters) ? matters : [];
  const [f, setF] = useState(record || { id: uid(), matterId: safeMatters[0]?.id || "", description: "", amount: "", currency: "AED", date: todayISO(), status: "Draft" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!f.matterId) newErrors.matterId = "Select a matter";
    if (!f.amount || Number(f.amount) <= 0) newErrors.amount = "Valid amount is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Modal title={record ? "Edit Invoice" : "Issue Invoice / Fee Note"} onClose={onClose}>
      <Field label="Matter *" error={errors.matterId}>
        <select style={{ ...inputStyle, borderColor: errors.matterId ? "#6B2737" : "#D9D2C2" }} value={f.matterId} onChange={set("matterId")}>
          <option value="">— Select matter —</option>
          {safeMatters.map((m) => (<option key={m.id} value={m.id}>{m.title}</option>))}
        </select>
      </Field>
      <Field label="Description / Particulars"><input style={inputStyle} value={f.description} onChange={set("description")} placeholder="e.g. Drafting Writ Petition, Senior Appearance" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}>
          <Field label="Fee Amount *" error={errors.amount}>
            <input type="number" style={{ ...inputStyle, borderColor: errors.amount ? "#6B2737" : "#D9D2C2" }} value={f.amount} onChange={set("amount")} placeholder="0.00" min="0" step="0.01" />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Currency">
            <select style={inputStyle} value={f.currency} onChange={set("currency")}>
              <option>AED</option><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option><option>SAR</option>
            </select>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Date"><input type="date" style={inputStyle} value={f.date} onChange={set("date")} /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Status">
            <select style={inputStyle} value={f.status} onChange={set("status")}>
              {BILL_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave({ ...f, amount: Number(f.amount) || 0 })}>Save Invoice</Btn>
      </div>
    </Modal>
  );
}

export function InquiryForm({ record, onClose, onSave }) {
  const [f, setF] = useState(record || {
    id: uid(),
    name: "",
    phone: "",
    email: "",
    subject: "",
    practiceArea: PRACTICE_AREAS[0],
    source: INQUIRY_SOURCES[0],
    status: "New",
    notes: "",
    followUpDate: "",
  });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const newErrors = {};
    if (!f.name.trim()) newErrors.name = "Name is required";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) newErrors.email = "Invalid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Modal title={record ? "Edit Inquiry" : "New Client Inquiry"} onClose={onClose}>
      <Field label="Name *" error={errors.name}>
        <input style={{ ...inputStyle, borderColor: errors.name ? "#6B2737" : "#D9D2C2" }} value={f.name} onChange={set("name")} autoFocus placeholder="Prospective client name" />
      </Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Phone / Mobile"><input style={inputStyle} value={f.phone} onChange={set("phone")} placeholder="+971 5X XXX XXXX" /></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Email" error={errors.email}><input style={{ ...inputStyle, borderColor: errors.email ? "#6B2737" : "#D9D2C2" }} value={f.email} onChange={set("email")} placeholder="client@email.com" /></Field>
        </div>
      </div>
      <Field label="Subject / What they need"><input style={inputStyle} value={f.subject} onChange={set("subject")} placeholder="e.g. Land title dispute, contract review" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Practice Area">
            <select style={inputStyle} value={f.practiceArea} onChange={set("practiceArea")}>
              {PRACTICE_AREAS.map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Source">
            <select style={inputStyle} value={f.source} onChange={set("source")}>
              {INQUIRY_SOURCES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Status">
            <select style={inputStyle} value={f.status} onChange={set("status")}>
              {INQUIRY_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Follow-up Date"><input type="date" style={inputStyle} value={f.followUpDate || ""} onChange={set("followUpDate")} /></Field>
        </div>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 65, resize: "vertical" }} value={f.notes} onChange={set("notes")} placeholder="Consultation notes, conflict check, initial assessment..." /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f)}>Save Inquiry</Btn>
      </div>
    </Modal>
  );
}
