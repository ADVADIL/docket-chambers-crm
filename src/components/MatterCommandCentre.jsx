import React, { useState, useMemo } from "react";
import {
  X, Briefcase, Gavel, Receipt, StickyNote, Clock, Plus, Edit3, Trash2, Square, CheckSquare,
  Pin, FileText, ChevronRight,
} from "lucide-react";
import { fmtDate, fmtCurrency, deadlineBadge } from "../lib/dataHooks.js";
import { Badge, Btn, EmptyState, inputStyle } from "./ui.jsx";

const MATTER_COLORS = {
  Intake: "#B08D57", Active: "#6B2737", "Pending Hearing": "#8A6D3B",
  Settlement: "#3D5A4C", Closed: "#8A8578",
};
const PRIORITY_COLORS = { Low: "#8A8578", Normal: "#B08D57", High: "#8A6D3B", Critical: "#6B2737" };
const HEARING_OUTCOME_COLORS = {
  Scheduled: "#B08D57", Held: "#3D5A4C", Adjourned: "#8A6D3B",
  "Order Reserved": "#6B2737", Disposed: "#8A8578",
};
const NOTE_TYPES = ["General", "Attendance", "Strategy", "Client Instruction", "Court", "Order", "Research", "Internal"];

// ---------- Header ----------
function CentreHeader({ matter, client, onClose, onEditMatter }) {
  const limBadge = deadlineBadge(matter.limitation_date);
  const nextBadge = deadlineBadge(matter.next_action_due);

  return (
    <div style={{ padding: "20px 24px", borderBottom: "1px solid #E4DFD3", background: "#FCFAF6" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 21, fontWeight: 600, color: "#22262B" }}>{matter.title}</div>
            <Badge text={matter.status} color={MATTER_COLORS[matter.status]} />
            {matter.priority && matter.priority !== "Normal" && <Badge text={matter.priority} color={PRIORITY_COLORS[matter.priority]} />}
          </div>
          <div style={{ fontSize: 13, color: "#8A8578", marginTop: 4 }}>
            {client?.name || "Unassigned client"}
            {matter.opposing_party && <> · v. {matter.opposing_party}</>}
            {matter.case_number && <> · {matter.case_number}</>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Btn variant="ghost" onClick={onEditMatter}><Edit3 size={14} /> Edit</Btn>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 6 }}><X size={20} /></button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 16, fontSize: 12.5 }}>
        {matter.jurisdiction && <div><span style={{ color: "#8A8578" }}>Jurisdiction </span><strong>{matter.jurisdiction}</strong></div>}
        {matter.court_complex && <div><span style={{ color: "#8A8578" }}>Court </span><strong>{matter.court_complex}</strong></div>}
        {matter.opposing_counsel && <div><span style={{ color: "#8A8578" }}>Opposing counsel </span><strong>{matter.opposing_counsel}</strong></div>}
        {matter.filing_date && <div><span style={{ color: "#8A8578" }}>Filed </span><strong>{fmtDate(matter.filing_date)}</strong></div>}
        {matter.registration_date && <div><span style={{ color: "#8A8578" }}>Registered </span><strong>{fmtDate(matter.registration_date)}</strong></div>}
      </div>

      {(limBadge || nextBadge) && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
          {limBadge && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={14} style={{ color: "#6B2737" }} />
              <span style={{ fontSize: 12.5, color: "#8A8578" }}>Limitation {fmtDate(matter.limitation_date)}</span>
              <Badge text={limBadge.text} color={limBadge.color} />
            </div>
          )}
          {nextBadge && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ChevronRight size={14} style={{ color: "#B08D57" }} />
              <span style={{ fontSize: 12.5, color: "#8A8578" }}>{matter.next_action || "Next action"}</span>
              <Badge text={nextBadge.text} color={nextBadge.color} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Timeline ----------
function describeAudit(entry) {
  const d = entry.new_data || {};
  const old = entry.old_data || {};
  if (entry.table_name === "matters") {
    if (entry.action === "INSERT") return "Matter opened";
    if (entry.action === "DELETE") return "Matter record deleted";
    if (old.status && d.status && old.status !== d.status) return `Status changed: ${old.status} → ${d.status}`;
    return "Matter details updated";
  }
  if (entry.table_name === "hearings") {
    if (entry.action === "INSERT") return `Hearing scheduled${d.hearing_date ? ` for ${fmtDate(d.hearing_date)}` : ""}`;
    if (entry.action === "DELETE") return "Hearing removed";
    if (old.outcome && d.outcome && old.outcome !== d.outcome) return `Hearing outcome recorded: ${d.outcome}`;
    return "Hearing updated";
  }
  if (entry.table_name === "billing") {
    if (entry.action === "INSERT") return `Invoice created${d.amount ? ` — ${fmtCurrency(d.amount, d.currency)}` : ""}`;
    if (entry.action === "DELETE") return "Invoice deleted";
    if (old.status && d.status && old.status !== d.status) return `Invoice status: ${old.status} → ${d.status}`;
    return "Invoice updated";
  }
  return `${entry.table_name} ${entry.action.toLowerCase()}`;
}

function Timeline({ notes, auditLog, onAddNote, onDeleteNote }) {
  const [composing, setComposing] = useState(false);
  const [noteType, setNoteType] = useState("General");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const items = useMemo(() => {
    const noteItems = notes.map((n) => ({ id: `note-${n.id}`, raw: n, date: n.created_at, kind: "note" }));
    const auditItems = auditLog.map((a) => ({ id: `audit-${a.id}`, raw: a, date: a.changed_at, kind: "audit" }));
    return [...noteItems, ...auditItems].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [notes, auditLog]);

  const pinnedNotes = notes.filter((n) => n.pinned).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const submitNote = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onAddNote({ note_type: noteType, body: body.trim(), pinned });
      setBody(""); setPinned(false); setNoteType("General"); setComposing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {!composing ? (
        <Btn variant="ghost" onClick={() => setComposing(true)} style={{ marginBottom: 16 }}><Plus size={14} /> Add note</Btn>
      ) : (
        <div style={{ background: "#F7F5F0", border: "1px solid #E4DFD3", borderRadius: 8, padding: 14, marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select style={{ ...inputStyle, marginBottom: 0, width: 180 }} value={noteType} onChange={(e) => setNoteType(e.target.value)}>
              {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#6B6255" }}>
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin
            </label>
          </div>
          <textarea autoFocus style={{ ...inputStyle, minHeight: 70, marginBottom: 10 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What happened, what was decided, what to remember..." />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={() => setComposing(false)}>Cancel</Btn>
            <Btn onClick={submitNote} disabled={saving || !body.trim()}>{saving ? "Saving…" : "Save note"}</Btn>
          </div>
        </div>
      )}

      {pinnedNotes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {pinnedNotes.map((n) => (
            <div key={n.id} style={{ display: "flex", gap: 10, background: "#B08D5712", border: "1px solid #B08D5744", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
              <Pin size={14} style={{ color: "#8A6D3B", flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8A6D3B", textTransform: "uppercase", letterSpacing: 0.3 }}>{n.note_type}</div>
                <div style={{ fontSize: 13, color: "#22262B", marginTop: 2, whiteSpace: "pre-wrap" }}>{n.body}</div>
              </div>
              <button onClick={() => onDeleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 2, alignSelf: "flex-start" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={StickyNote} title="No history yet" sub="Notes and changes to this matter will appear here." />
      ) : (
        <div style={{ borderLeft: "2px solid #E4DFD3", marginLeft: 6 }}>
          {items.map((item) => (
            <div key={item.id} style={{ position: "relative", paddingLeft: 20, paddingBottom: 18 }}>
              <div style={{
                position: "absolute", left: -6, top: 3, width: 10, height: 10, borderRadius: "50%",
                background: item.kind === "note" ? "#6B2737" : "#8A93B0", border: "2px solid #FCFAF6",
              }} />
              <div style={{ fontSize: 11.5, color: "#8A8578", fontFamily: "'IBM Plex Mono', monospace" }}>{fmtDate(item.date?.slice(0, 10))}</div>
              {item.kind === "note" ? (
                <div style={{ marginTop: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B2737", textTransform: "uppercase", letterSpacing: 0.3 }}>{item.raw.note_type}</span>
                  <div style={{ fontSize: 13.5, color: "#22262B", marginTop: 2, whiteSpace: "pre-wrap" }}>{item.raw.body}</div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#4A4438", marginTop: 3 }}>{describeAudit(item.raw)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Hearings tab ----------
function HearingsTab({ hearings, onAddHearing, onEditHearing }) {
  const sorted = [...hearings].sort((a, b) => new Date(b.hearing_date) - new Date(a.hearing_date));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Btn onClick={onAddHearing}><Plus size={14} /> Add hearing</Btn>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={Gavel} title="No hearings logged" sub="Schedule the first hearing for this matter." />
      ) : (
        <table><tbody>
          {sorted.map((h) => (
            <tr key={h.id} style={{ cursor: "pointer" }} onClick={() => onEditHearing(h)}>
              <td style={{ width: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(h.hearing_date)}</td>
              <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
              <td><Badge text={h.outcome || "Scheduled"} color={HEARING_OUTCOME_COLORS[h.outcome || "Scheduled"]} /></td>
              <td style={{ color: "#8A8578", fontSize: 12.5 }}>{h.order_notes ? h.order_notes.slice(0, 70) + (h.order_notes.length > 70 ? "…" : "") : "—"}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}

// ---------- Tasks tab ----------
function TasksTab({ tasks, onAddTask, onEditTask, onToggleTask, onDeleteTask }) {
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === "Completed" && b.status !== "Completed") return 1;
    if (b.status === "Completed" && a.status !== "Completed") return -1;
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <Btn onClick={() => onAddTask({})}><Plus size={14} /> Add task</Btn>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" sub="Break this matter's next steps into action items." />
      ) : (
        <table><tbody>
          {sorted.map((t) => {
            const done = t.status === "Completed";
            const badge = t.due_date ? deadlineBadge(t.due_date) : null;
            return (
              <tr key={t.id} style={{ opacity: done ? 0.55 : 1 }}>
                <td style={{ width: 30 }}>
                  <button onClick={() => onToggleTask(t)} style={{ background: "none", border: "none", cursor: "pointer", color: done ? "#3D5A4C" : "#8A8578", padding: 2 }}>
                    {done ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </td>
                <td style={{ fontWeight: 600, textDecoration: done ? "line-through" : "none", cursor: "pointer" }} onClick={() => onEditTask(t)}>{t.title}</td>
                <td>{t.priority && t.priority !== "Normal" && <Badge text={t.priority} color={PRIORITY_COLORS[t.priority]} />}</td>
                <td>{badge && !done && <Badge text={badge.text} color={badge.color} />}</td>
                <td style={{ width: 30, textAlign: "right" }}>
                  <button onClick={() => onDeleteTask(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 2 }}><Trash2 size={13} /></button>
                </td>
              </tr>
            );
          })}
        </tbody></table>
      )}
    </div>
  );
}

// ---------- Billing tab (read-only summary; edit happens from the main Billing tab) ----------
function BillingTab({ billing }) {
  if (billing.length === 0) return <EmptyState icon={Receipt} title="No invoices for this matter" sub="Log billing against this matter from the Billing tab." />;
  const sorted = [...billing].sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
  return (
    <table><tbody>
      {sorted.map((b) => (
        <tr key={b.id}>
          <td style={{ color: "#8A8578" }}>{b.description || "—"}</td>
          <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(b.amount, b.currency)}</td>
          <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(b.invoice_date)}</td>
          <td><Badge text={b.status} color={{ Draft: "#8A8578", Sent: "#B08D57", Paid: "#3D5A4C", Overdue: "#6B2737" }[b.status]} /></td>
        </tr>
      ))}
    </tbody></table>
  );
}

// ---------- Main ----------
export default function MatterCommandCentre({
  matter, client, hearings, billing, tasks, notes, auditLog,
  onClose, onEditMatter, onAddHearing, onEditHearing,
  onAddTask, onEditTask, onToggleTask, onDeleteTask, onAddNote, onDeleteNote,
}) {
  const [section, setSection] = useState("timeline");

  if (!matter) return null;

  const tabs = [
    { key: "timeline", label: "Timeline", icon: FileText },
    { key: "hearings", label: "Hearings", icon: Gavel, count: hearings.length },
    { key: "tasks", label: "Tasks", icon: CheckSquare, count: tasks.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length },
    { key: "billing", label: "Billing", icon: Receipt, count: billing.length },
  ];

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(28,35,51,0.5)", display: "flex",
      alignItems: "center", justifyContent: "center", zIndex: 150, padding: "4vh 16px",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#FFFFFF", borderRadius: 10, width: "100%", maxWidth: 780, maxHeight: "92vh",
        display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(28,35,51,0.35)",
        border: "1px solid #E4DFD3", overflow: "hidden",
      }}>
        <CentreHeader matter={matter} client={client} onClose={onClose} onEditMatter={onEditMatter} />

        <div style={{ display: "flex", borderBottom: "1px solid #E4DFD3", background: "#FCFAF6", padding: "0 24px" }}>
          {tabs.map((t) => {
            const active = section === t.key;
            return (
              <div key={t.key} onClick={() => setSection(t.key)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", cursor: "pointer",
                borderBottom: active ? "2px solid #6B2737" : "2px solid transparent",
                color: active ? "#6B2737" : "#8A8578", fontWeight: active ? 600 : 500, fontSize: 13.5,
              }}>
                <t.icon size={14} />
                {t.label}
                {typeof t.count === "number" && t.count > 0 && (
                  <span style={{ fontSize: 10.5, fontFamily: "'IBM Plex Mono', monospace", color: active ? "#6B2737" : "#8A93B0", background: active ? "#6B273718" : "#8A93B015", padding: "1px 6px", borderRadius: 8 }}>{t.count}</span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1 }}>
          {section === "timeline" && <Timeline notes={notes} auditLog={auditLog} onAddNote={onAddNote} onDeleteNote={onDeleteNote} />}
          {section === "hearings" && <HearingsTab hearings={hearings} onAddHearing={onAddHearing} onEditHearing={onEditHearing} />}
          {section === "tasks" && <TasksTab tasks={tasks} onAddTask={onAddTask} onEditTask={onEditTask} onToggleTask={onToggleTask} onDeleteTask={onDeleteTask} />}
          {section === "billing" && <BillingTab billing={billing} />}
        </div>
      </div>
    </div>
  );
}
