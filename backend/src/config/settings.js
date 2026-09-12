/**
 * App-level constants (not environment secrets).
 * Change these in code; keep DATABASE_URL / JWT / keys in `.env`.
 */

export const SETTINGS = {
  quiz: {
    questionCount: 15,
    expiryMinutes: 90,
    defaultLanguage: 'gu',
    // Kept for compatibility; allocation fills district/caste first, then general.
    personalizedMin: 4,
    personalizedMax: 5,
  },
  ai: {
    model: 'gemini-3.1-flash-lite',
    timeoutMs: 20000,
  },
  storage: {
    defaultContainer: 'g3q',
  },
  jwt: {
    defaultExpiry: '30d',
    defaultIssuer: 'gujarat-quiz',
  },
  otp: {
    /**
     * When true, send OTP via Cogent SMS API (IP must be whitelisted).
     * When false, OTP is stored/logged only — no SMS API call.
     */
    sendSms: false,
    smsApiUrl: 'https://services.gujgov.edu.in/api/g3q/mobile',
    /** Approved template text; `{otp}` is replaced with the code. */
    smsTextTemplate: 'Your G3Q login OTP is {otp}. Do not share it. Thank you - G3Q',
    /** Per-mobile limits (IP limits intentionally deferred). */
    rateLimit: {
      sendMaxPerWindow: 5,
      sendWindowMinutes: 15,
      sendMaxPerDay: 10,
      sendDayHours: 24,
      verifyMaxFailed: 5,
      verifyLockMinutes: 15,
    },
  },
};
