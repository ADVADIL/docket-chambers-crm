import { createClient } from "@supabase/supabase-js";

const STORAGE_CONFIG_KEY = "docket_chamber_supabase_config";

export function getStoredConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes("your-project-ref")) {
    return { url: envUrl, key: envKey, source: "env" };
  }

  try {
    const raw = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.key) {
        return { ...parsed, source: "local" };
      }
    }
  } catch (e) {
    console.warn("Failed to read stored Supabase config:", e);
  }

  return { url: "", key: "", source: "none" };
}

let cachedClient = null;
let lastUsedConfig = null;

export function getSupabaseClient() {
  const config = getStoredConfig();
  if (!config.url || !config.key) {
    cachedClient = null;
    lastUsedConfig = null;
    return null;
  }

  if (
    cachedClient &&
    lastUsedConfig &&
    lastUsedConfig.url === config.url &&
    lastUsedConfig.key === config.key
  ) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.key, {
      auth: { persistSession: true },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    lastUsedConfig = config;
    return cachedClient;
  } catch (err) {
    console.error("Error creating Supabase client instance:", err);
    return null;
  }
}

export function isSupabaseConfigured() {
  const config = getStoredConfig();
  return Boolean(config.url && config.key);
}

export function saveSupabaseConfig(url, key) {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
    cachedClient = null;
    lastUsedConfig = null;
    return true;
  } catch (e) {
    console.error("Failed to persist Supabase config to local storage:", e);
    return false;
  }
}

export function clearSupabaseConfig() {
  try {
    localStorage.removeItem(STORAGE_CONFIG_KEY);
    cachedClient = null;
    lastUsedConfig = null;
    return true;
  } catch (e) {
    return false;
  }
}

export async function testSupabaseConnection(url, key) {
  try {
    const client = createClient(url.trim(), key.trim());
    const { error } = await client.from("clients").select("id").limit(1);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || "Failed to establish connection to Supabase" };
  }
}