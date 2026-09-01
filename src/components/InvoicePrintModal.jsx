import React from "react";
import { Printer, Download, X, Gavel, ShieldCheck, Mail, Phone, Building } from "lucide-react";
import { Modal, Btn } from "./UI";
import { fmtDate, fmtCurrency, printElement } from "../utils";

export default function InvoicePrintModal({
  bill,
  matter,
  client,
  onClose
}) {
  if (!bill) return null;

  const invoiceNo = bill.invoiceNo || `CHN-${(bill.id || "").slice(0, 8).toUpperCase() || "2026-01"}`;
  const invoiceDate = fmtDate(bill.invoiceDate || bill.date || new Date());
  const currency = bill.currency || "AED";
  const amount = Number(bill.amount) || 0;

  // Auto-calculated itemized breakdown
  const appearanceFee = Math.round(amount * 0.65);
  const draftingFee = Math.round(amount * 0.25);
  const clerkageFee = amount - appearanceFee - draftingFee;

  const handlePrint = () => {
    printElement("invoice-printable-sheet", `Fee_Note_${invoiceNo}`);
  };

  return (
    <Modal title={`Chambers Fee Note — ${invoiceNo}`} onClose={onClose} maxWidth={820}>
      <div>
        {/* Action Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #E4DFD3" }}>
          <div style={{ fontSize: 12, color: "#6B6255" }}>
            Official printable fee note formatted for corporate accounting and court records.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={handlePrint} style={{ background: "#6B2737", color: "#F7F5F0" }}>
              <Printer size={14} /> Print / Save as PDF
            </Btn>
            <Btn variant="ghost" onClick={onClose}>
              <X size={14} /> Close
            </Btn>
          </div>
        </div>

        {/* Printable Memo Document Sheet */}
        <div 
          id="invoice-printable-sheet"
          style={{
            background: "#FFFFFF",
            border: "1px solid #D9D2C2",
            borderRadius: 6,
            padding: "44px 50px",
            color: "#1C2333",
            fontFamily: "'Times New Roman', serif",
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            lineHeight: 1.5
          }}
        >
          {/* Chambers Crest & Header */}
          <div style={{ textAlign: "center", borderBottom: "2.5px solid #1C2333", paddingBottom: 20, marginBottom: 28 }}>
            <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: 1.5, textTransform: "uppercase", color: "#1C2333" }}>
              CHAMBERS OF ADV. MOHAMED ADIL
            </div>
            <div style={{ fontSize: 13, letterSpacing: 1, textTransform: "uppercase", color: "#4A453C", marginTop: 4 }}>
              ADVOCATES & LEGAL CONSULTANTS • LITIGATION PRACTICE REGISTRY
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>
              Bar Council Registry No: D/1842/2016 • High Court & Appellate Chambers • Dubai / New Delhi
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 30, marginBottom: 30, fontSize: 13.5 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", fontWeight: "bold", color: "#888", letterSpacing: 0.5, marginBottom: 4 }}>
                BILLED TO (CLIENT):
              </div>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#1C2333" }}>
                {client?.name || "Valued Corporate Client"}
              </div>
              {client?.company && (
                <div style={{ color: "#444" }}>{client.company}</div>
              )}
              {client?.phone && <div>Phone: {client.phone}</div>}
              {client?.email && <div>Email: {client.email}</div>}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: "bold", color: "#6B2737" }}>
                FEE MEMO / INVOICE
              </div>
              <div style={{ marginTop: 6 }}>
                <strong>Invoice No:</strong> {invoiceNo}
              </div>
              <div>
                <strong>Date of Issue:</strong> {invoiceDate}
              </div>
              <div>
                <strong>Status:</strong> <span style={{ textTransform: "uppercase", fontWeight: "bold", color: bill.status === "Paid" ? "#2E7D32" : "#C62828" }}>{bill.status || "Unpaid"}</span>
              </div>
            </div>
          </div>

          {/* Matter Reference Box */}
          <div style={{ background: "#FBF9F5", border: "1px solid #EFEBE1", borderRadius: 4, padding: "12px 18px", marginBottom: 28, fontSize: 13.5 }}>
            <strong>LEGAL MATTER REFERENCE:</strong> {matter?.title || bill.matterLabel || "General Legal Counsel & Litigation Retainer"}<br />
            {matter?.caseNumber && <><strong>SUIT / CASE NUMBER:</strong> {matter.caseNumber} &nbsp;&nbsp;|&nbsp;&nbsp; </>}
            <strong>FORUM / BENCH:</strong> {matter?.court || "Hon'ble Court / Arbitral Tribunal"}
          </div>

          {/* Itemized Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #1C2333", borderTop: "1px solid #1C2333", background: "#F7F5F0" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>DESCRIPTION OF LEGAL SERVICES</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, width: 140 }}>AMOUNT ({currency})</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: 13.5 }}>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "12px" }}>
                  <strong>Senior Counsel Court Appearances & Oral Arguments</strong><br />
                  <span style={{ fontSize: 12, color: "#666" }}>Appearance before the Hon'ble Bench, case preparation, and trial submissions.</span>
                </td>
                <td style={{ textAlign: "right", padding: "12px", fontFamily: "'Courier New', monospace" }}>
                  {fmtCurrency(appearanceFee, currency)}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "12px" }}>
                  <strong>Drafting of Pleadings, Affidavits & Legal Submissions</strong><br />
                  <span style={{ fontSize: 12, color: "#666" }}>Preparation, settlement, and verification of petition, written statement, and exhibits.</span>
                </td>
                <td style={{ textAlign: "right", padding: "12px", fontFamily: "'Courier New', monospace" }}>
                  {fmtCurrency(draftingFee, currency)}
                </td>
              </tr>
              <tr style={{ borderBottom: "1.5px solid #1C2333" }}>
                <td style={{ padding: "12px" }}>
                  <strong>Chambers Out-of-Pocket Disbursements, Court Fees & Clerkage</strong><br />
                  <span style={{ fontSize: 12, color: "#666" }}>Registry filing fees, paper book reproduction, and administrative disbursements.</span>
                </td>
                <td style={{ textAlign: "right", padding: "12px", fontFamily: "'Courier New', monospace" }}>
                  {fmtCurrency(clerkageFee, currency)}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td style={{ textAlign: "right", padding: "12px", fontWeight: "bold", fontSize: 15 }}>
                  TOTAL PROFESSIONAL CHARGES PAYABLE:
                </td>
                <td style={{ textAlign: "right", padding: "12px", fontWeight: "bold", fontSize: 16, color: "#6B2737", fontFamily: "'Courier New', monospace" }}>
                  {fmtCurrency(amount, currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Wire & Bank Instructions */}
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, paddingTop: 16, borderTop: "1px solid #DDD", fontSize: 12 }}>
            <div>
              <div style={{ fontWeight: "bold", marginBottom: 4, textTransform: "uppercase", fontSize: 11.5, color: "#444" }}>
                CHAMBERS WIRE & REMITTANCE INSTRUCTIONS:
              </div>
              <div><strong>Account Name:</strong> Chambers of Adv. Mohamed Adil</div>
              <div><strong>Bank Name:</strong> Emirates NBD / Standard Chartered</div>
              <div><strong>Account / IBAN:</strong> AE140260001092837461</div>
              <div><strong>SWIFT / BIC:</strong> ENBDAEADXXX</div>
              <div style={{ color: "#666", marginTop: 4 }}>Please quote Invoice No. <strong>{invoiceNo}</strong> in transfer description.</div>
            </div>

            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
              <div style={{ width: 160, borderBottom: "1px solid #1C2333", marginBottom: 6 }} />
              <div style={{ fontWeight: "bold", fontSize: 13 }}>ADVOCATE-ON-RECORD</div>
              <div style={{ fontSize: 11, color: "#666" }}>Chambers of Adv. Mohamed Adil</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
