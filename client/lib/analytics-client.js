import { appConfig } from "@/config/app.config";
import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

/** Compact anonymous visitor id (8–24 chars, alphanumeric). */
function shortVisitorKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`.slice(0, 16);
}

function apiUrl(path) {
  const base = (appConfig.api.baseUrl || "/api").replace(/\/$/, "");
  return `${base}${path}`;
}

function authHeaders() {
  const session = storage.get(STORAGE_KEYS.session, null);
  const token = session?.state?.token || session?.token || null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAnalyticsVisitorKey() {
  const existing = storage.get(STORAGE_KEYS.analyticsVisitor, null);
  const key = String(existing?.visitorKey || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 24);
  if (key.length >= 8) return key;
  const visitorKey = shortVisitorKey();
  storage.set(STORAGE_KEYS.analyticsVisitor, { visitorKey, createdAt: Date.now() });
  return visitorKey;
}

export function analyticsIdentity() {
  return {
    visitorKey: getAnalyticsVisitorKey(),
  };
}

export async function trackAnalyticsEvent(event) {
  try {
    await fetch(apiUrl("/v1/analytics/events"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        eventType: event.eventType,
        visitorKey: event.visitorKey || getAnalyticsVisitorKey(),
        occurredAt: event.occurredAt,
        metadata: event.metadata,
      }),
      keepalive: true,
    });
  } catch {
    // Never block product flows on telemetry delivery.
  }
}

export function analyticsRequestHeaders() {
  return {
    ...authHeaders(),
  };
}
