import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, Briefcase, Gavel, Receipt, Plus, Search, 
  LayoutDashboard, CalendarDays, Clock, Cloud, CloudOff, Printer,
  MessageSquare, Send, LogOut, UserCheck, ExternalLink, Landmark, UserPlus
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { SEED_DATA, COURTS, PRACTICE_AREAS, STATUTORY_DEADLINE_TYPES } from "./constants";
import { toAppRecord, toDbRecord, daysUntil, todayISO, printElement, uid } from "./utils";
import { Btn, inputStyle } from "./components/UI";
import Dashboard from "./components/Dashboard";
import { ClientsTable, MattersTable, HearingsTable, BillingTable, InquiriesTable } from "./components/Tables";
import CalendarView from "./components/CalendarView";
import { ClientForm, MatterForm, HearingForm, BillingForm, InquiryForm } from "./components/Forms";
import ChamberConfigModal from "./components/ChamberConfigModal";
import ClientCommModal from "./components/ClientCommModal";
import WhatsAppConfigModal from "./components/WhatsAppConfigModal";
import { isGatewayConfigured } from "./lib/whatsappGateway";
import Auth from "./components/Auth";
import DeadlinesTracker from "./components/DeadlinesTracker";
import SpotlightSearch from "./components/SpotlightSearch";
import InvoicePrintModal from "./components/InvoicePrintModal";
import ChambersProfileModal from "./components/ChambersProfileModal";
import MatterFile from "./components/MatterFile";
import HearingBriefModal from "./components/HearingBriefModal";
import ClientLedger from "./components/ClientLedger";
import ChambersLockScreen from "./components/ChambersLockScreen";

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
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn(`Unauthorized delete attempt on ${tableName} rejected.`);
          return;
        }
        const { error } = await supabase.from(tableName).delete().eq("id", id);
        if (error) throw error;
      } catch (err) {
        console.error(`Supabase delete error on ${tableName}:`, err);
        return;
      }
    }

    setItems((prev) => prev.filter((i) => i.id !== id));

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
  const inquiriesC = useUniversalCollection("inquiries", refreshKey);
  const profileC = useUniversalCollection("chambers_profile", refreshKey);
  const chambersProfile = profileC.items.find((p) => p.id === "main") || profileC.items[0];

  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [commModal, setCommModal] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showChambersProfileModal, setShowChambersProfileModal] = useState(false);
  const [showWhatsAppConfigModal, setShowWhatsAppConfigModal] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [invoicePrintModal, setInvoicePrintModal] = useState(null);
  const [calendarView, setCalendarView] = useState({ month: new Date().getMonth(), year: new Date().getFullYear() });

  const [matterFileId, setMatterFileId] = useState(null);
  const [clientLedgerId, setClientLedgerId] = useState(null);
  const [hearingBrief, setHearingBrief] = useState(null);
  const [locked, setLocked] = useState(false);

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
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
      if (!supabase) {
        setAuthLoading(false);
        return;
      }

      supabase.auth.getSession().then(({ data }) => {
        if (data?.session) setSession(data.session);
        setAuthLoading(false);
      }).catch(() => {
        setAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setAuthLoading(false);
      });

      const timer = setTimeout(() => setAuthLoading(false), 1200);

      return () => {
        clearTimeout(timer);
        if (subscription?.unsubscribe) subscription.unsubscribe();
      };
    } catch (e) {
      setAuthLoading(false);
    }
  }, [refreshKey]);

  // Idle-timeout chambers lock: after 15 minutes without interaction, lock the session
  // (client-side only — nothing is signed out, drafts stay exactly as they are).
  useEffect(() => {
    if (!session) return;
    const IDLE_MS = 15 * 60 * 1000;
    let timer = setTimeout(() => setLocked(true), IDLE_MS);
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), IDLE_MS);
    };
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, reset));
    return () => {
      clearTimeout(timer);
      events.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [session]);

  const handleUnlock = async (password) => {
    const supabase = getSupabaseClient();
    if (!supabase || !session?.user?.email) {
      // No cloud auth configured — nothing to verify against, so just resume.
      setLocked(false);
      return { success: true };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: session.user.email, password });
    if (error) return { success: false, error: error.message };
    setLocked(false);
    return { success: true };
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  };

  const handleSignOutFully = async () => {
    setLocked(false);
    await handleSignOut();
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

  const goToTab = (key) => {
    setMatterFileId(null);
    setClientLedgerId(null);
    setTab(key);
  };

  const handleDelete = (collection, id) => {
    if (!session) {
      alert("🔒 Counsel Authentication Required:\nYou must be signed in with verified chambers credentials to delete records.\n\nPlease sign in or register your counsel account.");
      setShowAuthModal(true);
      return;
    }
    if (window.confirm("Are you sure you want to delete this record from chambers registry?")) {
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

  const openInquiryComm = (inquiry) => {
    setCommModal({
      type: "custom_advisory",
      data: {
        clientId: "",
        clientName: inquiry.name,
        clientPhone: inquiry.phone,
        clientEmail: inquiry.email,
      }
    });
  };

  // Converts an inquiry into a real Client + Matter in one step, then marks
  // the inquiry as Converted and links it to the new matter. Opens the
  // matter form pre-filled so the advocate can confirm/complete details
  // (court, case number, practice area) before it's saved.
  const convertInquiryToMatter = async (inquiry) => {
    if (!session && isConnected) {
      alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to convert an inquiry.");
      setShowAuthModal(true);
      return;
    }

    let clientId = "";
    const existingClient = clientsC.items.find(
      (c) => (inquiry.email && c.email && c.email.toLowerCase() === inquiry.email.toLowerCase())
        || (inquiry.phone && c.phone && c.phone === inquiry.phone)
    );

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const newClient = {
        id: uid(),
        name: inquiry.name,
        company: "",
        email: inquiry.email || "",
        phone: inquiry.phone || "",
        notes: `Converted from inquiry logged ${todayISO()}.`,
      };
      await clientsC.upsert(newClient);
      clientId = newClient.id;
    }

    await inquiriesC.upsert({ ...inquiry, status: "Converted" });
    triggerReload();

    setModal({
      type: "matters",
      record: {
        id: uid(),
        title: inquiry.subject ? `${inquiry.name} — ${inquiry.subject}` : inquiry.name,
        clientId,
        caseNumber: "",
        court: COURTS[0] || "",
        practiceArea: inquiry.practiceArea || PRACTICE_AREAS[0],
        advocate: "",
        status: "Intake",
        filingDate: todayISO(),
        deadlineDate: "",
        deadlineType: STATUTORY_DEADLINE_TYPES[0],
        deadlineNotes: "",
        notes: inquiry.notes || "",
        _fromInquiryId: inquiry.id,
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

  const openClientFeeReminder = (client, bill) => {
    const matter = bill ? mattersC.items.find((m) => m.id === bill.matterId) : null;
    setCommModal({
      type: "fee_reminder",
      data: {
        amount: bill?.amount || "",
        currency: bill?.currency || "AED",
        description: bill?.description || "Outstanding fee notes",
        date: bill?.date || "",
        status: bill?.status || "",
        matterTitle: matter ? matter.title : "",
        advocate: matter ? matter.advocate : "",
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
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

  const allLoaded = clientsC.loaded && mattersC.loaded && hearingsC.loaded && billingC.loaded && inquiriesC.loaded;

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

  const openInquiries = useMemo(() => inquiriesC.items.filter((i) => i.status !== "Converted" && i.status !== "Declined" && i.status !== "Lost"), [inquiriesC.items]);

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "inquiries", label: "Inquiries", icon: UserPlus, count: openInquiries.length },
    { key: "clients", label: "Clients", icon: Users, count: clientsC.items.length },
    { key: "matters", label: "Matters", icon: Briefcase, count: mattersC.items.length },
    { key: "hearings", label: "Hearings", icon: Gavel, count: upcomingHearings.length },
    { key: "deadlines", label: "Deadlines", icon: Clock },
    { key: "calendar", label: "Calendar", icon: CalendarDays },
    { key: "billing", label: "Billing", icon: Receipt, count: overdueInvoices.length },
  ];

  const printCauseList = () => {
    printElement("cause-list-printable-sheet", "Daily_Cause_List");
  };

  const printBillingReport = () => {
    printElement("billing-printable-sheet", "Chambers_Billing_Statement");
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

    if (matterFileId) {
      const m = mattersC.items.find((x) => x.id === matterFileId);
      if (!m) { setMatterFileId(null); return null; }
      return (
        <MatterFile
          matter={m}
          client={clientsC.items.find((c) => c.id === m.clientId)}
          hearings={hearingsC.items}
          billing={billingC.items}
          onBack={() => setMatterFileId(null)}
          onEdit={(record) => setModal({ type: "matters", record })}
          onComm={openMatterComm}
          onPrint={() => printElement("matter-file-printable", `Matter_${(m.caseNumber || m.title || "file").replace(/\s+/g, "_")}`)}
          onOpenHearingBrief={(h) => setHearingBrief(h)}
        />
      );
    }

    if (clientLedgerId) {
      const c = clientsC.items.find((x) => x.id === clientLedgerId);
      if (!c) { setClientLedgerId(null); return null; }
      return (
        <ClientLedger
          client={c}
          matters={mattersC.items}
          billing={billingC.items}
          onBack={() => setClientLedgerId(null)}
          onSendReminder={(client, bill) => openClientFeeReminder(client, bill)}
          onPrint={() => printElement("client-ledger-printable", `Statement_${(c.name || "client").replace(/\s+/g, "_")}`)}
          onNewFeeNote={() => setModal({ type: "billing", record: null })}
        />
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
            goto={goToTab}
          />
        );
      case "inquiries":
        return (
          <InquiriesTable
            items={inquiriesC.items}
            search={search}
            onEdit={(r) => setModal({ type: "inquiries", record: r })}
            onDelete={(id) => handleDelete(inquiriesC, id)}
            onComm={openInquiryComm}
            onConvert={convertInquiryToMatter}
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
            onOpenLedger={(c) => setClientLedgerId(c.id)}
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
            onOpenFile={(m) => setMatterFileId(m.id)}
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
            onOpenBrief={(h) => setHearingBrief(h)}
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
            matters={mattersC.items}
            matterTitle={matterTitle} 
            calendarView={calendarView} 
            setCalendarView={setCalendarView} 
            onEdit={(r) => setModal({ type: "hearings", record: r })}
            onOpenHearingBrief={(h) => setHearingBrief(h)}
            onBroadcastCauseList={openCauseListBroadcast}
            onPrintCauseList={printCauseList}
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


  // Confidential Chambers Lock: Block access completely until counsel signs in
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1C2333", color: "#F7F5F0", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg, #B08D57, #6B2737)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 15px rgba(0,0,0,0.25)" }}>
            <Gavel size={22} color="#FFF" />
          </div>
          <div style={{ color: "#E8D5B5", fontSize: 13.5, fontWeight: 500, letterSpacing: 0.3 }}>Verifying Chambers Authentication...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

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
          #printable-area, #printable-area *, #invoice-printable-sheet, #invoice-printable-sheet *, #cause-list-printable-sheet, #cause-list-printable-sheet *, #billing-printable-sheet, #billing-printable-sheet *, #matter-file-printable, #matter-file-printable *, #client-ledger-printable, #client-ledger-printable * { visibility: visible; }
          #invoice-printable-sheet, #cause-list-printable-sheet, #billing-printable-sheet, #printable-area, #matter-file-printable, #client-ledger-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print, .rowbtn { display: none !important; }
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
                onClick={() => goToTab(n.key)}
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
            onClick={() => setShowChambersProfileModal(true)}
            title="Edit chambers name, address, and bank details printed on invoices"
            style={{
              marginTop: 8,
              padding: "10px 12px", borderRadius: 6, cursor: "pointer",
              background: "rgba(138, 147, 176, 0.14)",
              border: "1px solid #8A93B044",
              transition: "all 0.15s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(138, 147, 176, 0.24)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(138, 147, 176, 0.14)")}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#E8D5B5", display: "flex", alignItems: "center", gap: 5 }}>
                <Landmark size={13} />
                Billing Profile
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#8A93B0" }}>
              Chambers name, address & bank details
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
                {tab === "inquiries" && "Prospective client inquiries, prior to intake as a formal matter"}
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
              {tab === "billing" && (
                <Btn variant="ghost" onClick={printBillingReport} title="Print Fee Notes & Invoices Statement">
                  <Printer size={14} /> Print Statement
                </Btn>
              )}
              <Btn 
                variant="ghost" 
                onClick={() => setCommModal({ type: "custom_advisory", data: {} })} 
                title="Send Client Notice / Advisory via WhatsApp or Email"
              >
                <MessageSquare size={14} /> Notify Client
              </Btn>
              {tab !== "dashboard" && tab !== "calendar" && tab !== "deadlines" && (
                <Btn onClick={() => setModal({ type: tab, record: null })}><Plus size={15} /> Add {tab === "inquiries" ? "Inquiry" : tab.slice(0, -1)}</Btn>
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

      {modal?.type === "inquiries" && (
        <InquiryForm
          record={modal.record}
          onClose={closeModal}
          onSave={(r) => {
            if (!session && isConnected) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to save or edit inquiries.");
              setShowAuthModal(true);
              return;
            }
            inquiriesC.upsert(r);
            closeModal();
          }}
        />
      )}

      {modal?.type === "clients" && (
        <ClientForm 
          record={modal.record} 
          onClose={closeModal} 
          onSave={(r) => { 
            if (!session) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to save or edit client records.");
              setShowAuthModal(true);
              return;
            }
            clientsC.upsert(r); 
            closeModal(); 
          }} 
        />
      )}
      {modal?.type === "matters" && (
        <MatterForm 
          record={modal.record} 
          clients={clientsC.items} 
          onClose={closeModal} 
          onSave={(r) => { 
            if (!session) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to save or edit legal matters.");
              setShowAuthModal(true);
              return;
            }
            const { _fromInquiryId, ...matterRecord } = r;
            mattersC.upsert(matterRecord);
            if (_fromInquiryId) {
              const inquiry = inquiriesC.items.find((i) => i.id === _fromInquiryId);
              if (inquiry) inquiriesC.upsert({ ...inquiry, status: "Converted", convertedMatterId: matterRecord.id });
            }
            closeModal(); 
          }} 
        />
      )}
      {modal?.type === "hearings" && (
        <HearingForm 
          record={modal.record} 
          matters={mattersC.items} 
          onClose={closeModal} 
          onSave={(r) => { 
            if (!session) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to schedule or modify hearings.");
              setShowAuthModal(true);
              return;
            }
            hearingsC.upsert(r); 
            closeModal(); 
          }} 
        />
      )}
      {modal?.type === "billing" && (
        <BillingForm 
          record={modal.record} 
          matters={mattersC.items} 
          onClose={closeModal} 
          onSave={(r) => { 
            if (!session) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to issue or edit fee notes.");
              setShowAuthModal(true);
              return;
            }
            billingC.upsert(r); 
            closeModal(); 
          }} 
        />
      )}

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

      {showChambersProfileModal && (
        <ChambersProfileModal
          profile={chambersProfile}
          onClose={() => setShowChambersProfileModal(false)}
          onSave={async (record) => {
            await profileC.upsert(record);
            triggerReload();
          }}
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
        inquiries={inquiriesC.items}
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
          profile={chambersProfile}
          onClose={() => setInvoicePrintModal(null)}
        />
      )}

      {/* Counsel Authentication Modal */}
      {showAuthModal && (
        <Auth 
          onClose={() => setShowAuthModal(false)} 
          onBypass={() => setShowAuthModal(false)} 
        />
      )}

      {/* Hearing Brief & Outcome Recorder */}
      {hearingBrief && (
        <HearingBriefModal
          hearing={hearingBrief}
          matter={mattersC.items.find((m) => m.id === hearingBrief.matterId)}
          onClose={() => setHearingBrief(null)}
          onSave={async (hearingPatch, { createNext }, { updateDeadline }, notify) => {
            if (!session) {
              alert("🔒 Counsel Authentication Required:\nPlease sign in with chambers credentials to record a hearing outcome.");
              setShowAuthModal(true);
              return;
            }
            const updated = { ...hearingBrief, ...hearingPatch };
            await hearingsC.upsert(updated);

            if (createNext?.date) {
              await hearingsC.upsert({
                id: uid(),
                matterId: hearingBrief.matterId,
                date: createNext.date,
                time: createNext.time || "",
                court: hearingBrief.court,
                notes: "",
                outcome: "Scheduled",
                orderNotes: "",
              });
            }

            const matter = mattersC.items.find((m) => m.id === hearingBrief.matterId);
            if (updateDeadline && matter) {
              await mattersC.upsert({ ...matter, ...updateDeadline });
            }

            if (notify && matter) {
              openMatterComm(matter);
            }
            triggerReload();
          }}
        />
      )}

      {/* Chambers Idle Lock */}
      {locked && (
        <ChambersLockScreen
          session={session}
          isConnected={isConnected}
          onUnlock={handleUnlock}
          onSignOutFully={handleSignOutFully}
        />
      )}
    </div>
  );
}
