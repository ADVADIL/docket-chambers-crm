import React, { useState, useMemo } from "react";
import { 
  AlertTriangle, Clock, Calendar, CheckCircle2, 
  Briefcase, Plus, Filter, AlertCircle, ShieldAlert, ArrowUpRight
} from "lucide-react";
import { STATUTORY_DEADLINE_TYPES } from "../constants";
import { fmtDate, daysUntil } from "../utils";
import { Btn, inputStyle } from "./UI";

export { STATUTORY_DEADLINE_TYPES };

export default function DeadlinesTracker({
  matters = [],
  onOpenMatter,
  onAddDeadline
}) {
  const [filter, setFilter] = useState("all"); // all, critical, pending, completed
  const [selectedType, setSelectedType] = useState("all");

  const safeMatters = Array.isArray(matters) ? matters : [];

  // Compile deadlines from matters (or fallback sample deadlines if none logged yet)
  const deadlines = useMemo(() => {
    const list = [];
    safeMatters.forEach((m) => {
      if (m && m.deadlineDate) {
        list.push({
          id: `dl_${m.id}`,
          matterId: m.id,
          matterTitle: m.title || "Untitled Matter",
          caseNumber: m.caseNumber || "",
          court: m.court || "",
          type: m.deadlineType || "Court Filing Cutoff",
          dueDate: m.deadlineDate,
          statute: m.deadlineStatute || "Statutory Limitation",
          notes: m.deadlineNotes || "",
          completed: !!m.deadlineCompleted
        });
      }
    });

    // If no custom deadlines logged yet, provide structured practice examples so the board is immediately useful!
    if (list.length === 0 && safeMatters.length > 0) {
      const today = new Date();
      const addDays = (d) => {
        const date = new Date(today);
        date.setDate(date.getDate() + d);
        return date.toISOString().split("T")[0];
      };

      if (matters[0]) {
        list.push({
          id: "dl_sample_1",
          matterId: matters[0].id,
          matterTitle: matters[0].title,
          caseNumber: matters[0].caseNumber || "ARB/2026/89",
          court: matters[0].court || "Commercial Court Bench 3",
          type: "Written Statement / Counter Affidavit",
          dueDate: addDays(2), // 2 days -> CRITICAL
          statute: "Commercial Courts Act - 30-Day Mandatory Limit",
          notes: "Draft rejoinder settled by Senior Counsel. Filing must occur before 4:00 PM.",
          completed: false
        });
      }

      if (matters[1]) {
        list.push({
          id: "dl_sample_2",
          matterId: matters[1].id,
          matterTitle: matters[1].title,
          caseNumber: matters[1].caseNumber || "IP/2026/112",
          court: matters[1].court || "High Court Commercial Division",
          type: "Statutory Limitation for Appeal",
          dueDate: addDays(6), // 6 days -> APPROACHING
          statute: "Civil Procedure Code - Order 41 Rule 1",
          notes: "Obtain certified copy of order. Draft grounds of appeal.",
          completed: false
        });
      }

      if (matters[2]) {
        list.push({
          id: "dl_sample_3",
          matterId: matters[2].id,
          matterTitle: matters[2].title,
          caseNumber: matters[2].caseNumber || "CR/2026/401",
          court: matters[2].court || "District Court",
          type: "Evidence by Affidavit (Trial)",
          dueDate: addDays(18), // 18 days -> ON TRACK
          statute: "Trial Directions Order dated 10 Aug",
          notes: "Prepare examination-in-chief affidavit with supporting exhibits.",
          completed: false
        });
      }
    }

    return list;
  }, [matters]);

  // Compute status metrics
  const enrichedDeadlines = useMemo(() => {
    return deadlines.map((dl) => {
      const days = daysUntil(dl.dueDate);
      let urgency = "on_track";
      if (dl.completed) {
        urgency = "completed";
      } else if (days < 0) {
        urgency = "overdue";
      } else if (days <= 3) {
        urgency = "critical";
      } else if (days <= 7) {
        urgency = "approaching";
      }
      return { ...dl, daysRemaining: days, urgency };
    });
  }, [deadlines]);

  const filtered = useMemo(() => {
    return enrichedDeadlines.filter((dl) => {
      if (filter === "critical" && dl.urgency !== "critical" && dl.urgency !== "overdue") return false;
      if (filter === "pending" && dl.completed) return false;
      if (filter === "completed" && !dl.completed) return false;
      if (selectedType !== "all" && dl.type !== selectedType) return false;
      return true;
    });
  }, [enrichedDeadlines, filter, selectedType]);

  const counts = useMemo(() => {
    let overdue = 0;
    let critical = 0;
    let approaching = 0;
    let total = 0;
    enrichedDeadlines.forEach((dl) => {
      if (!dl.completed) {
        total++;
        if (dl.urgency === "overdue") overdue++;
        else if (dl.urgency === "critical") critical++;
        else if (dl.urgency === "approaching") approaching++;
      }
    });
    return { overdue, critical, approaching, total };
  }, [enrichedDeadlines]);

  return (
    <div>
      {/* Metrics Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#8A8578", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
            Pending Deadlines
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#1C2333", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {counts.total}
          </div>
          <div style={{ fontSize: 11, color: "#6B6255", marginTop: 2 }}>Statutory filing cutoffs</div>
        </div>

        <div style={{ background: "#FFEBEE", border: "1px solid #FFCDD2", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#C62828", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4, display: "flex", alignItems: "center", gap: 5 }}>
            <ShieldAlert size={13} /> Critical (≤ 3 Days)
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#C62828", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {counts.critical}
          </div>
          <div style={{ fontSize: 11, color: "#B71C1C", marginTop: 2 }}>Immediate compliance required</div>
        </div>

        <div style={{ background: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "#F57F17", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4, display: "flex", alignItems: "center", gap: 5 }}>
            <Clock size={13} /> Approaching (≤ 7 Days)
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#F57F17", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {counts.approaching}
          </div>
          <div style={{ fontSize: 11, color: "#E65100", marginTop: 2 }}>Drafting & verification period</div>
        </div>

        <div style={{ background: counts.overdue > 0 ? "#FFEBEE" : "#F4F0E8", border: "1px solid #E4DFD3", borderRadius: 8, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: counts.overdue > 0 ? "#C62828" : "#8A8578", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
            Overdue Cutoffs
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: counts.overdue > 0 ? "#C62828" : "#1C2333", marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
            {counts.overdue}
          </div>
          <div style={{ fontSize: 11, color: "#6B6255", marginTop: 2 }}>Condone delay application needed</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all", label: "All Deadlines" },
            { id: "critical", label: `⚠️ Urgent (${counts.critical + counts.overdue})` },
            { id: "pending", label: "Pending" },
            { id: "completed", label: "Complied / Done" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 500,
                  borderRadius: 5,
                  cursor: "pointer",
                  border: `1px solid ${active ? "#6B2737" : "#D9D2C2"}`,
                  background: active ? "#6B2737" : "#FFFFFF",
                  color: active ? "#F7F5F0" : "#4A453C",
                  transition: "all 0.12s"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ ...inputStyle, width: "auto", fontSize: 12, padding: "5px 10px" }}
          >
            <option value="all">Filter by Statutory Type (All)</option>
            {STATUTORY_DEADLINE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {onAddDeadline && (
            <Btn onClick={onAddDeadline} style={{ background: "#6B2737", color: "#FFF" }}>
              <Plus size={14} /> Log Limitation / Deadline
            </Btn>
          )}
        </div>
      </div>

      {/* Deadlines Table */}
      <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 140 }}>DUE DATE / URGENCY</th>
              <th>STATUTORY DEADLINE TYPE</th>
              <th>CASE DOCKET</th>
              <th>LEGAL BASIS / REASON</th>
              <th style={{ width: 100, textAlign: "right" }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#8A8578" }}>
                  No statutory deadlines matching the selected filter.
                </td>
              </tr>
            ) : (
              filtered.map((dl) => {
                let badgeColor = "#3D5A4C";
                let badgeBg = "#E8F5E9";
                let badgeText = `${dl.daysRemaining} days left`;

                if (dl.completed) {
                  badgeColor = "#6B6255";
                  badgeBg = "#EFEBE1";
                  badgeText = "Complied";
                } else if (dl.urgency === "overdue") {
                  badgeColor = "#C62828";
                  badgeBg = "#FFEBEE";
                  badgeText = `Overdue (${Math.abs(dl.daysRemaining)}d)`;
                } else if (dl.urgency === "critical") {
                  badgeColor = "#C62828";
                  badgeBg = "#FFEBEE";
                  badgeText = dl.daysRemaining === 0 ? "Due Today!" : `Due in ${dl.daysRemaining} day${dl.daysRemaining > 1 ? "s" : ""}`;
                } else if (dl.urgency === "approaching") {
                  badgeColor = "#E65100";
                  badgeBg = "#FFF8E1";
                  badgeText = `Due in ${dl.daysRemaining} days`;
                }

                return (
                  <tr key={dl.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1C2333", fontSize: 13 }}>
                        {fmtDate(dl.dueDate)}
                      </div>
                      <div style={{
                        marginTop: 3,
                        display: "inline-block",
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: 4,
                        color: badgeColor,
                        background: badgeBg
                      }}>
                        {badgeText}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1C2333", fontSize: 13 }}>
                        {dl.type}
                      </div>
                      {dl.statute && (
                        <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                          {dl.statute}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#6B2737", fontSize: 13 }}>
                        {dl.matterTitle}
                      </div>
                      <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>
                        {dl.caseNumber ? `No: ${dl.caseNumber} • ` : ""}{dl.court || "Chambers"}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, color: "#4A453C" }}>
                        {dl.notes || "Filing of pleadings / compliance with court order"}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {onOpenMatter && (
                        <Btn
                          variant="ghost"
                          onClick={() => onOpenMatter(dl.matterId)}
                          style={{ padding: "4px 8px", fontSize: 11 }}
                          title="Open case docket"
                        >
                          View <ArrowUpRight size={12} />
                        </Btn>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
