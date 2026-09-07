/**
 * Central application configuration.
 *
 * `dataSource` is the single switch that decides where domain data comes from.
 * Flip it to REST (or set NEXT_PUBLIC_DATA_SOURCE=rest) and every repository
 * starts talking to the HTTP source instead of the bundled JSON — no component,
 * controller or store changes required.
 *
 * API calls default to same-origin `/api`, which Next rewrites to:
 * - local: http://localhost:4000
 * - production: https://g3q-backend.azurewebsites.net
 * Override with NEXT_PUBLIC_API_BASE_URL or BACKEND_ORIGIN as needed.
 */

import { resolveApiBaseUrl } from "@/config/backend-origin.mjs";
import { getActivePlatformWeek, PLATFORM_WEEKS } from "@/config/platformWeeks";

function parseBool(value, fallback = false) {
  if (value == null || String(value).trim() === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export const DATA_SOURCE = {
  JSON: "json",
  REST: "rest",
};

export const appConfig = {
  name: "ગુજરાત ક્વિઝ",
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE || DATA_SOURCE.REST,

  api: {
    baseUrl: resolveApiBaseUrl(),
    timeoutMs: 15000,
  },

  /**
   * Optional delay for local JSON auth calls. Quiz reads are sync (no delay).
   */
  json: {
    simulatedLatencyMs: 0,
  },

  auth: {
    // Mirrors backend OTP defaults for dev/test flows.
    staticOtp: "1234",
    otpLength: 4,
    resendSeconds: 30,
    phoneLength: 10,
  },

  beta: {
    isBetaTime: parseBool(process.env.NEXT_PUBLIC_IS_BETA_TIME, false),
  },

  storage: {
    namespace: "ggq",
    version: 1,
  },

  quiz: {
    // Whole-second granularity for the per-question timer.
    tickMs: 1000,
  },

  profile: {
    helpline: {
      phone: "18002335500",
      display: "1800 233 5500",
    },
  },

  certificate: {
    weeks: PLATFORM_WEEKS,
    currentWeek: getActivePlatformWeek(),
    week: getActivePlatformWeek().id,
  },
};
