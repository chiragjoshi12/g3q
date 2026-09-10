import { getActivePlatformWeek, PLATFORM_WEEKS } from './platformWeeks.js';

const parseOrigins = () => {
  const fromList = (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const singles = [
    process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
    process.env.ADMIN_FRONTEND_DOMAIN || 'http://localhost:3001',
  ];
  return [...new Set([...fromList, ...singles])];
};

/** Env true/false (also accepts 1/0, yes/no, on/off). */
const parseBool = (value, fallback = false) => {
  if (value == null || String(value).trim() === '') return fallback;
  const v = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) return true;
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  return fallback;
};

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
  JWT_ISSUER: process.env.FRONTEND_DOMAIN_COOKIE || 'gujarat-quiz',

  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
  ADMIN_FRONTEND_DOMAIN: process.env.ADMIN_FRONTEND_DOMAIN || 'http://localhost:3001',
  FRONTEND_ORIGINS: parseOrigins(),
  // When true, reflect any Origin (needed for credentials; * is not allowed).
  CORS_ALLOW_ALL: parseBool(process.env.CORS_ALLOW_ALL, false),

  ADMIN: {
    USERNAME: process.env.ADMIN_USERNAME || 'admin',
    PASSWORD: process.env.ADMIN_PASSWORD || 'G3Q@Admin2026',
    FULL_NAME: process.env.ADMIN_FULL_NAME || 'G3Q Administrator',
    UNIVERSITY: process.env.ADMIN_UNIVERSITY || 'Gujarat Technological University',
    MOBILE_NUMBER: process.env.ADMIN_MOBILE_NUMBER || '9999999999',
  },

  OTP: {
    LENGTH: parseInt(process.env.OTP_LENGTH) || 4,
    EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    RESEND_SECONDS: parseInt(process.env.OTP_RESEND_SECONDS) || 30,
    // No SMS gateway wired up yet, so the OTP is logged server-side. This
    // fixed code is additionally accepted outside production so QA/dev can
    // log in without reading server logs — mirrors appConfig.auth.staticOtp
    // in the frontend's local JSON data source.
    DEV_BYPASS_CODE: process.env.OTP_DEV_BYPASS_CODE || '1234',
  },

  /**
   * Single switch for beta auth flow (no OTP registration page + /auth/beta/login).
   * Set IS_BETA_TIME=false to restore normal OTP login.
   */
  BETA: {
    ENABLED: parseBool(process.env.IS_BETA_TIME, false),
  },

  // Bank-backed quiz sessions (allocate from ACCEPTED bank_questions).
  QUIZ: {
    QUESTION_COUNT: parseInt(process.env.QUIZ_SESSION_QUESTION_COUNT) || 15,
    // Soft personalisation: target this many profile-tagged (district / caste) Qs.
    PERSONALIZED_MIN: parseInt(process.env.QUIZ_PERSONALIZED_MIN) || 4,
    PERSONALIZED_MAX: parseInt(process.env.QUIZ_PERSONALIZED_MAX) || 5,
    EXPIRY_MINUTES: parseInt(process.env.QUIZ_SESSION_EXPIRY_MINUTES) || 90,
    DEFAULT_LANGUAGE: process.env.QUIZ_DEFAULT_LANGUAGE || 'gu',
    WEEKS: PLATFORM_WEEKS,
    CURRENT_WEEK: getActivePlatformWeek().id,
    CURRENT_WEEK_META: getActivePlatformWeek(),
  },

  /** Gemini configuration used by G3Q AI chat and related features. */
  AI: {
    API_KEY: process.env.GEMINI_API_KEY || '',
    MODEL: 'gemini-3.1-flash-lite',
    TIMEOUT_MS: 20000,
  },

  STORAGE: {
    ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    CONTAINER: process.env.AZURE_STORAGE_CONTAINER || 'g3q',
    // Optional public origin override, e.g. https://g3qstorage.blob.core.windows.net
    // When empty, URLs use https://{ACCOUNT_NAME}.blob.core.windows.net
    PUBLIC_BASE_URL: String(process.env.AZURE_STORAGE_PUBLIC_BASE_URL || '').trim().replace(/\/+$/, ''),
  },
};
