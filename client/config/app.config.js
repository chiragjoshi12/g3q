/**
 * Central application configuration.
 *
 * `dataSource` is the single switch that decides where domain data comes from.
 * Flip it to REST (or set NEXT_PUBLIC_DATA_SOURCE=rest) and every repository
 * starts talking to the HTTP source instead of the bundled JSON — no component,
 * controller or store changes required.
 */

export const DATA_SOURCE = {
  JSON: "json",
  REST: "rest",
};

export const appConfig = {
  name: "ગુજરાત ક્વિઝ",
  dataSource: process.env.NEXT_PUBLIC_DATA_SOURCE || DATA_SOURCE.JSON,

  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
    timeoutMs: 15000,
  },

  /**
   * The JSON source resolves after a small delay on purpose. It forces the UI to
   * handle loading/error states from day one, so swapping in a real network call
   * later changes timing but never behaviour.
   */
  json: {
    simulatedLatencyMs: 320,
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
    week: Number(process.env.NEXT_PUBLIC_G3Q_WEEK || 1),
  },
};
