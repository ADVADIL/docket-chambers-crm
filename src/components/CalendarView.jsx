import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, Send, Printer } from "lucide-react";
import { fmtDate, daysUntil } from "../utils";
import { EmptyState } from "./UI";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];

function DaySheet({ date, hearings, matters, matterTitle, onOpenHearingBrief, onBroadcastCauseList, onPrintCauseList, onBack }) {
  const dayHearings = useMemo(
    () => hearings.filter((h) => h.date === date).sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99")),
    [hearings, date]
  );

  const timeGroups = useMemo(() => {
    const g = {};
    dayHearings.forEach((h) => {
      const t = h.time || "unscheduled";
      g[t] = g[t] || [];
      g[t].push(h);
    });
    return g;
  }, [dayHearings]);
  const conflicts = Object.entries(timeGroups).filter(([t, list]) => t !== "unscheduled" && list.length > 1);

  const courtComplexes = new Set(dayHearings.map((h) => h.court).filter(Boolean));

  const dueTomorrow = useMemo(() => {
    const tmrw = new Date(date + "T00:00:00");
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = tmrw.toISOString().split("T")[0];
    return (matters || []).filter((m) => m.deadlineDate === tmrwStr);
  }, [matters, date]);

  const dateObj = new Date(date + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 19, fontWeight: 600 }}>{dateLabel}</div>
          <div style={{ fontSize: 12.5, color: "#8A8578", marginTop: 2 }}>
            {dayHearings.length} listing{dayHearings.length === 1 ? "" : "s"}{courtComplexes.size > 0 ? ` across ${courtComplexes.size} court complex${courtComplexes.size === 1 ? "" : "es"}` : ""}
            {conflicts.length > 0 ? ` · ${conflicts.length} scheduling conflict${conflicts.length === 1 ? "" : "s"}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={onBack} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#6B6255", background: "transparent", border: "1px solid #D9D2C2", borderRadius: 5, cursor: "pointer" }}>Back to month</button>
          {onBroadcastCauseList && <button onClick={onBroadcastCauseList} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "transparent", color: "#6B6255", border: "1px solid #D9D2C2", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Send size={14} /> Broadcast cause list</button>}
          {onPrintCauseList && <button onClick={onPrintCauseList} style={{ padding: "7px 14px", borderRadius: 5, fontSize: 12.5, fontWeight: 600, background: "#6B2737", color: "#F7F5F0", border: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><Printer size={14} /> Print cause list</button>}
        </div>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, overflow: "hidden" }}>
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Sitting day</span>
            <span style={{ fontSize: 12, color: "#8A8578" }}>Times as listed</span>
          </div>
          <div style={{ padding: "14px 18px", flex: 1, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "62px 1fr", gap: 0 }}>
              {HOURS.map((hr) => {
                const label = `${hr % 12 === 0 ? 12 : hr % 12}:00 ${hr < 12 ? "AM" : "PM"}`;
                const hourHearings = dayHearings.filter((h) => {
                  if (!h.time) return false;
                  const [hh] = h.time.split(":").map(Number);
                  return hh === hr;
                });
                return (
                  <React.Fragment key={hr}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8A8578", paddingTop: 6 }}>{label}</div>
                    <div style={{ borderTop: "1px solid #EFEBE1", minHeight: 78, padding: "6px 0", display: "flex", gap: 8 }}>
                      {hourHearings.map((h) => {
                        const inConflict = conflicts.some(([t]) => t === h.time);
                        const color = inConflict ? "#6B2737" : "#3D5A4C";
                        return (
                          <div key={h.id} onClick={() => onOpenHearingBrief && onOpenHearingBrief(h)} style={{ flex: 1, borderLeft: `3px solid ${color}`, background: `${color}0F`, borderRadius: 5, padding: "8px 10px", cursor: onOpenHearingBrief ? "pointer" : "default" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{matterTitle(h.matterId)}</div>
                              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color, fontWeight: 600 }}>{h.time}</span>
                            </div>
                            <div style={{ fontSize: 11, color: "#8A8578", marginTop: 2 }}>{h.court || "Court TBD"}</div>
                            {h.notes && <div style={{ fontSize: 11, color: "#6B6255", marginTop: 2 }}>{h.notes}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                );
              })}
              {dayHearings.filter((h) => !h.time).map((h) => (
                <React.Fragment key={h.id}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8A8578", paddingTop: 6 }}>Time TBD</div>
                  <div style={{ borderTop: "1px solid #EFEBE1", minHeight: 60, padding: "6px 0" }}>
                    <div onClick={() => onOpenHearingBrief && onOpenHearingBrief(h)} style={{ borderLeft: "3px solid #8A8578", background: "#8A857808", borderRadius: 5, padding: "8px 10px", cursor: onOpenHearingBrief ? "pointer" : "default" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{matterTitle(h.matterId)}</div>
                      <div style={{ fontSize: 11, color: "#8A8578" }}>{h.court || "Court TBD"}</div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            {dayHearings.length === 0 && <EmptyState icon={Calendar} title="No listings" sub="No hearings scheduled for this day." />}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
          {conflicts.length > 0 && conflicts.map(([time, list]) => (
            <div key={time} style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderLeft: "3px solid #6B2737", borderRadius: 8, padding: "12px 16px" }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#6B2737", marginBottom: 5 }}>Conflict at {time}</div>
              <div style={{ fontSize: 12, color: "#6B6255", lineHeight: 1.5 }}>
                {list.length} listings at the same time — {list.map((h) => matterTitle(h.matterId)).join(" and ")}.
              </div>
            </div>
          ))}

          <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Bench order</div>
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {dayHearings.map((h) => (
                <div key={h.id} style={{ display: "flex", gap: 10 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: "#8A8578", width: 38, flexShrink: 0 }}>{h.time || "TBD"}</div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{h.court || "Court TBD"}</div>
                    <div style={{ fontSize: 11, color: "#8A8578" }}>{matterTitle(h.matterId)}</div>
                  </div>
                </div>
              ))}
              {dayHearings.length === 0 && <div style={{ fontSize: 12, color: "#8A8578" }}>Nothing listed today.</div>}
            </div>
          </div>

          {dueTomorrow.length > 0 && (
            <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ padding: "11px 16px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 15, fontWeight: 600 }}>Due tomorrow</div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {dueTomorrow.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: "#8A8578" }}>{m.deadlineType || "Statutory deadline"}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: "#B08D5718", color: "#8A6D3B", border: "1px solid #B08D5735", borderRadius: 4, padding: "2.5px 8px" }}>Due 1d</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarView({
  hearings = [],
  matters = [],
  matterTitle = () => "—",
  calendarView = { month: new Date().getMonth(), year: new Date().getFullYear() },
  setCalendarView = () => {},
  onEdit,
  onOpenHearingBrief,
  onBroadcastCauseList,
  onPrintCauseList,
}) {
  const safeHearings = Array.isArray(hearings) ? hearings : [];
  const safeMatterTitle = typeof matterTitle === "function" ? matterTitle : () => "—";
  const { month = new Date().getMonth(), year = new Date().getFullYear() } = calendarView || {};
  const [focusedDay, setFocusedDay] = useState(null);

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfMonth(month, year);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const getHearingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return safeHearings.filter((h) => h && h.date === dateStr);
  };

  const prevMonth = () => setCalendarView(month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year });
  const nextMonth = () => setCalendarView(month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year });

  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const todayStr = today.toISOString().split("T")[0];

  const monthHearings = safeHearings.filter((h) => {
    if (!h || !h.date) return false;
    const hDate = new Date(h.date + "T00:00:00");
    return !isNaN(hDate.getTime()) && hDate.getMonth() === month && hDate.getFullYear() === year;
  }).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  if (focusedDay) {
    return (
      <DaySheet
        date={focusedDay}
        hearings={safeHearings}
        matters={matters}
        matterTitle={safeMatterTitle}
        onOpenHearingBrief={onOpenHearingBrief}
        onBroadcastCauseList={onBroadcastCauseList}
        onPrintCauseList={onPrintCauseList}
        onBack={() => setFocusedDay(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 600 }}>{monthNames[month]} {year}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => setFocusedDay(todayStr)} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, color: "#6B6255", background: "transparent", border: "1px solid #D9D2C2", borderRadius: 5, cursor: "pointer" }}>Day view</button>
            <button onClick={prevMonth} style={{ width: 30, height: 30, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={15} /></button>
            <button onClick={nextMonth} style={{ width: 30, height: 30, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={15} /></button>
          </div>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.5, padding: "6px 0" }}>{day}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => (<div key={`empty-${i}`} style={{ padding: "8px 4px", minHeight: 76 }} />))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayHearings = getHearingsForDay(day);
              const isTodayDay = isToday(day);
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              return (
                <div
                  key={day}
                  onClick={() => setFocusedDay(dateStr)}
                  style={{
                    padding: "8px 6px", minHeight: 76, border: "1px solid #EFEBE1", borderRadius: 6, cursor: "pointer",
                    background: isTodayDay ? "#F5EFE6" : "transparent", transition: "all 0.15s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#B08D57"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#EFEBE1"; }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: isTodayDay ? 700 : 500, color: isTodayDay ? "#6B2737" : "#22262B", marginBottom: 4 }}>{day}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {dayHearings.slice(0, 2).map((h) => (
                      <div
                        key={h.id}
                        onClick={(e) => { e.stopPropagation(); onEdit ? onEdit(h) : setFocusedDay(dateStr); }}
                        style={{
                          fontSize: 10, padding: "2px 5px", background: "#6B273715", color: "#6B2737",
                          borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis", fontWeight: 500
                        }}
                        title={`${safeMatterTitle(h.matterId)} (${h.court || "TBD"})`}
                      >
                        {safeMatterTitle(h.matterId)}
                      </div>
                    ))}
                    {dayHearings.length > 2 && (<div style={{ fontSize: 9, color: "#8A8578", textAlign: "center" }}>+{dayHearings.length - 2} more</div>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ width: 280, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600 }}>This Month's Cause List</div>
        <div style={{ padding: 14 }}>
          {monthHearings.map((h) => {
            const d = daysUntil(h.date);
            return (
              <div
                key={h.id}
                onClick={() => onEdit && onEdit(h)}
                style={{
                  padding: "10px 12px", marginBottom: 8, background: "#F7F5F0", borderRadius: 6, cursor: "pointer",
                  borderLeft: `3px solid ${d <= 2 ? "#6B2737" : "#B08D57"}`, transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace", color: "#8A8578", marginBottom: 3 }}>{fmtDate(h.date)}{h.time ? ` · ${h.time}` : ""}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{safeMatterTitle(h.matterId)}</div>
                <div style={{ fontSize: 11, color: "#8A8578" }}>{h.court || "Court TBD"}</div>
                {d !== null && d >= 0 && (
                  <div style={{ fontSize: 10, marginTop: 4, color: d <= 2 ? "#6B2737" : "#3D5A4C", fontWeight: 600 }}>
                    {d === 0 ? "TODAY" : d === 1 ? "TOMORROW" : `In ${d} days`}
                  </div>
                )}
              </div>
            );
          })}
          {monthHearings.length === 0 && <EmptyState icon={Calendar} title="No listings this month" sub="Add a hearing to track court appearances." />}
        </div>
      </div>
    </div>
  );
}
