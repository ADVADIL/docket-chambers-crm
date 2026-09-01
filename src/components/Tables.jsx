import React, { useState } from "react";
import { Users, Briefcase, Gavel, Receipt, Search, Edit3, Trash2, MessageSquare, Printer } from "lucide-react";
import { MATTER_STATUSES, MATTER_COLORS, BILL_COLORS, COURTS } from "../constants";
import { fmtDate, daysUntil, fmtCurrency } from "../utils";
import { Badge, EmptyState } from "./UI";

export function RowActions({ onEdit, onDelete, onComm, onPrint, commTitle = "Send Alert", printTitle = "Print Memo" }) {
  return (
    <td style={{ width: 105, textAlign: "right" }}>
      <div className="rowbtn" style={{ display: "inline-flex", gap: 2 }}>
        {onPrint && (
          <button
            onClick={onPrint}
            title={printTitle}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1C2333")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8578")}
          >
            <Printer size={13.5} />
          </button>
        )}
        {onComm && (
          <button
            onClick={onComm}
            title={commTitle}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4, transition: "color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#25D366")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8578")}
          >
            <MessageSquare size={13.5} />
          </button>
        )}
        <button
          onClick={onEdit}
          title="Edit"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4, transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6B2737")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8578")}
        >
          <Edit3 size={13.5} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4, transition: "color 0.15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#6B2737")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#8A8578")}
        >
          <Trash2 size={13.5} />
        </button>
      </div>
    </td>
  );
}

export function ClientsTable({ items, search, onEdit, onDelete, onComm }) {
  const filtered = items.filter((c) => (c.name + (c.company || "") + (c.email || "")).toLowerCase().includes(search.toLowerCase()));
  if (items.length === 0) return <EmptyState icon={Users} title="No clients registered" sub="Add your first client to get started." />;
  return (
    <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
      <table>
        <thead><tr><th>Client Name</th><th>Company / Firm</th><th>Email</th><th>Phone</th><th></th></tr></thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 600 }}>{c.name}</td>
              <td style={{ color: "#8A8578" }}>{c.company || "—"}</td>
              <td>{c.email || "—"}</td>
              <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{c.phone || "—"}</td>
              <RowActions 
                onEdit={() => onEdit(c)} 
                onDelete={() => onDelete(c.id)} 
                onComm={onComm ? () => onComm(c) : undefined}
                commTitle="Send Client Advisory / Message"
              />
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No matches found" sub={`No clients matching "${search}"`} />}
    </div>
  );
}

export function MattersTable({ items, search, clientName, onEdit, onDelete, onComm }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const filtered = items.filter((m) => {
    const matchesSearch = (m.title + (m.practiceArea || "") + clientName(m.clientId)).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (items.length === 0) return <EmptyState icon={Briefcase} title="No matters logged" sub="Open your first matter to begin tracking cases." />;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "#8A8578", fontWeight: 600, marginRight: 4 }}>STATUS:</span>
        {["All", ...MATTER_STATUSES].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            style={{
              padding: "4px 9px", fontSize: 11, borderRadius: 4, cursor: "pointer", border: "1px solid #E4DFD3",
              background: statusFilter === st ? "#6B2737" : "#FCFAF6",
              color: statusFilter === st ? "#F7F5F0" : "#6B6255",
              fontWeight: statusFilter === st ? 600 : 400
            }}
          >
            {st}
          </button>
        ))}
      </div>

      <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Matter Title</th><th>Client</th><th>Practice Area</th><th>Advocate</th><th>Status</th><th>Filed</th><th></th></tr></thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ fontWeight: 600, color: "#1C2333" }}>{m.title}</div>
                  <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                    {m.caseNumber ? `No: ${m.caseNumber} • ` : ""}{m.court || "Chambers"}
                  </div>
                  {m.deadlineDate && (
                    <div style={{ marginTop: 4 }}>
                      <Badge 
                        text={`Limitation: ${fmtDate(m.deadlineDate)} (${daysUntil(m.deadlineDate)}d)`} 
                        color={daysUntil(m.deadlineDate) <= 3 ? "#C62828" : "#B08D57"} 
                      />
                    </div>
                  )}
                </td>
                <td>{clientName(m.clientId)}</td>
                <td style={{ color: "#8A8578" }}>{m.practiceArea || "—"}</td>
                <td style={{ color: "#8A8578" }}>{m.advocate || "—"}</td>
                <td><Badge text={m.status} color={MATTER_COLORS[m.status]} /></td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12 }}>{fmtDate(m.filingDate)}</td>
                <RowActions 
                  onEdit={() => onEdit(m)} 
                  onDelete={() => onDelete(m.id)} 
                  onComm={onComm ? () => onComm(m) : undefined}
                  commTitle="Send Matter Update to Client"
                />
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon={Search} title="No matters found" sub="Try adjusting your filter criteria." />}
      </div>
    </div>
  );
}

