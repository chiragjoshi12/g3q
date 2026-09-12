/**
 * Central application configuration.
 *
 * `dataSource` is the single switch that decides where domain data comes from.
 * Flip it to REST (or set NEXT_PUBLIC_DATA_SOURCE=rest) and every repository
 * starts talking to the HTTP source instead of the bundled JSON — no component,
 * controller or store changes required.
 *
 * API routing (see `client/.env.example`):
 * - Set `BACKEND_ORIGIN` — Next rewrites `/api/*` to that Express host.
 * - Local default: http://localhost:4000
 * - Production: set the Azure App Service URL in Vercel env (or `.env.local`).
 * - Optional `NEXT_PUBLIC_API_BASE_URL` calls the backend directly (skips rewrite).
 */

import { resolveApiBaseUrl } from "@/config/backend-origin.mjs";
import { getActivePlatformWeek, PLATFORM_WEEKS } from "@/config/platformWeeks";

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
    resendSeconds: 0,
    mobileLength: 10,
    /** Must match backend CURRENT_CONSENT_VERSION. */
    consentVersion: "v1",
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
