import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, Briefcase, Gavel, Receipt, Plus, Search, 
  LayoutDashboard, CalendarDays, Clock, Cloud, CloudOff, Printer,
  MessageSquare, Send, Radio, LogOut, UserCheck, ExternalLink
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { SEED_DATA } from "./constants";
import { toAppRecord, toDbRecord, daysUntil } from "./utils";
import { Btn, inputStyle } from "./components/UI";
import Dashboard from "./components/Dashboard";
import { ClientsTable, MattersTable, HearingsTable, BillingTable } from "./components/Tables";
import CalendarView from "./components/CalendarView";
import { ClientForm, MatterForm, HearingForm, BillingForm } from "./components/Forms";
import ChamberConfigModal from "./components/ChamberConfigModal";
import ClientCommModal from "./components/ClientCommModal";
import WhatsAppConfigModal from "./components/WhatsAppConfigModal";
import { isGatewayConfigured } from "./lib/whatsappGateway";
import Auth from "./components/Auth";
import DeadlinesTracker from "./components/DeadlinesTracker";
import SpotlightSearch from "./components/SpotlightSearch";
import InvoicePrintModal from "./components/InvoicePrintModal";

function useUniversalCollection(tableName, refreshTrigger) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [isCloud, setIsCloud] = useState(false);

  const fetchItems = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      setIsCloud(true);
      try {
        const { data, error } = await supabase.from(tableName).select("*");
        if (error) throw error;
        setItems((data || []).map((row) => toAppRecord(tableName, row)));
        setLoaded(true);
        return;
      } catch (err) {
        console.warn(`Supabase read error on ${tableName}, falling back to local:`, err);
      }
    }

    setIsCloud(false);
    try {
      const localKey = `docket_local_${tableName}`;
      const raw = localStorage.getItem(localKey);
      if (raw) {
        setItems(JSON.parse(raw));
      } else {
        const fallback = SEED_DATA[tableName] || [];
        setItems(fallback);
        localStorage.setItem(localKey, JSON.stringify(fallback));
      }
    } catch {
      setItems(SEED_DATA[tableName] || []);
    } finally {
      setLoaded(true);
    }
  }, [tableName]);

  // Guaranteed timeout fallback so app never hangs on slow or blocked connections
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchItems();

    const supabase = getSupabaseClient();
    if (supabase) {
      const channel = supabase
        .channel(`realtime:${tableName}`)
        .on("postgres_changes", { event: "*", schema: "public", table: tableName }, () => {
          fetchItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tableName, refreshTrigger, fetchItems]);

  const upsert = useCallback(async (record) => {
    const supabase = getSupabaseClient();
    const appRec = toAppRecord(tableName, record);
    
    setItems((prev) => {
      const exists = prev.some((i) => i.id === appRec.id);
      return exists ? prev.map((i) => (i.id === appRec.id ? appRec : i)) : [appRec, ...prev];
    });

    if (supabase) {
      try {
        const dbRec = toDbRecord(tableName, appRec);
        const { error } = await supabase.from(tableName).upsert(dbRec);
        if (error) throw error;
        return;
      } catch (err) {
        console.error(`Supabase upsert error on ${tableName}:`, err);
      }
    }

    try {
      const localKey = `docket_local_${tableName}`;
      const current = JSON.parse(localStorage.getItem(localKey) || "[]");
      const next = current.some((i) => i.id === appRec.id)
        ? current.map((i) => (i.id === appRec.id ? appRec : i))
        : [appRec, ...current];
      localStorage.setItem(localKey, JSON.stringify(next));
    } catch (e) {
      console.error("Local persist failed:", e);
    }
  }, [tableName]);

  const remove = useCallback(async (id) => {
    const supabase = getSupabaseClient();
    setItems((prev) => prev.filter((i) => i.id !== id));

    if (supabase) {
      try {
        const { error } = await supabase.from(tableName).delete().eq("id", id);
        if (error) throw error;
        return;
      } catch (err) {
        console.error(`Supabase delete error on ${tableName}:`, err);
      }
    }

    try {
      const localKey = `docket_local_${tableName}`;
      const current = JSON.parse(localStorage.getItem(localKey) || "[]");
      localStorage.setItem(localKey, JSON.stringify(current.filter((i) => i.id !== id)));
    } catch (e) {
      console.error("Local delete failed:", e);
    }
  }, [tableName]);

  return { items, loaded, isCloud, upsert, remove, refetch: fetchItems };
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerReload = () => setRefreshKey((k) => k + 1);

  const clientsC = useUniversalCollection("clients", refreshKey);
  const mattersC = useUniversalCollection("matters", refreshKey);
  const hearingsC = useUniversalCollection("hearings", refreshKey);
  const billingC = useUniversalCollection("billing", refreshKey);

  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [commModal, setCommModal] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWhatsAppConfigModal, setShowWhatsAppConfigModal] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [invoicePrintModal, setInvoicePrintModal] = useState(null);
  const [calendarView, setCalendarView] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isConnected = isSupabaseConfigured();
  const hasWhatsAppGateway = isGatewayConfigured();

  // Global Ctrl+K / Cmd+K Spotlight Search Shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSpotlight((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) setSession(data.session);
      }).catch(() => {});

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });

      return () => {
        if (subscription?.unsubscribe) subscription.unsubscribe();
      };
    } catch (e) {}
  }, [refreshKey]);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setOfflineBypass(false);
  };

  const clientName = useCallback((id) => {
    const client = clientsC.items.find((c) => c.id === id);
    return client ? client.name : "Unassigned";
  }, [clientsC.items]);

  const matterTitle = useCallback((id) => {
    const matter = mattersC.items.find((m) => m.id === id);
    return matter ? matter.title : "—";
  }, [mattersC.items]);

  const closeModal = () => setModal(null);

  const handleDelete = (collection, id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      collection.remove(id);
    }
  };

  const openHearingComm = (hearing) => {
    const matter = mattersC.items.find((m) => m.id === hearing.matterId);
    const client = matter ? clientsC.items.find((c) => c.id === matter.clientId) : null;
    setCommModal({
      type: "hearing_reminder",
      data: {
        date: hearing.date,
        court: hearing.court,
        notes: hearing.notes,
        outcome: hearing.outcome,
        matterTitle: matter ? matter.title : "",
        caseNumber: matter ? matter.caseNumber : "",
        advocate: matter ? matter.advocate : "",
        clientId: client ? client.id : "",
        clientName: client ? client.name : "",
        clientPhone: client ? client.phone : "",
        clientEmail: client ? client.email : "",
      }
    });
  };

  const openClientComm = (client) => {
    setCommModal({
      type: "custom_advisory",
      data: {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
      }
    });
  };

  const openMatterComm = (matter) => {
    const client = clientsC.items.find((c) => c.id === matter.clientId);
    setCommModal({
      type: "hearing_reminder",
      data: {
        matterTitle: matter.title,
        caseNumber: matter.caseNumber,
        advocate: matter.advocate,
        clientId: client ? client.id : "",
        clientName: client ? client.name : "",
        clientPhone: client ? client.phone : "",
        clientEmail: client ? client.email : "",
      }
    });
  };

  const openBillComm = (bill) => {
    const matter = mattersC.items.find((m) => m.id === bill.matterId);
    const client = matter ? clientsC.items.find((c) => c.id === matter.clientId) : null;
    setCommModal({
      type: "fee_reminder",
      data: {
        amount: bill.amount,
        currency: bill.currency,
        description: bill.description,
        date: bill.date,
        status: bill.status,
        matterTitle: matter ? matter.title : (bill.matterLabel || ""),
        advocate: matter ? matter.advocate : "",
        clientId: client ? client.id : "",
        clientName: client ? client.name : "",
        clientPhone: client ? client.phone : "",
        clientEmail: client ? client.email : "",
      }
    });
  };

  const openCauseListBroadcast = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaysHearings = hearingsC.items
      .filter((h) => h.date === today)
      .map((h) => ({
        ...h,
        matterTitle: matterTitle(h.matterId)
      }));

    const listToUse = todaysHearings.length > 0 ? todaysHearings : upcomingHearings.map(h => ({
      ...h,
      matterTitle: matterTitle(h.matterId)
    }));

    setCommModal({
      type: "cause_list_digest",
      data: {
        date: todaysHearings.length > 0 ? today : (listToUse[0]?.date || today),
        hearings: listToUse,
        advocate: "Chambers Registry"
      }
    });
  };

  const allLoaded = clientsC.loaded && mattersC.loaded && hearingsC.loaded && billingC.loaded;

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "clients", label: "Clients", icon: Users, count: clientsC.items.length },
    { key: "matters", label: "Matters", icon: Briefcase, count: mattersC.items.length },
    { key: "hearings", label: "Hearings", icon: Gavel, count: upcomingHearings.length },
    { key: "deadlines", label: "Deadlines", icon: Clock },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "billing", label: "Billing", icon: Receipt, count: billingC.items.length },
  ];

  const upcomingHearings = useMemo(() => {
    return hearingsC.items
      .filter((h) => daysUntil(h.date) !== null && daysUntil(h.date) >= 0)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 6);
  }, [hearingsC.items]);

  const overdueInvoices = useMemo(() => billingC.items.filter((b) => b.status === "Overdue"), [billingC.items]);
  const activeMatters = useMemo(() => mattersC.items.filter((m) => m.status !== "Closed"), [mattersC.items]);
  const totalRevenue = useMemo(() => {
    return billingC.items.filter((b) => b.status === "Paid").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  }, [billingC.items]);

  const printCauseList = () => {
    window.print();
  };

  const renderContent = () => {
    if (!allLoaded) {
      return (
        <div style={{ padding: 60, color: "#8A8578", fontSize: 14, textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignSelf: "center", alignItems: "center", gap: 12 }}>
            <Clock size={32} style={{ opacity: 0.6, animation: "spin 2s linear infinite" }} />
            <div>Synchronizing chamber registry...</div>
          </div>
        </div>
      );
    }

    switch (tab) {
      case "dashboard":
        return (
          <Dashboard
            clientsCount={clientsC.items.length}
            activeMatters={activeMatters}
            billing={billingC.items}
            upcomingHearings={upcomingHearings}
            overdueInvoices={overdueInvoices}
            totalRevenue={totalRevenue}
            matterTitle={matterTitle}
            goto={setTab}
          />
        );
      case "clients":
        return (
          <ClientsTable 
            items={clientsC.items} 
            search={search} 
            onEdit={(r) => setModal({ type: "clients", record: r })} 
            onDelete={(id) => handleDelete(clientsC, id)} 
            onComm={openClientComm}
          />
        );
      case "matters":
        return (
          <MattersTable 
            items={mattersC.items} 
            search={search} 
            clientName={clientName} 
            onEdit={(r) => setModal({ type: "matters", record: r })} 
            onDelete={(id) => handleDelete(mattersC, id)} 
            onComm={openMatterComm}
          />
        );
      case "hearings":
        return (
          <HearingsTable 
            items={hearingsC.items} 
            search={search} 
            matterTitle={matterTitle} 
            onEdit={(r) => setModal({ type: "hearings", record: r })} 
            onDelete={(id) => handleDelete(hearingsC, id)} 
            onPrint={printCauseList} 
            onComm={openHearingComm}
          />
        );
      case "deadlines":
        return (
          <DeadlinesTracker
            matters={mattersC.items}
            onOpenMatter={(id) => {
              const m = mattersC.items.find((x) => x.id === id);
              if (m) setModal({ type: "matters", record: m });
            }}
            onAddDeadline={() => setModal({ type: "matters" })}
          />
        );
      case "calendar":
        return (
          <CalendarView 
            hearings={hearingsC.items} 
            matterTitle={matterTitle} 
            calendarView={calendarView} 
            setCalendarView={setCalendarView} 
            onEdit={(r) => setModal({ type: "hearings", record: r })} 
          />
        );
      case "billing":
        return (
          <BillingTable 
            items={billingC.items} 
            search={search} 
            matterTitle={matterTitle} 
            onEdit={(r) => setModal({ type: "billing", record: r })} 
            onDelete={(id) => handleDelete(billingC, id)} 
            onComm={openBillComm}
            onPrintInvoice={(b) => setInvoicePrintModal(b)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", display: "flex", minHeight: "100vh", background: "#F7F5F0", color: "#22262B" }}>
      <style>{`
        * { box-sizing: border-box; }
        table { border-collapse: collapse; width: 100%; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #8A8578; font-weight: 600; padding: 10px 14px; border-bottom: 1px solid #E4DFD3; }
        td { padding: 12px 14px; font-size: 13.5px; border-bottom: 1px solid #EFEBE1; vertical-align: middle; }
        tr:hover td { background: #FBF9F4; }
        .rowbtn { opacity: 0; transition: opacity .12s; }
        tr:hover .rowbtn { opacity: 1; }
        @keyframes modalSlide { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #EFEBE1; }
        ::-webkit-scrollbar-thumb { background: #B08D57; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #8A6D3B; }
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div style={{ width: 230, background: "linear-gradient(180deg, #1C2333 0%, #242B3D 100%)", color: "#E8E4D8", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "22px 18px", borderBottom: "1px solid #2C3450" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg, #B08D57 0%, #6B2737 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
              <Gavel size={18} color="#F7F5F0" />
            </div>
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 20, fontWeight: 600, color: "#F7F5F0", letterSpacing: -0.2 }}>Docket</div>
              <div style={{ fontSize: 9.5, color: "#8A93B0", letterSpacing: 0.8, fontWeight: 600 }}>CHAMBERS MANAGER</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {nav.map((n) => {
            const active = tab === n.key;
            return (
              <div
                key={n.key}
                onClick={() => setTab(n.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 3,
                  borderRadius: 6, cursor: "pointer", fontSize: 13.5,
                  background: active ? "#F7F5F0" : "transparent",
                  color: active ? "#1C2333" : "#B5B0A4",
                  fontWeight: active ? 600 : 500,
                  transition: "all 0.15s",
                  borderLeft: active ? "3px solid #B08D57" : "3px solid transparent",
                }}
                onMouseEnter={(e) => !active && (e.currentTarget.style.background = "rgba(247,245,240,0.08)")}
                onMouseLeave={(e) => !active && (e.currentTarget.style.background = "transparent")}
              >
                <n.icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ flex: 1 }}>{n.label}</span>
                {typeof n.count === "number" && (
                  <span style={{
                    fontSize: 11, fontFamily: "'IBM Plex Mono', monospace",
                    color: active ? "#6B2737" : "#8A93B0",
                    background: active ? "rgba(176,141,87,0.2)" : "rgba(138,147,176,0.12)",
                    padding: "1px 6px", borderRadius: 10,
                  }}>{n.count}</span>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: "14px", borderTop: "1px solid #2C3450", background: "rgba(0,0,0,0.15)" }}>
          <div 
            onClick={() => setShowConfigModal(true)}
            style={{
              padding: "10px 12px", borderRadius: 6, cursor: "pointer",
              background: isConnected ? "rgba(61, 90, 76, 0.25)" : "rgba(176, 141, 87, 0.15)",
              border: `1px solid ${isConnected ? "#3D5A4C" : "#B08D57"}44`,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = isConnected ? "rgba(61, 90, 76, 0.35)" : "rgba(176, 141, 87, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = isConnected ? "rgba(61, 90, 76, 0.25)" : "rgba(176, 141, 87, 0.15)")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: isConnected ? "#7DD3A7" : "#E8D5B5", display: "flex", alignItems: "center", gap: 5 }}>
                {isConnected ? <Cloud size={13} /> : <CloudOff size={13} />}
                {isConnected ? "Firm Cloud Sync" : "Local Chamber"}
              </span>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: isConnected ? "#48C78E" : "#B08D57" }} />
            </div>
            <div style={{ fontSize: 10, color: "#8A93B0" }}>
              {isConnected ? "Real-time sync across laptops" : "Click to connect Supabase"}
            </div>
          </div>

          <div 
            onClick={() => setShowWhatsAppConfigModal(true)}
            style={{
              marginTop: 8,
              padding: "10px 12px", borderRadius: 6, cursor: "pointer",
              background: hasWhatsAppGateway ? "rgba(37, 211, 102, 0.18)" : "rgba(176, 141, 87, 0.15)",
              border: `1px solid ${hasWhatsAppGateway ? "#25D366" : "#B08D57"}44`,
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = hasWhatsAppGateway ? "rgba(37, 211, 102, 0.28)" : "rgba(176, 141, 87, 0.25)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = hasWhatsAppGateway ? "rgba(37, 211, 102, 0.18)" : "rgba(176, 141, 87, 0.15)")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: hasWhatsAppGateway ? "#7DD3A7" : "#E8D5B5", display: "flex", alignItems: "center", gap: 5 }}>
                <MessageSquare size={13} />
                {hasWhatsAppGateway ? "WhatsApp In-App" : "WhatsApp Web Link"}
              </span>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: hasWhatsAppGateway ? "#48C78E" : "#B08D57" }} />
            </div>
            <div style={{ fontSize: 10, color: "#8A93B0" }}>
              {hasWhatsAppGateway ? "Direct in-app sending active" : "Click to enable direct send"}
            </div>
          </div>

          <a
            href="https://web.whatsapp.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 6,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(37, 211, 102, 0.12)",
              border: "1px solid rgba(37, 211, 102, 0.35)",
              color: "#F7F5F0",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37, 211, 102, 0.22)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(37, 211, 102, 0.12)")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MessageSquare size={13} color="#25D366" />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#25D366" }}>Open WhatsApp Web</span>
            </div>
            <ExternalLink size={12} color="#25D366" />
          </a>

          {session?.user ? (
            <div style={{
              marginTop: 10,
              padding: "10px 12px",
              borderRadius: 6,
              background: "rgba(0,0,0,0.3)",
              border: "1px solid #2C3450",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ overflow: "hidden", marginRight: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#F7F5F0", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                  {session.user.email}
                </div>
                <div style={{ fontSize: 9.5, color: "#7DD3A7", display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                  <UserCheck size={11} /> Authenticated Counsel
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign Out of Chambers"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8A93B0", padding: 4, display: "flex", alignItems: "center", borderRadius: 4 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FFCDD2")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8A93B0")}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div style={{
              marginTop: 10,
              padding: "8px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid #2C3450",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ fontSize: 10.5, color: "#E8D5B5" }}>Chambers Workspace</div>
              <button
                onClick={() => setShowAuthModal(true)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#B08D57", fontSize: 10.5, fontWeight: 600, textDecoration: "underline" }}
              >
                Counsel Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "18px 32px 0", background: "#FCFAF6", borderBottom: "1px solid #E4DFD3" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, color: "#22262B", fontWeight: 600 }}>
                {nav.find((n) => n.key === tab)?.label}
              </div>
              <div style={{ fontSize: 12.5, color: "#8A8578", marginTop: 2 }}>
                {tab === "dashboard" && "Chambers practice health, court listings, and real-time realization"}
                {tab === "clients" && "Client retainers, companies, and direct contact details"}
                {tab === "matters" && "Case records, assigned advocates, and procedural stages"}
                {tab === "hearings" && "Daily cause list, court benches, and hearing agenda"}
                {tab === "deadlines" && "Statutory limitation periods, appeal cutoffs, and mandatory filing dates"}
                {tab === "calendar" && "Monthly court hearings diary and deadlines"}
                {tab === "billing" && "Professional fee notes, invoices, and payment tracking"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {/* Universal Spotlight Search Trigger */}
              <button
                onClick={() => setShowSpotlight(true)}
                title="Universal search across all cases, clients, and fee notes (Ctrl+K)"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #D9D2C2",
                  borderRadius: 6,
                  padding: "6px 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  color: "#6B6255",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                }}
              >
                <Search size={13} color="#B08D57" />
                <span>Spotlight</span>
                <span style={{ background: "#F4F0E8", border: "1px solid #E4DFD3", padding: "1px 5px", borderRadius: 3, fontSize: 10, fontWeight: 700, color: "#8A8578" }}>Ctrl K</span>
              </button>

              {tab !== "dashboard" && tab !== "calendar" && tab !== "deadlines" && (
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "#8A8578" }} />
                  <input placeholder="Filter table..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, width: 170, paddingLeft: 30 }} />
                </div>
              )}
              {tab === "hearings" && (
                <>
                  <Btn variant="ghost" onClick={openCauseListBroadcast} title="Broadcast Daily Cause List (WhatsApp / Email)">
                    <Send size={14} /> Broadcast Cause List
                  </Btn>
                  <Btn variant="ghost" onClick={printCauseList} title="Print Daily Cause List">
                    <Printer size={14} /> Print Cause List
                  </Btn>
                </>
              )}
              <Btn 
                variant="ghost" 
                onClick={() => setCommModal({ type: "custom_advisory", data: {} })} 
                title="Send Client Notice / Advisory via WhatsApp or Email"
              >
                <MessageSquare size={14} /> Notify Client
              </Btn>
              {tab !== "dashboard" && tab !== "calendar" && tab !== "deadlines" && (
                <Btn onClick={() => setModal({ type: tab, record: null })}><Plus size={15} /> Add {tab.slice(0, -1)}</Btn>
              )}
              {tab === "deadlines" && (
                <Btn onClick={() => setModal({ type: "matters", record: null })} style={{ background: "#6B2737", color: "#FFF" }}>
                  <Plus size={15} /> Log Deadline
                </Btn>
              )}
              {tab === "calendar" && (
                <Btn onClick={() => setModal({ type: "hearings", record: null })}><Plus size={15} /> Schedule Hearing</Btn>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: "24px 32px 40px", flex: 1, overflowY: "auto" }}>
          {renderContent()}
        </div>
      </div>

      {modal?.type === "clients" && <ClientForm record={modal.record} onClose={closeModal} onSave={(r) => { clientsC.upsert(r); closeModal(); }} />}
      {modal?.type === "matters" && <MatterForm record={modal.record} clients={clientsC.items} onClose={closeModal} onSave={(r) => { mattersC.upsert(r); closeModal(); }} />}
      {modal?.type === "hearings" && <HearingForm record={modal.record} matters={mattersC.items} onClose={closeModal} onSave={(r) => { hearingsC.upsert(r); closeModal(); }} />}
      {modal?.type === "billing" && <BillingForm record={modal.record} matters={mattersC.items} onClose={closeModal} onSave={(r) => { billingC.upsert(r); closeModal(); }} />}

      {commModal && (
        <ClientCommModal 
          initialType={commModal.type} 
          initialData={commModal.data} 
          clients={clientsC.items} 
          matters={mattersC.items} 
          onClose={() => setCommModal(null)} 
          onOpenGatewayConfig={() => setShowWhatsAppConfigModal(true)}
        />
      )}

      {showConfigModal && (
        <ChamberConfigModal 
          onClose={() => setShowConfigModal(false)} 
          onSaved={() => { triggerReload(); setShowConfigModal(false); }} 
        />
      )}

      {showWhatsAppConfigModal && (
        <WhatsAppConfigModal 
          onClose={() => setShowWhatsAppConfigModal(false)} 
          onSaved={() => { triggerReload(); setShowWhatsAppConfigModal(false); }} 
        />
      )}

      {/* Universal Chambers Spotlight Modal (Ctrl+K) */}
      <SpotlightSearch
        isOpen={showSpotlight}
        onClose={() => setShowSpotlight(false)}
        matters={mattersC.items}
        clients={clientsC.items}
        hearings={hearingsC.items}
        billing={billingC.items}
        onSelectResult={(collection, item) => {
          setShowSpotlight(false);
          setTab(collection);
          setModal({ type: collection, record: item });
        }}
      />

      {/* Formal Chambers Fee Note & Tax Invoice Generator */}
      {invoicePrintModal && (
        <InvoicePrintModal
          bill={invoicePrintModal}
          matter={mattersC.items.find((m) => m.id === invoicePrintModal.matterId)}
          client={clientsC.items.find((c) => {
            const m = mattersC.items.find((x) => x.id === invoicePrintModal.matterId);
            return m && c.id === m.clientId;
          })}
          onClose={() => setInvoicePrintModal(null)}
        />
      )}

      {/* Optional Counsel Authentication Modal */}
      {showAuthModal && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(28, 35, 51, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20
          }} 
          onClick={() => setShowAuthModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: 440 }}>
            <Auth onBypass={() => setShowAuthModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
