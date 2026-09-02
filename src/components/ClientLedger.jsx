import React, { useMemo } from "react";
import { ArrowLeft, MessageSquare, Printer, Plus } from "lucide-react";
import { Badge } from "./UI";
import { fmtDate, fmtCurrency, daysOverdue, agingBuckets } from "../utils";

export default function ClientLedger({
  client,
  matters = [],
  billing = [],
  onBack,
  onSendReminder,
  onPrint,
  onNewFeeNote,
}) {
  if (!client) return null;

  const clientMatters = useMemo(() => matters.filter((m) => m.clientId === client.id), [matters, client.id]);
  const matterIds = useMemo(() => new Set(clientMatters.map((m) => m.id)), [clientMatters]);
  const matterTitle = (id) => clientMatters.find((m) => m.id === id)?.title || "General";

  const clientBills = useMemo(
    () => billing.filter((b) => matterIds.has(b.matterId)).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [billing, matterIds]
  );

  const billed = clientBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const realized = clientBills.filter((b) => b.status === "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const outstanding = clientBills.filter((b) => b.status === "Sent" || b.status === "Overdue").reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const draftTotal = clientBills.filter((b) => b.status === "Draft").reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const realizationRate = billed > 0 ? Math.round((realized / billed) * 100) : 0;

  const unpaidBills = clientBills.filter((b) => b.status === "Sent" || b.status === "Overdue");
  const aging = agingBuckets(unpaidBills);
  const agingMax = Math.max(aging.current, aging.d31, aging.d61, aging.d90, 1);

  const receipts = clientBills.filter((b) => b.status === "Paid").slice(0, 6);

  const mostOverdue = unpaidBills.reduce((worst, b) => {
    const age = daysOverdue(b.date);
    return age > (worst ? daysOverdue(worst.date) : -Infinity) ? b : worst;
  }, null);
  const earliestFiled = clientMatters.reduce((min, m) => {
    if (!m.filingDate) return min;
    return !min || m.filingDate < min ? m.filingDate : min;
  }, null);

  return (
    <div id="client-ledger-printable" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 32px 0", background: "#FCFAF6", borderBottom: "1px solid #E4DFD3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8A8578", marginBottom: 4 }}>
              <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B2737", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0, fontSize: 11.5 }}>
                <ArrowLeft size={12} /> Billing
              </button>
              <span>/</span><span>Statement of account</span>
            </div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 22, fontWeight: 600 }}>{client.name}</div>
            <div style={{ fontSize: 12.5, color: "#8A8578", marginTop: 3 }}>
              {client.company ? `${client.company} · ` : ""}{clientMatters.length} matter{clientMatters.length === 1 ? "" : "s"}{earliestFiled ? ` · client since ${fmtDate(earliestFiled)}` : ""}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            {onSendReminder && <button onClick={() => onSendReminder(client)} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><MessageSquare size={14} /> Send reminder</button>}
            {onPrint && <button onClick={() => onPrint(client)} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Printer size={14} /> Print statement</button>}
            {onNewFeeNote && <button onClick={() => onNewFeeNote(client, clientMatters[0])} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "#6B2737", color: "#F7F5F0", border: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Plus size={14} /> New fee note</button>}
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 32px 32px", flex: 1, display: "flex", flexDirection: "column", gap: 18, overflowY: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          <div style={{ background: "#FCFAF6", padding: "16px 18px", borderRadius: 8, border: "1px solid #E4DFD3" }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Billed to date</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600 }}>{fmtCurrency(billed)}</div>
            <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>Across {clientBills.length} fee note{clientBills.length === 1 ? "" : "s"}</div>
          </div>
          <div style={{ background: "#FCFAF6", padding: "16px 18px", borderRadius: 8, border: "1px solid #E4DFD3" }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Realized</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600, color: "#3D5A4C" }}>{fmtCurrency(realized)}</div>
            <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>{realizationRate}% realization rate</div>
          </div>
          <div style={{ background: "#FCFAF6", padding: "16px 18px", borderRadius: 8, border: "1px solid #E4DFD3" }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Outstanding</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600, color: "#6B2737" }}>{fmtCurrency(outstanding)}</div>
            {mostOverdue && <div style={{ fontSize: 11, color: "#6B2737", marginTop: 4, fontWeight: 600 }}>{daysOverdue(mostOverdue.date)}d on oldest note</div>}
          </div>
          <div style={{ background: "#FCFAF6", padding: "16px 18px", borderRadius: 8, border: "1px solid #E4DFD3" }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Draft notes</div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600, color: "#8A6D3B" }}>{fmtCurrency(draftTotal)}</div>
            <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>Not yet issued</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, flex: 1, minHeight: 0 }}>
          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Fee notes</span>
              <span style={{ fontSize: 12, color: "#8A8578" }}>Newest first</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 92px", padding: "10px 18px", borderBottom: "1px solid #E4DFD3", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, color: "#8A8578", fontWeight: 600 }}>
              <div>Narrative</div><div>Matter</div><div style={{ textAlign: "right" }}>Amount</div><div style={{ textAlign: "right" }}>Status</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {clientBills.map((b) => (
                <div key={b.id} style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 92px", padding: "12px 18px", borderBottom: "1px solid #EFEBE1", fontSize: 13, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{b.description || "Fee note"}</div>
                    <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>{b.status === "Draft" ? "Draft · not yet issued" : `Issued ${fmtDate(b.date)}`}</div>
                  </div>
                  <div style={{ color: "#8A8578", fontSize: 12.5 }}>{matterTitle(b.matterId)}</div>
                  <div style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace" }}>{Number(b.amount || 0).toLocaleString()}</div>
                  <div style={{ textAlign: "right" }}><Badge text={b.status || "Draft"} color={b.status === "Paid" ? "#3D5A4C" : b.status === "Overdue" ? "#6B2737" : b.status === "Sent" ? "#B08D57" : "#8A8578"} /></div>
                </div>
              ))}
              {clientBills.length === 0 && <div style={{ padding: 24, fontSize: 12.5, color: "#8A8578", textAlign: "center" }}>No fee notes recorded for this client yet.</div>}
            </div>
            <div style={{ padding: "13px 18px", borderTop: "1px solid #E4DFD3", background: "#FBF9F4", display: "flex", justifyContent: "flex-end", gap: 34, fontSize: 13 }}>
              <div style={{ color: "#8A8578" }}>Outstanding balance</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: "#6B2737" }}>{fmtCurrency(outstanding)}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Aging</div>
              <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {[["Current", aging.current, "#3D5A4C"], ["31–60 days", aging.d31, "#B08D57"], ["61–90 days", aging.d61, "#6B2737"], ["Over 90 days", aging.d90, "#8C4B5E"]].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: "#6B6255" }}>{label}</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{val.toLocaleString()}</span></div>
                    <div style={{ height: 6, borderRadius: 3, background: "#EFEBE1", overflow: "hidden", marginTop: 4 }}>
                      <div style={{ width: `${(val / agingMax) * 100}%`, height: "100%", background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Receipts</div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {receipts.map((b) => (
                  <div key={b.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Payment received</div>
                      <div style={{ fontSize: 11, color: "#8A8578" }}>{fmtDate(b.date)} · {b.description}</div>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: "#3D5A4C" }}>{Number(b.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
                {receipts.length === 0 && <div style={{ fontSize: 12, color: "#8A8578" }}>No payments recorded yet.</div>}
              </div>
            </div>

            {mostOverdue && (
              <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderLeft: "3px solid #B08D57", borderRadius: 8, padding: "13px 16px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A6D3B", marginBottom: 5 }}>Reminder cadence</div>
                <div style={{ fontSize: 12, color: "#6B6255", lineHeight: 1.5 }}>
                  {mostOverdue.description || "A fee note"} is {daysOverdue(mostOverdue.date)} days past due ({fmtCurrency(mostOverdue.amount, mostOverdue.currency)}).
                </div>
                {onSendReminder && (
                  <button onClick={() => onSendReminder(client, mostOverdue)} style={{ marginTop: 10, width: "100%", padding: 8, borderRadius: 5, background: "rgba(176,141,87,0.14)", border: "1px solid #B08D5744", color: "#8A6D3B", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Draft reminder
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
