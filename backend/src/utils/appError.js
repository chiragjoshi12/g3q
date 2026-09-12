/**
 * Mirrors gujarat-gov-quiz/lib/core/errors.js so the frontend's httpSource
 * error handling (`payload?.code`, `payload?.message`) works against this
 * backend with no changes on that side.
 */
export const ERROR_CODE = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_CREDENTIAL: 'INVALID_CREDENTIAL',
  INVALID_PHONE: 'INVALID_PHONE',
  INVALID_OTP: 'INVALID_OTP',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  UNKNOWN: 'UNKNOWN',
};

const STATUS_BY_CODE = {
  [ERROR_CODE.NOT_FOUND]: 404,
  [ERROR_CODE.INVALID_CREDENTIAL]: 400,
  [ERROR_CODE.INVALID_PHONE]: 400,
  [ERROR_CODE.INVALID_OTP]: 400,
  [ERROR_CODE.INVALID_REQUEST]: 400,
  [ERROR_CODE.UNAUTHORIZED]: 401,
  [ERROR_CODE.FORBIDDEN]: 403,
  [ERROR_CODE.RATE_LIMITED]: 429,
  [ERROR_CODE.UNKNOWN]: 500,
};

export const ERROR_MESSAGE = {
  [ERROR_CODE.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODE.INVALID_CREDENTIAL]: 'No account was found for this code.',
  [ERROR_CODE.INVALID_PHONE]: 'Mobile number must be 10 digits.',
  [ERROR_CODE.INVALID_OTP]: 'OTP is incorrect. Please try again.',
  [ERROR_CODE.INVALID_REQUEST]: 'The request is invalid.',
  [ERROR_CODE.UNAUTHORIZED]: 'Sign in is required.',
  [ERROR_CODE.FORBIDDEN]: 'You do not have permission for this action.',
  [ERROR_CODE.RATE_LIMITED]: 'Too many attempts. Please try again later.',
  [ERROR_CODE.UNKNOWN]: 'Something went wrong. Please try again.',
};

export class AppError extends Error {
  constructor(code, message, details = null) {
    super(message || ERROR_MESSAGE[code] || ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code] || 500;
    this.details = details;
  }
}
