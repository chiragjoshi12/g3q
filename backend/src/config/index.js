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

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '30d',
  JWT_ISSUER: process.env.FRONTEND_DOMAIN_COOKIE || 'gujarat-quiz',

  FRONTEND_DOMAIN: process.env.FRONTEND_DOMAIN || 'http://localhost:3000',
  ADMIN_FRONTEND_DOMAIN: process.env.ADMIN_FRONTEND_DOMAIN || 'http://localhost:3001',
  FRONTEND_ORIGINS: parseOrigins(),

  ADMIN: {
    USERNAME: process.env.ADMIN_USERNAME || 'admin',
    PASSWORD: process.env.ADMIN_PASSWORD || 'G3Q@Admin2026',
    FULL_NAME: process.env.ADMIN_FULL_NAME || 'G3Q Administrator',
    UNIVERSITY: process.env.ADMIN_UNIVERSITY || 'Gujarat Technological University',
    MOBILE_NUMBER: process.env.ADMIN_MOBILE_NUMBER || '9999999999',
  },

  OTP: {
    LENGTH: 6,
    EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
    RESEND_SECONDS: parseInt(process.env.OTP_RESEND_SECONDS) || 30,
    // No SMS gateway wired up yet, so the OTP is logged server-side. This
    // fixed code is additionally accepted outside production so QA/dev can
    // log in without reading server logs — mirrors appConfig.auth.staticOtp
    // in the frontend's local JSON data source.
    DEV_BYPASS_CODE: process.env.OTP_DEV_BYPASS_CODE || '123456',
  },

  // Bank-backed quiz sessions (allocate from ACCEPTED bank_questions).
  QUIZ: {
    QUESTION_COUNT: parseInt(process.env.QUIZ_SESSION_QUESTION_COUNT) || 20,
    EXPIRY_MINUTES: parseInt(process.env.QUIZ_SESSION_EXPIRY_MINUTES) || 90,
    DEFAULT_LANGUAGE: process.env.QUIZ_DEFAULT_LANGUAGE || 'gu',
  },
};
