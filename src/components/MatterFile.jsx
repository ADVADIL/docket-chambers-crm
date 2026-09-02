import React, { useMemo } from "react";
import { ArrowLeft, MessageSquare, Printer, Edit3, Clock, Gavel } from "lucide-react";
import { Badge } from "./UI";
import { MATTER_COLORS } from "../constants";
import { fmtDate, fmtCurrency, daysUntil } from "../utils";

function ChronologyEntry({ date, title, sub, color = "#8A8578", isLast }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "96px 14px 1fr", gap: "0 12px" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#8A8578", paddingTop: 2 }}>{fmtDate(date)}</div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: color, marginTop: 4 }} />
        {!isLast && <div style={{ flex: 1, width: 1, background: "#EFEBE1", marginTop: 2 }} />}
      </div>
      <div style={{ paddingBottom: 22 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "#8A8578", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function MatterFile({
  matter,
  client,
  hearings = [],
  billing = [],
  onBack,
  onEdit,
  onComm,
  onPrint,
  onOpenHearingBrief,
}) {
  if (!matter) return null;

  const matterHearings = useMemo(
    () => hearings.filter((h) => h.matterId === matter.id).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)),
    [hearings, matter.id]
  );
  const matterBills = useMemo(
    () => billing.filter((b) => b.matterId === matter.id).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)),
    [billing, matter.id]
  );

  const upcomingHearing = matterHearings.find((h) => {
    const d = daysUntil(h.date);
    return d !== null && d >= 0;
  });

  const billed = matterBills.reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const realized = matterBills.filter((b) => b.status === "Paid").reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const outstanding = billed - realized;

  // Chronology derived from real events: filing, hearing outcomes, paid fee notes — sorted newest first.
  const chronology = useMemo(() => {
    const events = [];
    if (matter.filingDate) {
      events.push({ date: matter.filingDate, title: "Matter filed", sub: matter.court || undefined, color: "#8A8578" });
    }
    matterHearings.forEach((h) => {
      if (h.outcome && h.outcome !== "Scheduled") {
        events.push({
          date: h.date,
          title: `Hearing outcome recorded — ${h.outcome}`,
          sub: h.orderNotes || h.court || undefined,
          color: "#6B2737",
        });
      }
    });
    matterBills.forEach((b) => {
      if (b.status === "Paid") {
        events.push({
          date: b.date,
          title: `Fee note marked paid`,
          sub: `${fmtCurrency(b.amount, b.currency)} — ${b.description || ""}`,
          color: "#3D5A4C",
        });
      }
    });
    return events.filter((e) => e.date).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [matter, matterHearings, matterBills]);

  const deadlineDays = matter.deadlineDate ? daysUntil(matter.deadlineDate) : null;

  return (
    <div id="matter-file-printable" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "18px 32px 0", background: "#FCFAF6", borderBottom: "1px solid #E4DFD3" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#8A8578", marginBottom: 4 }}>
              <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B2737", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0, fontSize: 11.5 }}>
                <ArrowLeft size={12} /> Matters
              </button>
              <span>/</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{matter.caseNumber || "Unfiled"}</span>
            </div>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, fontWeight: 600, lineHeight: 1.2 }}>{matter.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <Badge text={matter.status} color={MATTER_COLORS[matter.status]} />
              {matter.practiceArea && <Badge text={matter.practiceArea} color="#8C4B5E" />}
              {matter.priority === "High" && <Badge text="High priority" color="#B08D57" />}
              <span style={{ fontSize: 12, color: "#8A8578" }}>{client?.name || "Unassigned client"}{matter.filingDate ? ` · filed ${fmtDate(matter.filingDate)}` : ""}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
            {onComm && <button onClick={() => onComm(matter)} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><MessageSquare size={14} /> Notify client</button>}
            {onPrint && <button onClick={() => onPrint(matter)} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Printer size={14} /> Print case file</button>}
            <button onClick={() => onEdit(matter)} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "#6B2737", color: "#F7F5F0", border: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Edit3 size={14} /> Edit matter</button>
          </div>
        </div>
      </div>

      <div style={{ padding: "22px 32px 32px", flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignContent: "start", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: "18px 20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px 20px" }}>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Case number</div><div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500 }}>{matter.caseNumber || "—"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Forum</div><div style={{ fontSize: 13 }}>{matter.court || "—"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Lead counsel</div><div style={{ fontSize: 13 }}>{matter.advocate || "—"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Client</div><div style={{ fontSize: 13 }}>{client?.name || "—"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Opposing party</div><div style={{ fontSize: 13 }}>{matter.opposingParty || "—"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Filed</div><div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDate(matter.filingDate)}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Priority</div><div style={{ fontSize: 13 }}>{matter.priority || "Normal"}</div></div>
              <div><div style={{ fontSize: 10.5, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5 }}>Practice area</div><div style={{ fontSize: 13 }}>{matter.practiceArea || "—"}</div></div>
            </div>
            {matter.notes && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #EFEBE1", fontSize: 12.5, color: "#6B6255", lineHeight: 1.55 }}>
                {matter.notes}
              </div>
            )}
          </div>

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: "18px 22px" }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, marginBottom: 14 }}>Chronology</div>
            {chronology.length === 0 && <div style={{ fontSize: 12.5, color: "#8A8578" }}>No recorded events yet — outcomes and paid fee notes will appear here.</div>}
            {chronology.map((e, i) => (
              <ChronologyEntry key={i} {...e} isLast={i === chronology.length - 1} />
            ))}
          </div>

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
              <span>Hearings</span><span style={{ color: "#8A8578", fontWeight: 500, fontSize: 12.5 }}>{matterHearings.length} total</span>
            </div>
            {matterHearings.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: "#8A8578" }}>No hearings scheduled for this matter yet.</div>}
            {matterHearings.map((h) => (
              <div key={h.id} onClick={() => onOpenHearingBrief && onOpenHearingBrief(h)} style={{ padding: "11px 18px", borderBottom: "1px solid #EFEBE1", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: onOpenHearingBrief ? "pointer" : "default" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmtDate(h.date)}{h.time ? ` · ${h.time}` : ""}</div>
                  <div style={{ fontSize: 12, color: "#8A8578" }}>{h.court || "Court TBD"}{h.outcome && h.outcome !== "Scheduled" ? ` · ${h.outcome}` : ""}</div>
                </div>
                <Gavel size={14} color="#8A8578" />
              </div>
            ))}
          </div>

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
              <span>Fee notes</span><span style={{ color: "#8A8578", fontWeight: 500, fontSize: 12.5 }}>{matterBills.length} total</span>
            </div>
            {matterBills.length === 0 && <div style={{ padding: 18, fontSize: 12.5, color: "#8A8578" }}>No fee notes issued against this matter yet.</div>}
            {matterBills.map((b) => (
              <div key={b.id} style={{ padding: "11px 18px", borderBottom: "1px solid #EFEBE1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{b.description || "Fee note"}</div>
                  <div style={{ fontSize: 12, color: "#8A8578" }}>{fmtDate(b.date)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 13 }}>{fmtCurrency(b.amount, b.currency)}</span>
                  <Badge text={b.status || "Draft"} color={b.status === "Paid" ? "#3D5A4C" : b.status === "Overdue" ? "#6B2737" : "#8A8578"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Next listing</div>
            <div style={{ padding: "14px 16px" }}>
              {upcomingHearing ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 600 }}>{fmtDate(upcomingHearing.date)}{upcomingHearing.time ? ` · ${upcomingHearing.time}` : ""}</div>
                    <Badge text={`In ${daysUntil(upcomingHearing.date)}d`} color="#6B2737" />
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6B6255", marginTop: 6, lineHeight: 1.5 }}>{upcomingHearing.notes || upcomingHearing.court}</div>
                  {onOpenHearingBrief && (
                    <button onClick={() => onOpenHearingBrief(upcomingHearing)} style={{ marginTop: 12, width: "100%", padding: 8, borderRadius: 5, background: "rgba(107,39,55,0.08)", border: "1px solid #6B273744", color: "#6B2737", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Open hearing brief
                    </button>
                  )}
                </>
              ) : (
                <div style={{ fontSize: 12.5, color: "#8A8578" }}>No upcoming hearing scheduled.</div>
              )}
            </div>
          </div>

          {matter.deadlineDate && (
            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600, color: "#6B2737", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={15} /> Statutory clock
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span>{matter.deadlineType || "Statutory deadline"}</span>
                  <span style={{ color: deadlineDays <= 7 ? "#6B2737" : "#8A6D3B", fontWeight: 600 }}>{deadlineDays < 0 ? `${Math.abs(deadlineDays)}d overdue` : `${deadlineDays} days`}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "#EFEBE1", overflow: "hidden", marginTop: 6 }}>
                  <div style={{ width: `${Math.max(4, Math.min(100, 100 - (deadlineDays / 30) * 100))}%`, height: "100%", background: deadlineDays <= 7 ? "#6B2737" : "#B08D57" }} />
                </div>
                <div style={{ fontSize: 11, color: "#8A8578", marginTop: 6 }}>Due {fmtDate(matter.deadlineDate)}{matter.deadlineStatute ? ` · ${matter.deadlineStatute}` : ""}</div>
                {matter.deadlineNotes && <div style={{ fontSize: 11.5, color: "#6B6255", marginTop: 6, lineHeight: 1.4 }}>{matter.deadlineNotes}</div>}
              </div>
            </div>
          )}

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Fee position</div>
            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "#8A8578" }}>Billed to date</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{fmtCurrency(billed)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "#8A8578" }}>Realized</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: "#3D5A4C" }}>{fmtCurrency(realized)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}><span style={{ color: "#8A8578" }}>Outstanding</span><span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, color: "#6B2737" }}>{fmtCurrency(outstanding)}</span></div>
            </div>
          </div>

          {matter.advocate && (
            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Assigned counsel</div>
              <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#6B2737", color: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600 }}>
                  {matter.advocate.split(" ").filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase()}
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{matter.advocate}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
