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
  [ERROR_CODE.UNKNOWN]: 500,
};

export const ERROR_MESSAGE = {
  [ERROR_CODE.NOT_FOUND]: 'વિગત મળી નથી.',
  [ERROR_CODE.INVALID_CREDENTIAL]: 'આ કોડ સાથે કોઈ ખાતું મળ્યું નથી.',
  [ERROR_CODE.INVALID_PHONE]: 'મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ.',
  [ERROR_CODE.INVALID_OTP]: 'OTP ખોટો છે. ફરી પ્રયાસ કરો.',
  [ERROR_CODE.INVALID_REQUEST]: 'વિનંતી અમાન્ય છે.',
  [ERROR_CODE.UNAUTHORIZED]: 'સાઇન ઇન કરવું જરૂરી છે.',
  [ERROR_CODE.FORBIDDEN]: 'આ કાર્ય માટે પરવાનગી નથી.',
  [ERROR_CODE.UNKNOWN]: 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.',
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
