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

export const DATA_SOURCE = {
  JSON: "json",
  REST: "rest",
};

export const appConfig = {
  name: "ગુજરાત ક્વિઝ",
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE || DATA_SOURCE.JSON,

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
    // Static OTP for the MVP. The real flow will verify server-side.
    staticOtp: "123456",
    otpLength: 6,
    resendSeconds: 30,
    phoneLength: 10,
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
    week: Number(process.env.NEXT_PUBLIC_G3Q_WEEK || 5),
  },
};
