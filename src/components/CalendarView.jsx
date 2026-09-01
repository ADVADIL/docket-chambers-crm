import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { fmtDate, daysUntil } from "../utils";
import { EmptyState } from "./UI";

export default function CalendarView({ 
  hearings = [], 
  matterTitle = () => "—", 
  calendarView = { month: new Date().getMonth(), year: new Date().getFullYear() }, 
  setCalendarView = () => {}, 
  onEdit 
}) {
  const safeHearings = Array.isArray(hearings) ? hearings : [];
  const safeMatterTitle = typeof matterTitle === "function" ? matterTitle : () => "—";
  const { month = new Date().getMonth(), year = new Date().getFullYear() } = calendarView || {};
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

  const monthHearings = safeHearings.filter((h) => {
    if (!h || !h.date) return false;
    const hDate = new Date(h.date + "T00:00:00");
    return !isNaN(hDate.getTime()) && hDate.getMonth() === month && hDate.getFullYear() === year;
  }).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 600 }}>{monthNames[month]} {year}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={prevMonth}
              style={{ width: 30, height: 30, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={nextMonth}
              style={{ width: 30, height: 30, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            >
              <ChevronRight size={15} />
            </button>
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
              return (
                <div
                  key={day}
                  style={{
                    padding: "8px 6px", minHeight: 76, border: "1px solid #EFEBE1", borderRadius: 6,
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
                        onClick={(e) => { e.stopPropagation(); onEdit(h); }}
                        style={{
                          fontSize: 10, padding: "2px 5px", background: "#6B273715", color: "#6B2737",
                          borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden",
                          textOverflow: "ellipsis", fontWeight: 500
                        }}
                        title={`${matterTitle(h.matterId)} (${h.court || "TBD"})`}
                      >
                        {matterTitle(h.matterId)}
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
                onClick={() => onEdit(h)}
                style={{
                  padding: "10px 12px", marginBottom: 8, background: "#F7F5F0", borderRadius: 6, cursor: "pointer",
                  borderLeft: `3px solid ${d <= 2 ? "#6B2737" : "#B08D57"}`, transition: "all 0.15s"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateX(3px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateX(0)"; }}
              >
                <div style={{ fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace", color: "#8A8578", marginBottom: 3 }}>{fmtDate(h.date)}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{matterTitle(h.matterId)}</div>
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
