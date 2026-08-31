import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Users, Briefcase, Gavel, Receipt, Plus, X, Search, ChevronRight, Trash2, Edit3, LayoutDashboard, CalendarDays, ChevronLeft, Calendar, DollarSign, Clock, AlertCircle, LogOut, Wifi, WifiOff, Printer, Download, Sunrise } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabaseClient.js";
import { todayISO, fmtDate, daysUntil, fmtCurrency, deadlineBadge, useTable, useReadOnlyTable, insertRow, updateRow, deleteRow } from "../lib/dataHooks.js";
import { inputStyle, Badge, EmptyState, Modal, Field, Btn, FormError, RowActions } from "./ui.jsx";
import TodayBoard from "./TodayBoard.jsx";
import MatterCommandCentre from "./MatterCommandCentre.jsx";
import GlobalSearch from "./GlobalSearch.jsx";

// ---------- Constants ----------
const MATTER_STATUSES = ["Intake", "Active", "Pending Hearing", "Settlement", "Closed"];
const MATTER_COLORS = {
  Intake: "#B08D57",
  Active: "#6B2737",
  "Pending Hearing": "#8A6D3B",
  Settlement: "#3D5A4C",
  Closed: "#8A8578",
};

const HEARING_OUTCOMES = ["Scheduled", "Held", "Adjourned", "Order Reserved", "Disposed"];
const HEARING_OUTCOME_COLORS = {
  Scheduled: "#B08D57",
  Held: "#3D5A4C",
  Adjourned: "#8A6D3B",
  "Order Reserved": "#6B2737",
  Disposed: "#8A8578",
};

const PRIORITY_LEVELS = ["Low", "Normal", "High", "Critical"];
const PRIORITY_COLORS = { Low: "#8A8578", Normal: "#B08D57", High: "#8A6D3B", Critical: "#6B2737" };

const BILL_STATUSES = ["Draft", "Sent", "Paid", "Overdue"];
const BILL_COLORS = { Draft: "#8A8578", Sent: "#B08D57", Paid: "#3D5A4C", Overdue: "#6B2737" };

const PRACTICE_AREAS = [
  "Civil Litigation", "Criminal Defense", "Family Law", "Corporate Law", "Intellectual Property",
  "Real Estate / Land Revenue", "Employment Law", "Immigration", "Maritime & Trade",
  "Commercial Advisory", "Insolvency (NCLT)",
];

const COURTS = [
  "Madras High Court", "District Court", "High Court", "Supreme Court", "Family Court",
  "Commercial Court", "Labor Court / MOHRE", "Tax Tribunal", "Arbitration",
];

// ---------- Firm letterhead settings (single row, used on invoices) ----------
function useFirmSettings() {
  const [firm, setFirm] = useState({ name: "", address: "", phone: "", email: "" });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.from("firm_settings").select("*").eq("id", 1).single();
      if (mounted && data) setFirm(data);
      if (mounted) setLoaded(true);
    })();
    return () => { mounted = false; };
  }, []);

  const save = async (next) => {
    const { data, error } = await supabase.from("firm_settings").update(next).eq("id", 1).select().single();
    if (!error && data) setFirm(data);
    return { data, error };
  };

  return { firm, loaded, save };
}

