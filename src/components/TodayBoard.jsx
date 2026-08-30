import React, { useMemo } from "react";
import { Gavel, CheckSquare, Square, AlertCircle, Clock, CalendarClock, ChevronRight } from "lucide-react";
import { fmtDate, daysUntil, todayISO } from "../lib/dataHooks.js";
import { Badge, EmptyState } from "./ui.jsx";

const PRIORITY_COLORS = { Low: "#8A8578", Normal: "#B08D57", High: "#8A6D3B", Critical: "#6B2737" };

function Section({ title, icon: Icon, accent, count, children, hint }) {
  return (
    <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, marginBottom: 20 }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={17} style={{ color: accent }} />
        <span style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: "#22262B" }}>{title}</span>
        {typeof count === "number" && count > 0 && (
          <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: accent, background: `${accent}18`, border: `1px solid ${accent}44`, padding: "1px 7px", borderRadius: 10 }}>{count}</span>
        )}
        {hint && <span style={{ marginLeft: "auto", fontSize: 11.5, color: "#8A8578" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function TodayBoard({ matters, hearings, tasks, clientName, onOpenMatter, onEditHearing, onToggleTask }) {
  const matterById = useMemo(() => {
    const map = {};
    matters.forEach((m) => { map[m.id] = m; });
    return map;
  }, [matters]);

  const titleOf = (id) => matterById[id]?.title || "—";

  const todayHearings = useMemo(() => hearings
    .filter((h) => h.hearing_date === todayISO())
    .sort((a, b) => (a.court || "").localeCompare(b.court || "")), [hearings]);

  const weekHearings = useMemo(() => hearings
    .filter((h) => {
      const d = daysUntil(h.hearing_date);
      return d !== null && d > 0 && d <= 7;
    })
    .sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date)), [hearings]);

  const awaitingOutcome = useMemo(() => hearings
    .filter((h) => {
      const d = daysUntil(h.hearing_date);
      return d !== null && d < 0 && (h.outcome || "Scheduled") === "Scheduled";
    })
    .sort((a, b) => new Date(b.hearing_date) - new Date(a.hearing_date)), [hearings]);

  const openTasks = useMemo(() => tasks
    .filter((t) => t.status !== "Completed" && t.status !== "Cancelled")
    .sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    }), [tasks]);

  const dueTasks = useMemo(() => openTasks.filter((t) => {
    const d = daysUntil(t.due_date);
    return d !== null && d <= 7;
  }), [openTasks]);

  const limitationRisk = useMemo(() => matters
    .filter((m) => {
      if (m.status === "Closed" || !m.limitation_date) return false;
      const d = daysUntil(m.limitation_date);
      return d !== null && d <= 60;
    })
    .sort((a, b) => new Date(a.limitation_date) - new Date(b.limitation_date)), [matters]);

  const nextActions = useMemo(() => matters
    .filter((m) => {
      if (m.status === "Closed" || !m.next_action_due) return false;
      const d = daysUntil(m.next_action_due);
      return d !== null && d <= 14;
    })
    .sort((a, b) => new Date(a.next_action_due) - new Date(b.next_action_due)), [matters]);

  const nothingAtAll =
    todayHearings.length === 0 && weekHearings.length === 0 && awaitingOutcome.length === 0 &&
    dueTasks.length === 0 && limitationRisk.length === 0 && nextActions.length === 0;

  if (nothingAtAll) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="Nothing needs you today"
        sub="No hearings, tasks, limitation dates or next actions are due in the period ahead."
      />
    );
  }

  const dayLabel = (date) => {
    const d = daysUntil(date);
    if (d === null) return null;
    if (d < 0) return { text: `${Math.abs(d)}d ago`, color: "#6B2737" };
    if (d === 0) return { text: "Today", color: "#6B2737" };
    if (d === 1) return { text: "Tomorrow", color: "#B08D57" };
    return { text: `In ${d}d`, color: d <= 7 ? "#B08D57" : "#3D5A4C" };
  };

  return (
    <div>
      {todayHearings.length > 0 && (
        <Section title="In court today" icon={Gavel} accent="#6B2737" count={todayHearings.length}>
          <table><tbody>
            {todayHearings.map((h) => (
              <tr key={h.id} style={{ cursor: "pointer" }} onClick={() => onOpenMatter(h.matter_id)}>
                <td style={{ fontWeight: 600 }}>{titleOf(h.matter_id)}</td>
                <td style={{ color: "#8A8578" }}>{h.court || "Court TBD"}</td>
                <td style={{ color: "#8A8578", fontSize: 12.5 }}>{h.notes ? h.notes.slice(0, 60) + (h.notes.length > 60 ? "…" : "") : "No prep notes"}</td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={(e) => { e.stopPropagation(); onEditHearing(h); }} style={{ background: "none", border: "1px solid #D9D2C2", borderRadius: 5, cursor: "pointer", color: "#6B2737", fontSize: 12, fontWeight: 600, padding: "5px 10px" }}>
                    Record outcome
                  </button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </Section>
      )}

      {awaitingOutcome.length > 0 && (
        <Section
          title="Awaiting outcome"
          icon={AlertCircle}
          accent="#6B2737"
          count={awaitingOutcome.length}
          hint="Record what happened, then set the follow-up action"
        >
          <table><tbody>
            {awaitingOutcome.map((h) => {
              const lbl = dayLabel(h.hearing_date);
              return (
                <tr key={h.id} style={{ cursor: "pointer", background: "#6B273708" }} onClick={() => onEditHearing(h)}>
                  <td style={{ width: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: "#8A8578" }}>{fmtDate(h.hearing_date)}</td>
                  <td style={{ fontWeight: 600 }}>{titleOf(h.matter_id)}</td>
                  <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
                  <td style={{ textAlign: "right" }}>{lbl && <Badge text={lbl.text} color={lbl.color} />}</td>
                </tr>
              );
            })}
          </tbody></table>
        </Section>
      )}

      {limitationRisk.length > 0 && (
        <Section
          title="Limitation approaching"
          icon={Clock}
          accent="#6B2737"
          count={limitationRisk.length}
          hint="Within 60 days"
        >
          <table><tbody>
            {limitationRisk.map((m) => {
              const d = daysUntil(m.limitation_date);
              const color = d < 0 ? "#6B2737" : d <= 14 ? "#6B2737" : d <= 30 ? "#B08D57" : "#8A6D3B";
              return (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => onOpenMatter(m.id)}>
                  <td style={{ width: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(m.limitation_date)}</td>
                  <td style={{ fontWeight: 600 }}>{m.title}</td>
                  <td style={{ color: "#8A8578" }}>{clientName(m.client_id)}</td>
                  <td style={{ textAlign: "right" }}>
                    <Badge text={d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? "Expires today" : `${d}d left`} color={color} />
                  </td>
                </tr>
              );
            })}
          </tbody></table>
        </Section>
      )}

      {nextActions.length > 0 && (
        <Section title="Next actions due" icon={ChevronRight} accent="#B08D57" count={nextActions.length} hint="Within 14 days">
          <table><tbody>
            {nextActions.map((m) => {
              const lbl = dayLabel(m.next_action_due);
              return (
                <tr key={m.id} style={{ cursor: "pointer" }} onClick={() => onOpenMatter(m.id)}>
                  <td style={{ width: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(m.next_action_due)}</td>
                  <td style={{ fontWeight: 600 }}>{m.title}</td>
                  <td style={{ color: "#8A8578" }}>{m.next_action}</td>
                  <td style={{ textAlign: "right" }}>{lbl && <Badge text={lbl.text} color={lbl.color} />}</td>
                </tr>
              );
            })}
          </tbody></table>
        </Section>
      )}

      {dueTasks.length > 0 && (
        <Section title="Tasks due" icon={CheckSquare} accent="#3D5A4C" count={dueTasks.length} hint="Within 7 days">
          <table><tbody>
            {dueTasks.map((t) => {
              const lbl = dayLabel(t.due_date);
              return (
                <tr key={t.id}>
                  <td style={{ width: 34 }}>
                    <button onClick={() => onToggleTask(t)} title="Mark complete" style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 2 }}>
                      <Square size={16} />
                    </button>
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.title}</td>
                  <td style={{ color: "#8A8578", cursor: "pointer" }} onClick={() => onOpenMatter(t.matter_id)}>{titleOf(t.matter_id)}</td>
                  <td>{t.priority && t.priority !== "Normal" && <Badge text={t.priority} color={PRIORITY_COLORS[t.priority]} />}</td>
                  <td style={{ textAlign: "right" }}>{lbl && <Badge text={lbl.text} color={lbl.color} />}</td>
                </tr>
              );
            })}
          </tbody></table>
        </Section>
      )}

      {weekHearings.length > 0 && (
        <Section title="Hearings this week" icon={CalendarClock} accent="#3D5A4C" count={weekHearings.length}>
          <table><tbody>
            {weekHearings.map((h) => {
              const lbl = dayLabel(h.hearing_date);
              return (
                <tr key={h.id} style={{ cursor: "pointer" }} onClick={() => onOpenMatter(h.matter_id)}>
                  <td style={{ width: 110, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(h.hearing_date)}</td>
                  <td style={{ fontWeight: 600 }}>{titleOf(h.matter_id)}</td>
                  <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
                  <td style={{ textAlign: "right" }}>{lbl && <Badge text={lbl.text} color={lbl.color} />}</td>
                </tr>
              );
            })}
          </tbody></table>
        </Section>
      )}
    </div>
  );
}