export function HearingsTable({ items, search, matterTitle, onEdit, onDelete, onPrint, onComm }) {
  const [courtFilter, setCourtFilter] = useState("All");
  const filtered = items
    .filter((h) => {
      const matchSearch = (matterTitle(h.matterId) + (h.court || "") + (h.notes || "")).toLowerCase().includes(search.toLowerCase());
      const matchCourt = courtFilter === "All" || h.court === courtFilter;
      return matchSearch && matchCourt;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (items.length === 0) return <EmptyState icon={Gavel} title="No hearings listed" sub="Log upcoming dates to track proceedings." />;
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
        <span style={{ fontSize: 11.5, color: "#8A8578", fontWeight: 600, marginRight: 4 }}>BENCH:</span>
        {["All", ...COURTS.slice(0, 4)].map((c) => (
          <button
            key={c}
            onClick={() => setCourtFilter(c)}
            style={{
              padding: "4px 9px", fontSize: 11, borderRadius: 4, cursor: "pointer", border: "1px solid #E4DFD3",
              background: courtFilter === c ? "#6B2737" : "#FCFAF6",
              color: courtFilter === c ? "#F7F5F0" : "#6B6255",
              fontWeight: courtFilter === c ? 600 : 400
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div id="printable-area" style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
        <table>
          <thead><tr><th>Listing Date</th><th>Matter Title</th><th>Court / Forum</th><th>Notes / Action Item</th><th>Urgency</th><th></th></tr></thead>
          <tbody>
            {filtered.map((h) => {
              const d = daysUntil(h.date);
              const past = d !== null && d < 0;
              return (
                <tr key={h.id}>
                  <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: past ? "#8A8578" : "#22262B", fontWeight: 600 }}>{fmtDate(h.date)}</td>
                  <td style={{ fontWeight: 600 }}>{matterTitle(h.matterId)}</td>
                  <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
                  <td style={{ color: "#8A8578", fontSize: 12.5 }}>{h.notes || "—"}</td>
                  <td>
                    {d !== null && (
                      <Badge
                        text={past ? `${Math.abs(d)}d ago` : d === 0 ? "TODAY" : d === 1 ? "TOMORROW" : `In ${d}d`}
                        color={past ? "#8A8578" : d <= 2 ? "#6B2737" : d <= 7 ? "#B08D57" : "#3D5A4C"}
                      />
                    )}
                  </td>
                  <RowActions 
                    onEdit={() => onEdit(h)} 
                    onDelete={() => onDelete(h.id)} 
                    onComm={onComm ? () => onComm(h) : undefined}
                    commTitle="Send Hearing Notice / Outcome (WhatsApp & Email)"
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <EmptyState icon={Search} title="No hearings found" sub="Try adjusting your filter search." />}
      </div>
    </div>
  );
}

export function BillingTable({ items, search, matterTitle, onEdit, onDelete, onComm, onPrintInvoice }) {
  const filtered = items.filter((b) => (matterTitle(b.matterId) + (b.description || "")).toLowerCase().includes(search.toLowerCase()));
  if (items.length === 0) return <EmptyState icon={Receipt} title="No invoices found" sub="Record fee bills against matters here." />;
  return (
    <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
      <table>
        <thead><tr><th>Matter</th><th>Description</th><th>Amount</th><th>Invoice Date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {filtered.map((b) => (
            <tr key={b.id}>
              <td style={{ fontWeight: 600 }}>{matterTitle(b.matterId)}</td>
              <td style={{ color: "#8A8578" }}>{b.description}</td>
              <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{fmtCurrency(b.amount, b.currency)}</td>
              <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(b.date)}</td>
              <td><Badge text={b.status} color={BILL_COLORS[b.status]} /></td>
              <RowActions 
                onEdit={() => onEdit(b)} 
                onDelete={() => onDelete(b.id)} 
                onComm={onComm ? () => onComm(b) : undefined}
                onPrint={onPrintInvoice ? () => onPrintInvoice(b) : undefined}
                commTitle="Send Fee Note & Payment Reminder"
                printTitle="Print Official Chambers Fee Note / Invoice"
              />
            </tr>
          ))}
        </tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No invoices found" sub={`No bills matching "${search}"`} />}
    </div>
  );
}