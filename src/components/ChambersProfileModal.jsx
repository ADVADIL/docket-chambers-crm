import React, { useState } from "react";
import { Landmark, Save } from "lucide-react";
import { Modal, Field, Btn, inputStyle } from "./UI";

export default function ChambersProfileModal({ profile, onClose, onSave }) {
  const [form, setForm] = useState({
    chambersName: profile?.chambersName || "",
    tagline: profile?.tagline || "",
    addressLine: profile?.addressLine || "",
    barRegistryNo: profile?.barRegistryNo || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
    accountName: profile?.accountName || "",
    bankName: profile?.bankName || "",
    accountIban: profile?.accountIban || "",
    swiftCode: profile?.swiftCode || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form, id: "main" });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title="Chambers Billing Profile" onClose={onClose} maxWidth={620}>
      <div style={{ marginBottom: 16, fontSize: 13, color: "#6B6255", lineHeight: 1.5 }}>
        These details are printed on every Chambers Fee Note & Invoice. Update them here — no need to edit code or redeploy.
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B2737", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Chambers Identity
      </div>
      <Field label="Chambers Name" sub="Printed in large bold letters at the top of every invoice">
        <input style={inputStyle} value={form.chambersName} onChange={set("chambersName")} placeholder="CHAMBERS OF ADV. MOHAMED ADIL" />
      </Field>
      <Field label="Tagline / Practice Line">
        <input style={inputStyle} value={form.tagline} onChange={set("tagline")} placeholder="ADVOCATES & LEGAL CONSULTANTS • LITIGATION PRACTICE REGISTRY" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Bar Registry No.">
          <input style={inputStyle} value={form.barRegistryNo} onChange={set("barRegistryNo")} placeholder="D/1842/2016" />
        </Field>
        <Field label="Chambers Address">
          <input style={inputStyle} value={form.addressLine} onChange={set("addressLine")} placeholder="High Court & Appellate Chambers • Dubai / New Delhi" />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="+91 93632 03351" />
        </Field>
        <Field label="Email">
          <input style={inputStyle} value={form.email} onChange={set("email")} placeholder="advmohamedadil@gmail.com" />
        </Field>
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#6B2737", textTransform: "uppercase", letterSpacing: 0.5, margin: "18px 0 10px" }}>
        Wire & Remittance Instructions
      </div>
      <Field label="Account Name">
        <input style={inputStyle} value={form.accountName} onChange={set("accountName")} placeholder="Chambers of Adv. Mohamed Adil" />
      </Field>
      <Field label="Bank Name">
        <input style={inputStyle} value={form.bankName} onChange={set("bankName")} placeholder="Emirates NBD" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Account / IBAN">
          <input style={inputStyle} value={form.accountIban} onChange={set("accountIban")} placeholder="AE140260001092837461" />
        </Field>
        <Field label="SWIFT / BIC">
          <input style={inputStyle} value={form.swiftCode} onChange={set("swiftCode")} placeholder="ENBDAEADXXX" />
        </Field>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? "Saving..." : "Save Billing Profile"}
        </Btn>
      </div>
    </Modal>
  );
}

export const ChambersProfileIcon = Landmark;
