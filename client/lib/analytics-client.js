import { appConfig } from "@/config/app.config";
import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

function randomId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
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
  if (existing?.visitorKey) return existing.visitorKey;
  const visitorKey = randomId("visitor");
  storage.set(STORAGE_KEYS.analyticsVisitor, { visitorKey, createdAt: Date.now() });
  return visitorKey;
}

export function createAnalyticsEventId(prefix = "evt") {
  return randomId(prefix);
}

export function analyticsIdentity(source) {
  return {
    visitorKey: getAnalyticsVisitorKey(),
    source,
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
        eventId: event.eventId || createAnalyticsEventId(event.eventType || "evt"),
        visitorKey: event.visitorKey || getAnalyticsVisitorKey(),
        ...event,
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
