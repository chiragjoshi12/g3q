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
};
