import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";

// ---------- Date / currency utilities ----------
export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const daysUntil = (d) => {
  if (!d) return null;
  return Math.ceil((new Date(d + "T00:00:00") - new Date(todayISO() + "T00:00:00")) / 86400000);
};

export const fmtCurrency = (amount, currency = "AED") => {
  const num = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(num);
  } catch {
    return `${currency} ${num.toLocaleString()}`;
  }
};

// Shared deadline-proximity badge used by the Matters table and the Today
// Board so a limitation date or next-action date reads the same way everywhere.
export function deadlineBadge(date) {
  if (!date) return null;
  const d = daysUntil(date);
  if (d < 0) return { text: `${Math.abs(d)}d overdue`, color: "#6B2737" };
  if (d === 0) return { text: "Due today", color: "#6B2737" };
  if (d === 1) return { text: "Due tomorrow", color: "#6B2737" };
  if (d <= 7) return { text: `${d}d left`, color: "#B08D57" };
  if (d <= 30) return { text: `${d}d left`, color: "#8A6D3B" };
  return { text: fmtDate(date), color: "#3D5A4C" };
}

// ---------- Supabase-backed table hook: initial fetch + realtime sync ----------
export function useTable(table) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [connError, setConnError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: true });
      if (!mounted) return;
      if (error) setConnError(error.message);
      else setItems(data || []);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === "INSERT") {
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          }
          if (payload.eventType === "UPDATE") {
            return prev.map((r) => (r.id === payload.new.id ? payload.new : r));
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((r) => r.id !== payload.old.id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [table]);

  return { items, loaded, connError };
}

// ---------- Read-only table hook (no INSERT/UPDATE/DELETE from the client) ----------
// Used for matter_audit_log, which is populated only by database triggers.
export function useReadOnlyTable(table, orderColumn = "created_at") {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [connError, setConnError] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase.from(table).select("*").order(orderColumn, { ascending: true });
      if (!mounted) return;
      if (error) setConnError(error.message);
      else setItems(data || []);
      setLoaded(true);
    })();

    const channel = supabase
      .channel(`realtime:${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === "INSERT") {
            if (prev.some((r) => r.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [table, orderColumn]);

  return { items, loaded, connError };
}

export async function insertRow(table, record) {
  const { data, error } = await supabase.from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}
export async function updateRow(table, id, patch) {
  const { data, error } = await supabase.from(table).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw error;
}
