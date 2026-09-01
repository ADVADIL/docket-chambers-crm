import { cleanPhoneNumber } from "../commTemplates";

const GATEWAY_STORAGE_KEY = "docket_chamber_whatsapp_gateway";

export const GATEWAY_PROVIDERS = [
  {
    id: "ultramsg",
    name: "UltraMsg (QR WhatsApp Web Gateway)",
    description: "Scan QR code with phone. Sends from your existing personal or chamber phone number.",
    fields: [
      { key: "instanceId", label: "Instance ID", placeholder: "e.g. instance12345" },
      { key: "token", label: "Token", placeholder: "e.g. 5x8d2..." }
    ]
  },
  {
    id: "whapi",
    name: "Whapi.cloud (QR / Cloud Gateway)",
    description: "QR-code or WhatsApp Web bridge for automated in-app messaging.",
    fields: [
      { key: "apiUrl", label: "API Base URL (optional)", placeholder: "https://gate.whapi.cloud/messages/text" },
      { key: "token", label: "API Token", placeholder: "Bearer token from Whapi" }
    ]
  },
  {
    id: "meta",
    name: "Meta Official WhatsApp Cloud API",
    description: "Official Meta Business API using Graph API.",
    fields: [
      { key: "phoneNumberId", label: "Phone Number ID", placeholder: "e.g. 105829102910..." },
      { key: "token", label: "Permanent Access Token", placeholder: "EAABw..." }
    ]
  },
  {
    id: "custom",
    name: "Custom Chambers Webhook / Server",
    description: "Self-hosted Baileys, WPPConnect, or internal law firm API.",
    fields: [
      { key: "apiUrl", label: "Webhook / API Endpoint", placeholder: "https://api.yourchambers.com/send-whatsapp" },
      { key: "token", label: "Auth Token / Secret (optional)", placeholder: "Chamber secret key" }
    ]
  }
];

export function getGatewayConfig() {
  try {
    const raw = localStorage.getItem(GATEWAY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.enabled !== false) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Failed to read WhatsApp gateway config:", e);
  }

  return {
    provider: "ultramsg",
    instanceId: "",
    token: "",
    phoneNumberId: "",
    apiUrl: "",
    enabled: false
  };
}

export function saveGatewayConfig(config) {
  try {
    localStorage.setItem(GATEWAY_STORAGE_KEY, JSON.stringify({ ...config, enabled: true }));
    return true;
  } catch (e) {
    console.error("Failed to save WhatsApp gateway config:", e);
    return false;
  }
}

export function clearGatewayConfig() {
  try {
    localStorage.removeItem(GATEWAY_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function isGatewayConfigured() {
  const cfg = getGatewayConfig();
  if (!cfg || !cfg.enabled) return false;
  if (cfg.provider === "ultramsg") return Boolean(cfg.instanceId && cfg.token);
  if (cfg.provider === "meta") return Boolean(cfg.phoneNumberId && cfg.token);
  if (cfg.provider === "whapi") return Boolean(cfg.token);
  if (cfg.provider === "custom") return Boolean(cfg.apiUrl);
  return false;
}

/**
 * Sends a WhatsApp message directly via the configured API gateway
 * completely inside the app (0 external redirects).
 */
export async function sendDirectWhatsApp({ to, message }) {
  const cfg = getGatewayConfig();
  if (!isGatewayConfigured()) {
    throw new Error("WhatsApp Gateway is not configured. Please set up your gateway credentials.");
  }

  const phone = cleanPhoneNumber(to);
  if (!phone) {
    throw new Error("Recipient phone number is invalid or missing.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let response;

    if (cfg.provider === "ultramsg") {
      const endpoint = `https://api.ultramsg.com/${cfg.instanceId.trim()}/messages/chat`;
      const bodyParams = new URLSearchParams({
        token: cfg.token.trim(),
        to: phone,
        body: message,
        priority: "10"
      });

      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams,
        signal: controller.signal
      });
    } else if (cfg.provider === "meta") {
      const endpoint = `https://graph.facebook.com/v20.0/${cfg.phoneNumberId.trim()}/messages`;
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfg.token.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: message }
        }),
        signal: controller.signal
      });
    } else if (cfg.provider === "whapi") {
      const endpoint = cfg.apiUrl?.trim() || "https://gate.whapi.cloud/messages/text";
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cfg.token.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: `${phone}@s.whatsapp.net`,
          body: message
        }),
        signal: controller.signal
      });
    } else if (cfg.provider === "custom") {
      const endpoint = cfg.apiUrl.trim();
      const headers = { "Content-Type": "application/json" };
      if (cfg.token) headers["Authorization"] = `Bearer ${cfg.token.trim()}`;

      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ to: phone, message }),
        signal: controller.signal
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Gateway responded with HTTP ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
      } catch {
        if (errorText) errorMsg += `: ${errorText.slice(0, 100)}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json().catch(() => ({}));
    return {
      success: true,
      provider: cfg.provider,
      recipient: phone,
      timestamp: new Date().toISOString(),
      details: data
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("WhatsApp gateway timed out after 15s. Please check network and gateway status.");
    }
    throw err;
  }
}