// ---------- Invoice document (opened in a new window for browser Print-to-PDF) ----------
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function downloadCsv(filename, headers, rows) {
  const escapeCell = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const csv = [headers, ...rows].map((r) => r.map(escapeCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildInvoiceHtml({ firm, party, billing, invoiceNo }) {
  const amountStr = fmtCurrency(billing.amount, billing.currency);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(invoiceNo)}</title>
<style>
  @page { margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  html, body { height: auto; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #22262B;
    font-size: 13px;
    line-height: 1.5;
    margin: 0;
    padding: 56px 64px;
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    background: #fff;
  }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6B2737; padding-bottom: 20px; margin-bottom: 32px; }
  .firm-name { font-size: 20px; font-weight: 700; color: #1C2333; margin-bottom: 6px; }
  .muted { color: #6B6255; font-size: 12px; line-height: 1.6; white-space: pre-line; }
  .invoice-title { text-align: right; }
  .invoice-title h1 { font-size: 26px; color: #6B2737; margin: 0 0 6px; letter-spacing: 1.5px; }
  .meta-row { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #EFEBE1; }
  .bill-to { margin-bottom: 32px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #8A8578; margin: 0 0 8px; }
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
  table.items th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; color: #8A8578; border-bottom: 1px solid #D9D2C2; padding: 10px 6px; }
  table.items td { padding: 16px 6px; border-bottom: 1px solid #EFEBE1; font-size: 13.5px; }
  .amount-col { text-align: right; }
  .totals { width: 280px; margin-left: auto; border-collapse: collapse; margin-bottom: 40px; }
  .totals td { padding: 8px 6px; font-size: 13.5px; }
  .totals .grand td { font-weight: 700; font-size: 17px; color: #1C2333; border-top: 2px solid #6B2737; padding-top: 14px; }
  .footer { margin-top: 48px; font-size: 11.5px; color: #8A8578; border-top: 1px solid #EFEBE1; padding-top: 16px; }
  @media print {
    body { padding: 0; max-width: none; margin: 0; }
  }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="firm-name">${escapeHtml(firm.name || "Firm Name")}</div>
      <div class="muted">${escapeHtml(firm.address || "")}</div>
      <div class="muted">${[firm.email, firm.phone].filter(Boolean).map(escapeHtml).join("  ·  ")}</div>
    </div>
    <div class="invoice-title">
      <h1>INVOICE</h1>
      <div class="muted">${escapeHtml(invoiceNo)}</div>
    </div>
  </div>

  <div class="meta-row">
    <div><strong>Invoice Date:</strong> ${escapeHtml(fmtDate(billing.invoice_date))}</div>
    <div><strong>Status:</strong> ${escapeHtml(billing.status)}</div>
  </div>

  <div class="bill-to">
    <h3>Bill To</h3>
    <div style="font-weight:600; font-size:14px;">${escapeHtml(party.clientName || party.matterTitle)}</div>
    ${party.clientCompany ? `<div class="muted">${escapeHtml(party.clientCompany)}</div>` : ""}
    ${party.clientEmail ? `<div class="muted">${escapeHtml(party.clientEmail)}</div>` : ""}
    ${party.clientPhone ? `<div class="muted">${escapeHtml(party.clientPhone)}</div>` : ""}
    <div class="muted" style="margin-top:6px;">Re: ${escapeHtml(party.matterTitle)}</div>
  </div>

  <table class="items">
    <thead><tr><th>Description</th><th class="amount-col">Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${escapeHtml(billing.description || party.matterTitle)}</td>
        <td class="amount-col">${escapeHtml(amountStr)}</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr class="grand"><td>Total Due</td><td class="amount-col">${escapeHtml(amountStr)}</td></tr>
  </table>

  <div class="footer">Thank you. Please reference ${escapeHtml(invoiceNo)} with your payment.</div>
</body>
</html>`;
}

// ---------- Styled Components ----------
// ---------- Main App Component ----------
export default function DocketCRM({ session }) {
  const clientsT = useTable("clients");
  const mattersT = useTable("matters");
  const hearingsT = useTable("hearings");
  const billingT = useTable("billing");
  const tasksT = useTable("matter_tasks");
  const notesT = useTable("matter_notes");
  const auditT = useReadOnlyTable("matter_audit_log", "changed_at");
  const { firm, loaded: firmLoaded, save: saveFirm } = useFirmSettings();

  const [tab, setTab] = useState("today");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [invoiceRecord, setInvoiceRecord] = useState(null);
  const [openMatterId, setOpenMatterId] = useState(null);
  const [calendarView, setCalendarView] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  const clientName = useCallback((id) => clientsT.items.find((c) => c.id === id)?.name || "Unassigned", [clientsT.items]);
  const matterTitle = useCallback((id) => mattersT.items.find((m) => m.id === id)?.title || "—", [mattersT.items]);

  const getBillingParty = useCallback((b) => {
    const matter = mattersT.items.find((m) => m.id === b.matter_id);
    const resolvedTitle = matter ? matter.title : (b.matter_label || "—");
    const client = matter ? clientsT.items.find((c) => c.id === matter.client_id) : null;
    return {
      matterTitle: resolvedTitle,
      clientName: client?.name || "",
      clientCompany: client?.company || "",
      clientEmail: client?.email || "",
      clientPhone: client?.phone || "",
    };
  }, [mattersT.items, clientsT.items]);

  const closeModal = () => { setModal(null); setSaveError(""); };

  const handleSave = async (table, refetchState, record, isEdit) => {
    setSaveError("");
    try {
      const payload = { ...record };
      if (!isEdit) payload.created_by = session.user.id;
      if (isEdit) await updateRow(table, record.id, payload);
      else await insertRow(table, payload);
      closeModal();
    } catch (e) {
      setSaveError(e.message || "Save failed.");
    }
  };

  const handleDelete = async (table, id) => {
    try { await deleteRow(table, id); } catch (e) { console.error(e); }
  };

  const handleToggleTask = async (t) => {
    try {
      await updateRow("matter_tasks", t.id, {
        status: t.status === "Completed" ? "Open" : "Completed",
        completed_at: t.status === "Completed" ? null : new Date().toISOString(),
      });
    } catch (e) {
      console.error("Failed to update task:", e.message || e);
    }
  };

  const allLoaded = clientsT.loaded && mattersT.loaded && hearingsT.loaded && billingT.loaded && tasksT.loaded && notesT.loaded;

  const exportCurrentTab = () => {
    if (tab === "clients") {
      downloadCsv("clients.csv", ["Name", "Company", "Email", "Phone", "Notes"], clientsT.items.map((c) => [c.name, c.company, c.email, c.phone, c.notes]));
    } else if (tab === "matters") {
      downloadCsv("matters.csv", ["Title", "Client", "Practice Area", "Advocate", "Status", "Opposing Party", "Filing Date", "Notes"], mattersT.items.map((m) => [m.title, clientName(m.client_id), m.practice_area, m.advocate, m.status, m.opposing_party, m.filing_date, m.notes]));
    } else if (tab === "hearings") {
      downloadCsv("hearings.csv", ["Date", "Matter", "Court", "Outcome", "Prep Notes", "Order / What Happened"], hearingsT.items.map((h) => [h.hearing_date, matterTitle(h.matter_id), h.court, h.outcome, h.notes, h.order_notes]));
    } else if (tab === "billing") {
      downloadCsv("billing.csv", ["Matter", "Description", "Amount", "Currency", "Date", "Status"], billingT.items.map((b) => [b.matter_id ? matterTitle(b.matter_id) : b.matter_label, b.description, b.amount, b.currency, b.invoice_date, b.status]));
    }
  };
  const anyConnError = clientsT.connError || mattersT.connError || hearingsT.connError || billingT.connError || tasksT.connError || notesT.connError;

  const openTasksCount = useMemo(() => tasksT.items.filter((t) => t.status !== "Completed" && t.status !== "Cancelled").length, [tasksT.items]);

  const nav = [
    { key: "today", label: "Today", icon: Sunrise },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "clients", label: "Clients", icon: Users, count: clientsT.items.length },
    { key: "matters", label: "Matters", icon: Briefcase, count: mattersT.items.length },
    { key: "hearings", label: "Hearings", icon: Gavel, count: hearingsT.items.length },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "billing", label: "Billing", icon: Receipt, count: billingT.items.length },
  ];

  const upcomingHearings = useMemo(() => hearingsT.items
    .filter((h) => daysUntil(h.hearing_date) !== null && daysUntil(h.hearing_date) >= 0)
    .sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date))
    .slice(0, 6), [hearingsT.items]);

  const hearingsNeedingUpdate = useMemo(() => hearingsT.items
    .filter((h) => daysUntil(h.hearing_date) < 0 && (h.outcome || "Scheduled") === "Scheduled")
    .sort((a, b) => new Date(b.hearing_date) - new Date(a.hearing_date)), [hearingsT.items]);

  const overdueInvoices = useMemo(() => billingT.items.filter((b) => b.status === "Overdue"), [billingT.items]);
  const activeMatters = useMemo(() => mattersT.items.filter((m) => m.status !== "Closed"), [mattersT.items]);
  const totalRevenue = useMemo(() => billingT.items.filter((b) => b.status === "Paid").reduce((s, b) => s + Number(b.amount || 0), 0), [billingT.items]);

  const renderContent = () => {
    if (!allLoaded) {
      return (
        <div style={{ padding: 60, color: "#8A8578", fontSize: 14, textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Clock size={32} style={{ opacity: 0.6 }} />
            <div>Loading practice register…</div>
          </div>
        </div>
      );
    }
    if (anyConnError) {
      return <div style={{ padding: 40, color: "#6B2737" }}>Could not reach the database: {anyConnError}</div>;
    }
    switch (tab) {
      case "today":
        return (
          <TodayBoard
            matters={mattersT.items}
            hearings={hearingsT.items}
            tasks={tasksT.items}
            clientName={clientName}
            onOpenMatter={(id) => setOpenMatterId(id)}
            onEditHearing={(r) => setModal({ type: "hearings", record: r })}
            onToggleTask={handleToggleTask}
          />
        );
      case "dashboard":
        return <Dashboard clientsCount={clientsT.items.length} activeMatters={activeMatters} billing={billingT.items} upcomingHearings={upcomingHearings} hearingsNeedingUpdate={hearingsNeedingUpdate} overdueInvoices={overdueInvoices} totalRevenue={totalRevenue} matterTitle={matterTitle} goto={setTab} onEditHearing={(r) => setModal({ type: "hearings", record: r })} />;
      case "clients":
        return <ClientsTable items={clientsT.items} search={search} onEdit={(r) => setModal({ type: "clients", record: r })} onDelete={(id) => handleDelete("clients", id)} />;
      case "matters":
        return <MattersTable items={mattersT.items} search={search} clientName={clientName} onEdit={(r) => setModal({ type: "matters", record: r })} onDelete={(id) => handleDelete("matters", id)} onOpen={(m) => setOpenMatterId(m.id)} />;
      case "hearings":
        return <HearingsTable items={hearingsT.items} search={search} matterTitle={matterTitle} onEdit={(r) => setModal({ type: "hearings", record: r })} onDelete={(id) => handleDelete("hearings", id)} />;
      case "calendar":
        return <CalendarView hearings={hearingsT.items} matterTitle={matterTitle} calendarView={calendarView} setCalendarView={setCalendarView} onEdit={(r) => setModal({ type: "hearings", record: r })} />;
      case "billing":
        return <BillingTable items={billingT.items} search={search} matterTitle={matterTitle} onEdit={(r) => setModal({ type: "billing", record: r })} onDelete={(id) => handleDelete("billing", id)} onInvoice={(r) => setInvoiceRecord(r)} />;
      default:
        return null;
    }
  };

  return (
    <div className="docket-shell" style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", minHeight: "100vh", background: "#F7F5F0", color: "#22262B" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #8A8578; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #E4DFD3; }
        td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid #EFEBE1; vertical-align: middle; }
        tr:hover td { background: #FBF9F4; }
        .rowbtn { opacity: 0; transition: opacity .12s; }
        tr:hover .rowbtn { opacity: 1; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #EFEBE1; }
        ::-webkit-scrollbar-thumb { background: #B08D57; border-radius: 3px; }
        .docket-table-scroll { overflow-x: auto; }
        @media (max-width: 820px) {
          .docket-shell { flex-direction: column !important; }
          .docket-sidebar { width: 100% !important; flex-direction: row !important; align-items: center !important; padding: 0 !important; }
          .docket-sidebar-brand { border-bottom: none !important; padding: 10px 12px !important; }
          .docket-sidebar-brand > div > div:last-child { display: none !important; }
          .docket-sidebar-nav { display: flex !important; flex: none !important; padding: 6px !important; overflow-x: auto !important; }
          .docket-nav-item { flex-direction: column !important; gap: 2px !important; padding: 6px 10px !important; border-radius: 6px !important; border-left: none !important; font-size: 11px !important; white-space: nowrap; }
          .docket-nav-item span { flex: none !important; }
          .docket-sidebar-footer { display: none !important; }
          .docket-header-row { flex-direction: column !important; align-items: stretch !important; gap: 10px !important; }
          .docket-header-actions { flex-wrap: wrap; }
          .docket-header-actions input { width: 100% !important; }
          .docket-main-content { padding: 16px !important; }
          table th, table td { padding: 8px 6px !important; font-size: 12.5px !important; }
        }
      `}</style>

      <div className="docket-sidebar" style={{ width: 220, background: "linear-gradient(180deg, #1C2333 0%, #2C3450 100%)", color: "#E8E4D8", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div className="docket-sidebar-brand" style={{ padding: "24px 22px", borderBottom: "1px solid #2C3450" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #B08D57 0%, #6B2737 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Gavel size={20} color="#F7F5F0" />
            </div>
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 600, color: "#F7F5F0" }}>Docket</div>
              <div style={{ fontSize: 10, color: "#8A93B0", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 4 }}>
                {anyConnError ? <WifiOff size={10} /> : <Wifi size={10} />} CHAMBERS
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <GlobalSearch
              clients={clientsT.items}
              matters={mattersT.items}
              clientName={clientName}
              onSelectMatter={(id) => setOpenMatterId(id)}
              onSelectClient={(id) => { setTab("clients"); setSearch(clientsT.items.find((c) => c.id === id)?.name || ""); }}
            />
          </div>
        </div>

        <nav className="docket-sidebar-nav" style={{ padding: "14px 10px", flex: 1 }}>
          {nav.map((n) => {
            const active = tab === n.key;
            return (
              <div key={n.key} className="docket-nav-item" onClick={() => setTab(n.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", marginBottom: 4, borderRadius: "6px 6px 0 0", cursor: "pointer", fontSize: 14, background: active ? "#F7F5F0" : "transparent", color: active ? "#1C2333" : "#C7C2B4", fontWeight: active ? 600 : 500, borderLeft: active ? "3px solid #B08D57" : "3px solid transparent" }}>
                <n.icon size={17} strokeWidth={2} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {typeof n.count === "number" && (
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: active ? "#6B2737" : "#8A93B0", background: active ? "rgba(176,141,87,0.2)" : "rgba(138,147,176,0.15)", padding: "2px 7px", borderRadius: 10 }}>{n.count}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div className="docket-sidebar-footer" style={{ padding: "14px 18px", borderTop: "1px solid #2C3450" }}>
          <div style={{ fontSize: 11.5, color: "#8A93B0", marginBottom: 8, wordBreak: "break-all" }}>{session.user.email}</div>
          <div onClick={() => supabase.auth.signOut()} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#C7C2B4", cursor: "pointer" }}>
            <LogOut size={14} /> Sign out
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 32px 0", background: "#FCFAF6", borderBottom: "1px solid #E4DFD3" }}>
          <div className="docket-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 18 }}>
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, color: "#22262B", fontWeight: 600 }}>{nav.find((n) => n.key === tab)?.label}</div>
            </div>
            {tab !== "dashboard" && tab !== "calendar" && tab !== "today" && (
              <div className="docket-header-actions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#8A8578" }} />
                  <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: 220, paddingLeft: 32 }} />
                </div>
                <Btn variant="ghost" onClick={exportCurrentTab}><Download size={15} /> Export CSV</Btn>
                <Btn onClick={() => setModal({ type: tab, record: null })}><Plus size={15} /> Add</Btn>
              </div>
            )}
            {tab === "calendar" && <Btn onClick={() => setModal({ type: "hearings", record: null })}><Plus size={15} /> Add hearing</Btn>}
            {tab === "today" && <Btn onClick={() => setModal({ type: "tasks", record: null })}><Plus size={15} /> Add task</Btn>}
          </div>
        </div>
        <div className="docket-main-content" style={{ padding: "24px 32px 40px", flex: 1, overflowY: "auto" }}>{renderContent()}</div>
      </div>

      {modal?.type === "clients" && <ClientForm record={modal.record} error={saveError} onClose={closeModal} onSave={(r, isEdit) => handleSave("clients", clientsT, r, isEdit)} />}
      {modal?.type === "matters" && <MatterForm record={modal.record} clients={clientsT.items} error={saveError} onClose={closeModal} onSave={(r, isEdit) => handleSave("matters", mattersT, r, isEdit)} onCreateClient={(name) => insertRow("clients", { name, created_by: session.user.id })} />}
      {modal?.type === "hearings" && <HearingForm record={modal.record} prefill={modal.prefill} matters={mattersT.items} error={saveError} onClose={closeModal} onSave={(r, isEdit) => handleSave("hearings", hearingsT, r, isEdit)} onAddMatterFirst={() => setModal({ type: "matters", record: null })} />}
      {modal?.type === "billing" && <BillingForm record={modal.record} matters={mattersT.items} error={saveError} onClose={closeModal} onSave={(r, isEdit) => handleSave("billing", billingT, r, isEdit)} />}
      {modal?.type === "tasks" && (
        <TaskForm
          record={modal.record}
          prefill={modal.prefill}
          matters={mattersT.items}
          error={saveError}
          onClose={closeModal}
          onSave={(r, isEdit) => handleSave("matter_tasks", tasksT, r, isEdit)}
        />
      )}
      {openMatterId && (
        <MatterCommandCentre
          matter={mattersT.items.find((m) => m.id === openMatterId)}
          client={clientsT.items.find((c) => c.id === mattersT.items.find((m) => m.id === openMatterId)?.client_id)}
          hearings={hearingsT.items.filter((h) => h.matter_id === openMatterId)}
          billing={billingT.items.filter((b) => b.matter_id === openMatterId)}
          tasks={tasksT.items.filter((t) => t.matter_id === openMatterId)}
          notes={notesT.items.filter((n) => n.matter_id === openMatterId)}
          auditLog={auditT.items.filter((a) => a.matter_id === openMatterId)}
          onClose={() => setOpenMatterId(null)}
          onEditMatter={() => setModal({ type: "matters", record: mattersT.items.find((m) => m.id === openMatterId) })}
          onAddHearing={() => setModal({ type: "hearings", record: null, prefill: { matter_id: openMatterId } })}
          onEditHearing={(r) => setModal({ type: "hearings", record: r })}
          onAddTask={(prefill) => setModal({ type: "tasks", record: null, prefill: { matter_id: openMatterId, ...prefill } })}
          onEditTask={(r) => setModal({ type: "tasks", record: r })}
          onToggleTask={handleToggleTask}
          onDeleteTask={(id) => handleDelete("matter_tasks", id)}
          onAddNote={(note) => insertRow("matter_notes", { ...note, matter_id: openMatterId, created_by: session.user.id })}
          onDeleteNote={(id) => handleDelete("matter_notes", id)}
        />
      )}
      {invoiceRecord && (
        <InvoiceModal
          billing={invoiceRecord}
          party={getBillingParty(invoiceRecord)}
          firm={firm}
          firmLoaded={firmLoaded}
          onSaveFirm={saveFirm}
          onClose={() => setInvoiceRecord(null)}
        />
      )}
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ clientsCount, activeMatters, billing, upcomingHearings, hearingsNeedingUpdate, overdueInvoices, totalRevenue, matterTitle, goto, onEditHearing }) {
  const practiceData = useMemo(() => {
    const counts = {};
    activeMatters.forEach((m) => { const k = (m.practice_area || "Unspecified").trim() || "Unspecified"; counts[k] = (counts[k] || 0) + 1; });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [activeMatters]);

  const revenueData = useMemo(() => {
    const byMonth = {};
    billing.filter((b) => b.status === "Paid").forEach((b) => {
      const m = (b.invoice_date || "").slice(0, 7);
      if (!m) return;
      byMonth[m] = (byMonth[m] || 0) + Number(b.amount || 0);
    });
    return Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([m, total]) => ({
      month: new Date(m + "-01").toLocaleDateString("en-GB", { month: "short", year: "2-digit" }), total: Math.round(total),
    }));
  }, [billing]);

  const statusData = useMemo(() => {
    const counts = {};
    activeMatters.forEach((m) => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: MATTER_COLORS[name] || "#8A8578" }));
  }, [activeMatters]);

  const COLORS = ["#6B2737", "#B08D57", "#8A6D3B", "#3D5A4C", "#8A8578"];

  const StatCard = ({ icon: Icon, label, value, sub, color = "#22262B" }) => (
    <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, background: color + "15", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={18} style={{ color }} /></div>
        <div style={{ fontSize: 12, color: "#8A8578", textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      </div>
      <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 28, color: color || "#22262B", fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#8A8578", marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <StatCard icon={Users} label="Clients on File" value={clientsCount} />
        <StatCard icon={Briefcase} label="Active Matters" value={activeMatters.length} />
        <StatCard icon={DollarSign} label="Total Revenue" value={fmtCurrency(totalRevenue)} sub="Collected" color="#3D5A4C" />
        <StatCard icon={AlertCircle} label="Overdue Invoices" value={overdueInvoices.length} sub={overdueInvoices.length ? "Action required" : "All current"} color={overdueInvoices.length ? "#6B2737" : "#3D5A4C"} />
      </div>

      {hearingsNeedingUpdate.length > 0 && (
        <div style={{ background: "#6B27370d", border: "1px solid #6B273733", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #6B273733", fontFamily: "'Source Serif 4', serif", fontSize: 16, color: "#6B2737", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={17} /> {hearingsNeedingUpdate.length} hearing{hearingsNeedingUpdate.length > 1 ? "s" : ""} need{hearingsNeedingUpdate.length === 1 ? "s" : ""} an outcome recorded
          </div>
          <table>
            <tbody>
              {hearingsNeedingUpdate.map((h) => (
                <tr key={h.id} onClick={() => onEditHearing(h)} style={{ cursor: "pointer" }}>
                  <td style={{ width: 100, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, color: "#8A8578" }}>{fmtDate(h.hearing_date)}</td>
                  <td style={{ fontWeight: 600 }}>{matterTitle(h.matter_id)}</td>
                  <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
                  <td style={{ textAlign: "right" }}><Badge text="Needs update" color="#6B2737" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16, display: "flex", justifyContent: "space-between" }}>
            <span>Matters by Practice Area</span>
            <span onClick={() => goto("matters")} style={{ cursor: "pointer", fontSize: 12, color: "#6B2737", fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", alignItems: "center", gap: 2 }}>View all <ChevronRight size={13} /></span>
          </div>
          {practiceData.length === 0 ? <EmptyState icon={Briefcase} title="No matters yet" sub="Create your first matter to see analytics." /> : (
            <div style={{ padding: 16, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={practiceData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>{practiceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16 }}>Matter Status Distribution</div>
          {statusData.length === 0 ? <EmptyState icon={Briefcase} title="No data available" sub="Create matters to see status distribution." /> : (
            <div style={{ padding: 16, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16 }}>Next on the docket</div>
          {upcomingHearings.length === 0 ? <EmptyState icon={Gavel} title="No hearings scheduled" sub="Add one from the Hearings tab." /> : (
            <table><tbody>
              {upcomingHearings.map((h) => {
                const d = daysUntil(h.hearing_date);
                return (
                  <tr key={h.id}>
                    <td style={{ width: 100, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(h.hearing_date)}</td>
                    <td style={{ fontWeight: 600 }}>{matterTitle(h.matter_id)}</td>
                    <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
                    <td style={{ textAlign: "right" }}><Badge text={d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d} days`} color={d <= 2 ? "#6B2737" : d <= 7 ? "#B08D57" : "#3D5A4C"} /></td>
                  </tr>
                );
              })}
            </tbody></table>
          )}
        </div>
        <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16 }}>Overdue billing</div>
          {overdueInvoices.length === 0 ? <EmptyState icon={Receipt} title="Nothing overdue" sub="All invoices are current." /> : (
            <table><tbody>
              {overdueInvoices.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.matter_id ? matterTitle(b.matter_id) : (b.matter_label || "—")}</td>
                  <td style={{ color: "#8A8578" }}>{b.description}</td>
                  <td style={{ textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", color: "#6B2737" }}>{fmtCurrency(b.amount, b.currency)}</td>
                </tr>
              ))}
            </tbody></table>
          )}
        </div>
        <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16 }}>Revenue trend</div>
          {revenueData.length === 0 ? <EmptyState icon={DollarSign} title="No revenue data" sub="Mark invoices as paid to see trends." /> : (
            <div style={{ padding: 16, height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E4DFD3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v / 1000}K`} />
                  <Tooltip formatter={(v) => [fmtCurrency(v), "Revenue"]} />
                  <Line type="monotone" dataKey="total" stroke="#3D5A4C" strokeWidth={2} dot={{ fill: "#3D5A4C", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Tables ----------
function ClientsTable({ items, search, onEdit, onDelete }) {
  const filtered = items.filter((c) => (c.name + (c.company || "") + (c.email || "")).toLowerCase().includes(search.toLowerCase()));
  if (items.length === 0) return <EmptyState icon={Users} title="No clients yet" sub="Add your first client to get started." />;
  return (
    <div className="docket-table-scroll" style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
      <table>
        <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th></th></tr></thead>
        <tbody>{filtered.map((c) => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td style={{ color: "#8A8578" }}>{c.company || "—"}</td>
            <td>{c.email || "—"}</td>
            <td>{c.phone || "—"}</td>
            <RowActions onEdit={() => onEdit(c)} onDelete={() => onDelete(c.id)} />
          </tr>
        ))}</tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No results found" sub={`No clients matching "${search}"`} />}
    </div>
  );
}

function MattersTable({ items, search, clientName, onEdit, onDelete, onOpen }) {
  const filtered = items.filter((m) => (m.title + (m.practice_area || "") + clientName(m.client_id) + (m.opposing_party || "") + (m.case_number || "")).toLowerCase().includes(search.toLowerCase()));
  if (items.length === 0) return <EmptyState icon={Briefcase} title="No matters yet" sub="Open your first matter to get started." />;
  return (
    <div className="docket-table-scroll" style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
      <table>
        <thead><tr><th>Matter</th><th>Client</th><th>v. Opposing Party</th><th>Practice Area</th><th>Status</th><th>Priority</th><th>Limitation</th><th>Next action</th><th></th></tr></thead>
        <tbody>{filtered.map((m) => {
          const limBadge = deadlineBadge(m.limitation_date);
          const nextBadge = deadlineBadge(m.next_action_due);
          return (
            <tr key={m.id}>
              <td style={{ fontWeight: 600, cursor: "pointer" }} onClick={() => onOpen(m)}>{m.title}</td>
              <td>{clientName(m.client_id)}</td>
              <td style={{ color: "#8A8578" }}>{m.opposing_party || "—"}</td>
              <td style={{ color: "#8A8578" }}>{m.practice_area || "—"}</td>
              <td><Badge text={m.status} color={MATTER_COLORS[m.status]} /></td>
              <td>{m.priority && m.priority !== "Normal" && <Badge text={m.priority} color={PRIORITY_COLORS[m.priority]} />}</td>
              <td>{limBadge ? <Badge text={limBadge.text} color={limBadge.color} /> : <span style={{ color: "#8A8578" }}>—</span>}</td>
              <td>
                {m.next_action ? (
                  <div>
                    <div style={{ fontSize: 12.5 }}>{m.next_action}</div>
                    {nextBadge && <div style={{ marginTop: 3 }}><Badge text={nextBadge.text} color={nextBadge.color} /></div>}
                  </div>
                ) : <span style={{ color: "#8A8578" }}>—</span>}
              </td>
              <RowActions onEdit={() => onEdit(m)} onDelete={() => onDelete(m.id)} />
            </tr>
          );
        })}</tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No results found" sub={`No matters matching "${search}"`} />}
    </div>
  );
}

function HearingsTable({ items, search, matterTitle, onEdit, onDelete }) {
  const filtered = items.filter((h) => (matterTitle(h.matter_id) + (h.court || "") + (h.outcome || "")).toLowerCase().includes(search.toLowerCase())).sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date));
  if (items.length === 0) return <EmptyState icon={Gavel} title="No hearings logged" sub="Track upcoming and past hearing dates here." />;
  return (
    <div className="docket-table-scroll" style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
      <table>
        <thead><tr><th>Date</th><th>Matter</th><th>Court / Forum</th><th>Outcome</th><th>Days</th><th></th></tr></thead>
        <tbody>{filtered.map((h) => {
          const d = daysUntil(h.hearing_date);
          const past = d !== null && d < 0;
          const needsUpdate = past && (h.outcome || "Scheduled") === "Scheduled";
          return (
            <tr key={h.id} style={needsUpdate ? { background: "#6B273708" } : undefined}>
              <td style={{ fontFamily: "'IBM Plex Mono', monospace", color: past ? "#8A8578" : "#22262B" }}>{fmtDate(h.hearing_date)}</td>
              <td style={{ fontWeight: 600 }}>{matterTitle(h.matter_id)}</td>
              <td style={{ color: "#8A8578" }}>{h.court || "—"}</td>
              <td><Badge text={h.outcome || "Scheduled"} color={HEARING_OUTCOME_COLORS[h.outcome || "Scheduled"]} /></td>
              <td>
                {needsUpdate ? (
                  <Badge text="Needs update" color="#6B2737" />
                ) : (
                  d !== null && <Badge text={past ? `${Math.abs(d)}d ago` : d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${d}d`} color={past ? "#8A8578" : d <= 2 ? "#6B2737" : d <= 7 ? "#B08D57" : "#3D5A4C"} />
                )}
              </td>
              <RowActions onEdit={() => onEdit(h)} onDelete={() => onDelete(h.id)} />
            </tr>
          );
        })}</tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No results found" sub={`No hearings matching "${search}"`} />}
    </div>
  );
}

function BillingTable({ items, search, matterTitle, onEdit, onDelete, onInvoice }) {
  const label = (b) => (b.matter_id ? matterTitle(b.matter_id) : (b.matter_label || "—"));
  const filtered = items.filter((b) => (label(b) + (b.description || "")).toLowerCase().includes(search.toLowerCase()));
  if (items.length === 0) return <EmptyState icon={Receipt} title="No invoices yet" sub="Log billing against a matter here." />;
  return (
    <div className="docket-table-scroll" style={{ background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
      <table>
        <thead><tr><th>Matter</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th><th></th></tr></thead>
        <tbody>{filtered.map((b) => (
          <tr key={b.id}>
            <td style={{ fontWeight: 600 }}>{label(b)}</td>
            <td style={{ color: "#8A8578" }}>{b.description}</td>
            <td style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{fmtCurrency(b.amount, b.currency)}</td>
            <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5 }}>{fmtDate(b.invoice_date)}</td>
            <td><Badge text={b.status} color={BILL_COLORS[b.status]} /></td>
            <td style={{ width: 96, textAlign: "right" }}>
              <div className="rowbtn" style={{ display: "inline-flex", gap: 4 }}>
                <button onClick={() => onInvoice(b)} title="Generate invoice" style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}><Printer size={14} /></button>
                <button onClick={() => onEdit(b)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}><Edit3 size={14} /></button>
                <button onClick={() => onDelete(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8578", padding: 4 }}><Trash2 size={14} /></button>
              </div>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {filtered.length === 0 && search && <EmptyState icon={Search} title="No results found" sub={`No invoices matching "${search}"`} />}
    </div>
  );
}

// ---------- Calendar ----------
function CalendarView({ hearings, matterTitle, calendarView, setCalendarView, onEdit }) {
  const { month, year } = calendarView;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const getHearingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return hearings.filter((h) => h.hearing_date === dateStr);
  };
  const prevMonth = () => setCalendarView(month === 0 ? { month: 11, year: year - 1 } : { month: month - 1, year });
  const nextMonth = () => setCalendarView(month === 11 ? { month: 0, year: year + 1 } : { month: month + 1, year });
  const today = new Date();
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const monthHearings = hearings.filter((h) => { const d = new Date(h.hearing_date + "T00:00:00"); return d.getMonth() === month && d.getFullYear() === year; }).sort((a, b) => new Date(a.hearing_date) - new Date(b.hearing_date));

  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ flex: 1, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 18, fontWeight: 600 }}>{monthNames[month]} {year}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={prevMonth} style={{ width: 32, height: 32, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer" }}><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} style={{ width: 32, height: 32, border: "1px solid #D9D2C2", borderRadius: 5, background: "transparent", cursor: "pointer" }}><ChevronRight size={16} /></button>
          </div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#8A8578", textTransform: "uppercase" }}>{d}</div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ minHeight: 80 }} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayHearings = getHearingsForDay(day);
              return (
                <div key={day} style={{ padding: "8px 4px", minHeight: 80, border: "1px solid #EFEBE1", borderRadius: 6, background: isToday(day) ? "#F7F5F0" : "transparent" }}>
                  <div style={{ fontSize: 13, fontWeight: isToday(day) ? 600 : 500, color: isToday(day) ? "#6B2737" : "#22262B", marginBottom: 4 }}>{day}</div>
                  {dayHearings.slice(0, 2).map((h) => (
                    <div key={h.id} onClick={() => onEdit(h)} style={{ fontSize: 10, padding: "2px 4px", background: "#6B273715", color: "#6B2737", borderRadius: 3, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{matterTitle(h.matter_id)}</div>
                  ))}
                  {dayHearings.length > 2 && <div style={{ fontSize: 9, color: "#8A8578", textAlign: "center" }}>+{dayHearings.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div style={{ width: 280, background: "#FCFAF6", border: "1px solid #E4DFD3", borderRadius: 8 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #E4DFD3", fontFamily: "'Source Serif 4', serif", fontSize: 16, fontWeight: 600 }}>This Month&rsquo;s Hearings</div>
        <div style={{ padding: 16 }}>
          {monthHearings.map((h) => {
            const d = daysUntil(h.hearing_date);
            return (
              <div key={h.id} onClick={() => onEdit(h)} style={{ padding: 12, marginBottom: 8, background: "#F7F5F0", borderRadius: 6, cursor: "pointer", borderLeft: `3px solid ${d <= 2 ? "#6B2737" : "#B08D57"}` }}>
                <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", color: "#8A8578", marginBottom: 4 }}>{fmtDate(h.hearing_date)}</div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{matterTitle(h.matter_id)}</div>
                <div style={{ fontSize: 11, color: "#8A8578" }}>{h.court || "Court TBD"}</div>
                {d !== null && d >= 0 && <div style={{ fontSize: 10, marginTop: 6, color: d <= 2 ? "#6B2737" : "#3D5A4C", fontWeight: 600 }}>{d === 0 ? "TODAY" : d === 1 ? "TOMORROW" : `In ${d} days`}</div>}
              </div>
            );
          })}
          {monthHearings.length === 0 && <EmptyState icon={Calendar} title="No hearings this month" sub="Add a hearing to see it here." />}
        </div>
      </div>
    </div>
  );
}

// ---------- Forms ----------
function ClientForm({ record, error, onClose, onSave }) {
  const [f, setF] = useState(record || { name: "", company: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "Invalid email format";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  return (
    <Modal title={record ? "Edit client" : "Add new client"} onClose={onClose}>
      <FormError error={error} />
      <Field label="Full Name *" error={errors.name}><input style={{ ...inputStyle, borderColor: errors.name ? "#6B2737" : "#D9D2C2" }} value={f.name} onChange={set("name")} autoFocus placeholder="e.g. John Smith" /></Field>
      <Field label="Company"><input style={inputStyle} value={f.company || ""} onChange={set("company")} placeholder="e.g. Acme Corporation" /></Field>
      <Field label="Email" error={errors.email}><input style={{ ...inputStyle, borderColor: errors.email ? "#6B2737" : "#D9D2C2" }} value={f.email || ""} onChange={set("email")} placeholder="email@example.com" /></Field>
      <Field label="Phone"><input style={inputStyle} value={f.phone || ""} onChange={set("phone")} placeholder="+971 5X XXX XXXX" /></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 70 }} value={f.notes || ""} onChange={set("notes")} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f, !!record)}>Save Client</Btn>
      </div>
    </Modal>
  );
}

function MatterForm({ record, clients, error, onClose, onSave, onCreateClient }) {
  const [f, setF] = useState(record || {
    title: "", client_id: "", practice_area: PRACTICE_AREAS[0], advocate: "", status: "Intake",
    filing_date: todayISO(), notes: "", opposing_party: "", case_number: "", court_complex: "",
    jurisdiction: "", opposing_counsel: "", registration_date: "", priority: "Normal",
    next_action: "", next_action_due: "", limitation_date: "",
  });
  const initialClientName = record ? (clients.find((c) => c.id === record.client_id)?.name || "") : "";
  const [clientName, setClientName] = useState(initialClientName);
  const [clientError, setClientError] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(() => checkConflict(record?.opposing_party, clients));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  function checkConflict(opposingName, clientList) {
    if (!opposingName || !opposingName.trim()) return "";
    const match = clientList.find((c) => c.name.trim().toLowerCase() === opposingName.trim().toLowerCase());
    return match ? `"${match.name}" is already a client of this firm. Review for a potential conflict of interest before proceeding.` : "";
  }

  const handleOpposingChange = (e) => {
    const val = e.target.value;
    setF({ ...f, opposing_party: val });
    setConflictWarning(checkConflict(val, clients));
  };

  const handleClientChange = (e) => {
    const val = e.target.value;
    const match = clients.find((c) => c.name.toLowerCase() === val.toLowerCase());
    setClientName(val);
    setF({ ...f, client_id: match ? match.id : "" });
    setClientError("");
  };

  const validate = () => {
    const e = {};
    if (!f.title.trim()) e.title = "Matter title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = { ...f };
    // Empty-string dates aren't valid for a `date` column — store null instead.
    for (const dateField of ["filing_date", "registration_date", "limitation_date", "next_action_due"]) {
      if (!payload[dateField]) payload[dateField] = null;
    }
    if (!clientName.trim()) {
      payload.client_id = null;
    } else if (!payload.client_id) {
      // Typed a name that doesn't match an existing client — create it.
      setSaving(true);
      try {
        const newClient = await onCreateClient(clientName.trim());
        payload.client_id = newClient.id;
      } catch (err) {
        setClientError(err.message || "Could not create that client.");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    onSave(payload, !!record);
  };

  return (
    <Modal title={record ? "Edit matter" : "Open new matter"} onClose={onClose}>
      <FormError error={error} />
      <Field label="Matter title *" error={errors.title}><input style={{ ...inputStyle, borderColor: errors.title ? "#6B2737" : "#D9D2C2" }} value={f.title} onChange={set("title")} autoFocus placeholder="e.g. Smith v. Johnson" /></Field>
      <Field label="Client" error={clientError}>
        <input list="matter-clients-list" style={inputStyle} value={clientName} onChange={handleClientChange} onFocus={(e) => e.target.select()} placeholder="Pick an existing client or type a new one" />
        <datalist id="matter-clients-list">{clients.map((c) => <option key={c.id} value={c.name} />)}</datalist>
      </Field>
      <Field label="Opposing party">
        <input style={inputStyle} value={f.opposing_party || ""} onChange={handleOpposingChange} placeholder="Name of the other side, if any" />
      </Field>
      {conflictWarning && (
        <div style={{ background: "#B08D5715", border: "1px solid #B08D5755", color: "#8A6D3B", borderRadius: 5, padding: "8px 12px", fontSize: 12.5, marginBottom: 14, marginTop: -8 }}>
          ⚠ {conflictWarning}
        </div>
      )}
      <Field label="Practice area"><select style={inputStyle} value={f.practice_area || PRACTICE_AREAS[0]} onChange={set("practice_area")}>{PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}</select></Field>
      <Field label="Assigned advocate"><input style={inputStyle} value={f.advocate || ""} onChange={set("advocate")} /></Field>
      <Field label="Opposing counsel"><input style={inputStyle} value={f.opposing_counsel || ""} onChange={set("opposing_counsel")} placeholder="Advocate representing the other side" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Status"><select style={inputStyle} value={f.status} onChange={set("status")}>{MATTER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field></div>
        <div style={{ flex: 1 }}><Field label="Priority"><select style={inputStyle} value={f.priority || "Normal"} onChange={set("priority")}>{PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field></div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Case number"><input style={inputStyle} value={f.case_number || ""} onChange={set("case_number")} placeholder="e.g. CS 123/2026" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Jurisdiction"><input style={inputStyle} value={f.jurisdiction || ""} onChange={set("jurisdiction")} /></Field></div>
      </div>
      <Field label="Court complex"><input style={inputStyle} value={f.court_complex || ""} onChange={set("court_complex")} placeholder="e.g. Madras High Court, Principal Bench" /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Filing date"><input type="date" style={inputStyle} value={f.filing_date || ""} onChange={set("filing_date")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Registration date"><input type="date" style={inputStyle} value={f.registration_date || ""} onChange={set("registration_date")} /></Field></div>
      </div>
      <Field label="Limitation date" error={undefined}>
        <input type="date" style={inputStyle} value={f.limitation_date || ""} onChange={set("limitation_date")} />
      </Field>
      <div style={{ fontSize: 11.5, color: "#8A8578", marginTop: -10, marginBottom: 14 }}>
        The deadline by which action must be taken to preserve the matter's rights. Shown on the Today Board once it approaches.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}><Field label="Next action"><input style={inputStyle} value={f.next_action || ""} onChange={set("next_action")} placeholder="What needs to happen next" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Due"><input type="date" style={inputStyle} value={f.next_action_due || ""} onChange={set("next_action_due")} /></Field></div>
      </div>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 70 }} value={f.notes || ""} onChange={set("notes")} /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save Matter"}</Btn>
      </div>
    </Modal>
  );
}

function HearingForm({ record, prefill, matters, error, onClose, onSave, onAddMatterFirst }) {
  const [f, setF] = useState(record || { matter_id: prefill?.matter_id || "", hearing_date: todayISO(), court: COURTS[0], notes: "", outcome: "Scheduled", order_notes: "" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const validate = () => {
    const e = {};
    if (!f.matter_id) e.matter_id = "Matter is required";
    if (!f.hearing_date) e.hearing_date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  if (matters.length === 0) {
    return (
      <Modal title="Schedule hearing" onClose={onClose}>
        <div style={{ textAlign: "center", padding: "16px 4px 8px" }}>
          <Gavel size={26} strokeWidth={1.3} style={{ opacity: 0.5, marginBottom: 10, color: "#8A8578" }} />
          <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 16, color: "#4A4438", marginBottom: 6 }}>No matters on file yet</div>
          <div style={{ fontSize: 13.5, color: "#8A8578", marginBottom: 20 }}>A hearing has to be linked to a real matter. Open one first, then come back to schedule the hearing.</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
            <Btn onClick={onAddMatterFirst}><Plus size={15} /> Open a matter</Btn>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={record ? "Edit hearing" : "Schedule hearing"} onClose={onClose}>
      <FormError error={error} />
      <Field label="Matter *" error={errors.matter_id}>
        <select style={{ ...inputStyle, borderColor: errors.matter_id ? "#6B2737" : "#D9D2C2" }} value={f.matter_id || ""} onChange={set("matter_id")}>
          <option value="">— Select matter —</option>
          {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </Field>
      <Field label="Date *" error={errors.hearing_date}><input type="date" style={{ ...inputStyle, borderColor: errors.hearing_date ? "#6B2737" : "#D9D2C2" }} value={f.hearing_date} onChange={set("hearing_date")} /></Field>
      <Field label="Court / forum"><select style={inputStyle} value={f.court || COURTS[0]} onChange={set("court")}>{COURTS.map((c) => <option key={c} value={c}>{c}</option>)}</select></Field>
      <Field label="Prep notes"><textarea style={{ ...inputStyle, minHeight: 60 }} value={f.notes || ""} onChange={set("notes")} placeholder="What to prepare / bring before the hearing" /></Field>
      <Field label="Outcome">
        <select style={inputStyle} value={f.outcome || "Scheduled"} onChange={set("outcome")}>
          {HEARING_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
      <Field label="Order / what happened">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={f.order_notes || ""} onChange={set("order_notes")} placeholder="Order passed, next steps, next hearing expectations..." />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>

        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={() => validate() && onSave(f, !!record)}>Save Hearing</Btn>
      </div>
    </Modal>
  );
}

function BillingForm({ record, matters, error, onClose, onSave }) {
  const initialLabel = record ? (record.matter_id ? (matters.find((m) => m.id === record.matter_id)?.title || record.matter_label) : record.matter_label) : "";
  const [f, setF] = useState(record ? { ...record, matter_label: initialLabel } : { matter_id: "", matter_label: "", description: "", amount: "", currency: "AED", invoice_date: todayISO(), status: "Draft" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const handleMatterChange = (e) => {
    const val = e.target.value;
    const match = matters.find((m) => m.title.toLowerCase() === val.toLowerCase());
    setF({ ...f, matter_label: val, matter_id: match ? match.id : null });
  };

  const validate = () => {
    const e = {};
    if (!f.matter_label || !f.matter_label.trim()) e.matter_label = "Matter is required";
    if (!f.amount || Number(f.amount) <= 0) e.amount = "Valid amount is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...f, amount: Number(f.amount) };
    if (!payload.matter_id) payload.matter_id = null; // store real null, not empty string, for the FK column
    onSave(payload, !!record);
  };

  return (
    <Modal title={record ? "Edit invoice" : "Create invoice"} onClose={onClose}>
      <FormError error={error} />
      <Field label="Matter *" error={errors.matter_label}>
        <input list="billing-matters-list" style={{ ...inputStyle, borderColor: errors.matter_label ? "#6B2737" : "#D9D2C2" }} value={f.matter_label} onChange={handleMatterChange} onFocus={(e) => e.target.select()} placeholder="Pick an existing matter or type a new one" autoFocus />
        <datalist id="billing-matters-list">{matters.map((m) => <option key={m.id} value={m.title} />)}</datalist>
      </Field>
      <Field label="Description"><input style={inputStyle} value={f.description || ""} onChange={set("description")} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 2 }}><Field label="Amount *" error={errors.amount}><input type="number" style={{ ...inputStyle, borderColor: errors.amount ? "#6B2737" : "#D9D2C2" }} value={f.amount} onChange={set("amount")} placeholder="0.00" min="0" step="0.01" /></Field></div>
        <div style={{ flex: 1 }}><Field label="Currency"><select style={inputStyle} value={f.currency} onChange={set("currency")}><option>AED</option><option>INR</option><option>USD</option><option>EUR</option><option>GBP</option></select></Field></div>
      </div>
      <Field label="Date"><input type="date" style={inputStyle} value={f.invoice_date} onChange={set("invoice_date")} /></Field>
      <Field label="Status"><select style={inputStyle} value={f.status} onChange={set("status")}>{BILL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit}>Save Invoice</Btn>
      </div>
    </Modal>
  );
}

const TASK_STATUSES = ["Open", "In Progress", "Completed", "Cancelled"];

function TaskForm({ record, prefill, matters, error, onClose, onSave }) {
  const [f, setF] = useState(record || { matter_id: prefill?.matter_id || "", title: prefill?.title || "", description: prefill?.description || "", due_date: prefill?.due_date || "", status: "Open", priority: "Normal" });
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const validate = () => {
    const e = {};
    if (!f.matter_id) e.matter_id = "Matter is required";
    if (!f.title || !f.title.trim()) e.title = "Task title is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...f };
    if (!payload.due_date) payload.due_date = null;
    onSave(payload, !!record);
  };

  return (
    <Modal title={record ? "Edit task" : "Add task"} onClose={onClose}>
      <FormError error={error} />
      <Field label="Matter *" error={errors.matter_id}>
        <select style={{ ...inputStyle, borderColor: errors.matter_id ? "#6B2737" : "#D9D2C2" }} value={f.matter_id || ""} onChange={set("matter_id")}>
          <option value="">— Select matter —</option>
          {matters.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
        </select>
      </Field>
      <Field label="Task *" error={errors.title}><input style={{ ...inputStyle, borderColor: errors.title ? "#6B2737" : "#D9D2C2" }} value={f.title} onChange={set("title")} autoFocus placeholder="e.g. Draft written statement" /></Field>
      <Field label="Description"><textarea style={{ ...inputStyle, minHeight: 60 }} value={f.description || ""} onChange={set("description")} /></Field>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><Field label="Due date"><input type="date" style={inputStyle} value={f.due_date || ""} onChange={set("due_date")} /></Field></div>
        <div style={{ flex: 1 }}><Field label="Priority"><select style={inputStyle} value={f.priority || "Normal"} onChange={set("priority")}>{PRIORITY_LEVELS.map((p) => <option key={p} value={p}>{p}</option>)}</select></Field></div>
      </div>
      <Field label="Status"><select style={inputStyle} value={f.status || "Open"} onChange={set("status")}>{TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSubmit}>Save Task</Btn>
      </div>
    </Modal>
  );
}

function InvoiceModal({ billing, party, firm, firmLoaded, onSaveFirm, onClose }) {
  const [editingFirm, setEditingFirm] = useState(false);
  const [f, setF] = useState(firm);
  useEffect(() => { setF(firm); }, [firm]);

  const invoiceNo = `INV-${billing.id.slice(0, 8).toUpperCase()}`;
  const needsFirstTimeSetup = firmLoaded && !firm.name && !firm.address;

  const saveFirmDetails = async () => {
    await onSaveFirm(f);
    setEditingFirm(false);
  };

  const handlePrint = () => {
    const html = buildInvoiceHtml({ firm, party, billing, invoiceNo });
    const win = window.open("", "_blank", "width=850,height=1000");
    if (!win) {
      alert("Please allow pop-ups for this site to open the invoice.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 350);
  };

  return (
    <Modal title={`Invoice ${invoiceNo}`} onClose={onClose}>
      {!firmLoaded ? (
        <div style={{ color: "#8A8578", fontSize: 13 }}>Loading firm details…</div>
      ) : editingFirm || needsFirstTimeSetup ? (
        <div>
          <div style={{ fontSize: 12.5, color: "#8A8578", marginBottom: 14 }}>
            Add your firm's letterhead details once — they'll appear on every invoice from now on.
          </div>
          <Field label="Firm / Advocate name">
            <input style={inputStyle} value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Mohamed Adil S, Advocate" autoFocus />
          </Field>
          <Field label="Address">
            <textarea style={{ ...inputStyle, minHeight: 60 }} value={f.address || ""} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="Chamber / office address" />
          </Field>
          <Field label="Email"><input style={inputStyle} value={f.email || ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><input style={inputStyle} value={f.phone || ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            {firm.name && <Btn variant="ghost" onClick={() => setEditingFirm(false)}>Cancel</Btn>}
            <Btn onClick={saveFirmDetails}>Save firm details</Btn>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ background: "#F7F5F0", border: "1px solid #E4DFD3", borderRadius: 6, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{firm.name}</div>
            <div style={{ fontSize: 12, color: "#8A8578", whiteSpace: "pre-line" }}>{firm.address}</div>
            <div style={{ fontSize: 12, color: "#8A8578" }}>{[firm.email, firm.phone].filter(Boolean).join("  ·  ")}</div>
            <div onClick={() => setEditingFirm(true)} style={{ fontSize: 11.5, color: "#6B2737", cursor: "pointer", marginTop: 6 }}>Edit firm details</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", color: "#8A8578", marginBottom: 4, letterSpacing: 0.4 }}>Bill To</div>
            <div style={{ fontWeight: 600 }}>{party.clientName || party.matterTitle}</div>
            {party.clientCompany && <div style={{ fontSize: 12.5, color: "#8A8578" }}>{party.clientCompany}</div>}
            {party.clientEmail && <div style={{ fontSize: 12.5, color: "#8A8578" }}>{party.clientEmail}</div>}
            {party.clientPhone && <div style={{ fontSize: 12.5, color: "#8A8578" }}>{party.clientPhone}</div>}
            <div style={{ fontSize: 12.5, color: "#8A8578", marginTop: 4 }}>Re: {party.matterTitle}</div>
          </div>

          <table style={{ width: "100%", marginBottom: 16, borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "10px 0", borderBottom: "1px solid #EFEBE1", fontSize: 13.5 }}>{billing.description || party.matterTitle}</td>
                <td style={{ padding: "10px 0", borderBottom: "1px solid #EFEBE1", textAlign: "right", fontFamily: "'IBM Plex Mono', monospace", fontSize: 13.5 }}>{fmtCurrency(billing.amount, billing.currency)}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={onClose}>Close</Btn>
            <Btn onClick={handlePrint}><Printer size={15} /> Print / Save as PDF</Btn>
          </div>
          <div style={{ fontSize: 11.5, color: "#8A8578", marginTop: 10, textAlign: "right" }}>
            In the print dialog, set destination to "Save as PDF," then attach the file to an email or WhatsApp message.
          </div>
        </div>
      )}
    </Modal>
  );
}
