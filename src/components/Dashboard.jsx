import React from "react";
import { Users, Briefcase, Gavel, Receipt, TrendingUp, Clock, AlertCircle, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { PRACTICE_AREAS, PRACTICE_COLORS, MATTER_COLORS } from "../constants";
import { fmtDate, daysUntil, fmtCurrency } from "../utils";
import { Badge, EmptyState } from "./UI";

export default function Dashboard({
  clientsCount,
  activeMatters,
  billing,
  upcomingHearings,
  overdueInvoices,
  totalRevenue,
  matterTitle,
  goto,
}) {
  const practiceData = PRACTICE_AREAS.map((p, idx) => ({
    name: p.split(" ")[0],
    fullName: p,
    count: activeMatters.filter((m) => m.practiceArea === p).length,
    fill: PRACTICE_COLORS[idx % PRACTICE_COLORS.length],
  })).filter((d) => d.count > 0);

  const statusData = ["Intake", "Active", "Pending Hearing", "Settlement"].map((st) => ({
    name: st,
    value: activeMatters.filter((m) => m.status === st).length,
    color: MATTER_COLORS[st],
  })).filter((d) => d.value > 0);

  const revenueData = [
    { month: "Jan", amount: 14500 },
    { month: "Feb", amount: 22000 },
    { month: "Mar", amount: 18500 },
    { month: "Apr", amount: 29000 },
    { month: "May", amount: 34200 },
    { month: "Jun", amount: totalRevenue > 0 ? totalRevenue : 41000 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <div style={{ background: "#FCFAF6", padding: "18px 20px", borderRadius: 8, border: "1px solid #E4DFD3", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Active Matters</div>
            <Briefcase size={16} color="#6B2737" />
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, fontWeight: 600, color: "#6B2737" }}>{activeMatters.length}</div>
          <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>Cases pending before courts</div>
        </div>

        <div style={{ background: "#FCFAF6", padding: "18px 20px", borderRadius: 8, border: "1px solid #E4DFD3", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Listed Hearings</div>
            <Gavel size={16} color="#B08D57" />
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, fontWeight: 600, color: "#B08D57" }}>{upcomingHearings.length}</div>
          <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>Next 14 days cause list</div>
        </div>

        <div style={{ background: "#FCFAF6", padding: "18px 20px", borderRadius: 8, border: "1px solid #E4DFD3", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Client Retainers</div>
            <Users size={16} color="#3D5A4C" />
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 30, fontWeight: 600, color: "#3D5A4C" }}>{clientsCount}</div>
          <div style={{ fontSize: 11, color: "#8A8578", marginTop: 4 }}>Corporate & private clients</div>
        </div>

        <div style={{ background: "#FCFAF6", padding: "18px 20px", borderRadius: 8, border: "1px solid #E4DFD3", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ fontSize: 11.5, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Realized Fees</div>
            <TrendingUp size={16} color="#22262B" />
          </div>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, fontWeight: 600, color: "#22262B" }}>{fmtCurrency(totalRevenue, "AED")}</div>
          <div style={{ fontSize: 11, color: overdueInvoices.length > 0 ? "#6B2737" : "#8A8578", marginTop: 4, fontWeight: overdueInvoices.length > 0 ? 600 : 400 }}>
            {overdueInvoices.length} overdue invoices
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Practice Breakdown Bar Chart */}
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#22262B" }}>Matters by Practice Area</div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={practiceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A8578" }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11, fill: "#8A8578" }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 6, fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {practiceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Matter Status Donut */}
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#22262B" }}>Procedural Stages</div>
          <div style={{ width: "100%", height: 160 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {statusData.map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} />
                <span style={{ color: "#6B6255" }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cause List & Statutory Deadlines Highlights */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        {/* Cause List Highlight */}
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600 }}>Priority Court Appearances</div>
            <button onClick={() => goto("hearings")} style={{ background: "none", border: "none", color: "#6B2737", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              Full Cause List <ChevronRight size={13} />
            </button>
          </div>
          {upcomingHearings.length === 0 ? (
            <EmptyState icon={Gavel} title="No hearings scheduled" sub="Add one from the Hearings tab." />
          ) : (
            <table><tbody>
              {upcomingHearings.map((h) => {
                const d = daysUntil(h.date);
                return (
                  <tr key={h.id}>
                    <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, fontWeight: 600, width: 105 }}>{fmtDate(h.date)}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{matterTitle(h.matterId)}</div>
                      <div style={{ fontSize: 11.5, color: "#8A8578" }}>{h.court || "Court bench unassigned"}</div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Badge text={d === 0 ? "TODAY" : d === 1 ? "TOMORROW" : `In ${d}d`} color={d <= 2 ? "#6B2737" : d <= 7 ? "#B08D57" : "#3D5A4C"} />
                    </td>
                  </tr>
                );
              })}
            </tbody></table>
          )}
        </div>

        {/* Statutory Limitation & Filing Deadlines */}
        <div style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FBF9F4" }}>
            <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, color: "#6B2737" }}>
              <Clock size={16} /> Statutory Deadlines & Limitation
            </div>
            <button onClick={() => goto("deadlines")} style={{ background: "none", border: "none", color: "#6B2737", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
              Deadlines Board <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ padding: "12px 16px", flex: 1 }}>
            {activeMatters.filter((m) => m.deadlineDate).length === 0 ? (
              <div style={{ padding: "24px 12px", textAlign: "center", color: "#8A8578" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#4A453C" }}>Track Appeal & Filing Cutoffs</div>
                <div style={{ fontSize: 11, marginTop: 4, lineHeight: 1.4 }}>
                  Log statutory limitations for appeal, written statements, and discovery under the Deadlines tracker.
                </div>
                <button
                  onClick={() => goto("deadlines")}
                  style={{ marginTop: 12, background: "rgba(107, 39, 55, 0.08)", border: "1px solid #6B273744", color: "#6B2737", padding: "6px 12px", borderRadius: 4, fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                >
                  Open Deadlines Board
                </button>
              </div>
            ) : (
              activeMatters.filter((m) => m.deadlineDate).slice(0, 3).map((m) => {
                const days = daysUntil(m.deadlineDate);
                const isUrgent = days <= 3;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #EFEBE1" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: "#1C2333" }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: "#8A8578" }}>{m.deadlineType || "Court Filing Cutoff"}</div>
                    </div>
                    <Badge 
                      text={days < 0 ? "OVERDUE" : days === 0 ? "DUE TODAY" : `Due ${days}d`} 
                      color={isUrgent ? "#C62828" : "#B08D57"} 
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
