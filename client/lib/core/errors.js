export const ERROR_CODE = {
  NOT_FOUND: "NOT_FOUND",
  INVALID_CREDENTIAL: "INVALID_CREDENTIAL",
  INVALID_PHONE: "INVALID_PHONE",
  INVALID_OTP: "INVALID_OTP",
  NETWORK: "NETWORK",
  UNKNOWN: "UNKNOWN",
};

/** Transport-agnostic error so the UI never has to know if data came from JSON or HTTP. */
export class AppError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.details = details;
  }
}

export function isAppError(error) {
  return error instanceof AppError;
}

/** Gujarati messages for anything that can surface to the user. */
export const ERROR_MESSAGE = {
  [ERROR_CODE.NOT_FOUND]: "વિગત મળી નથી.",
  [ERROR_CODE.INVALID_CREDENTIAL]: "આ કોડ સાથે કોઈ ખાતું મળ્યું નથી.",
  [ERROR_CODE.INVALID_PHONE]: "મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ.",
  [ERROR_CODE.INVALID_OTP]: "OTP ખોટો છે. ફરી પ્રયાસ કરો.",
  [ERROR_CODE.NETWORK]: "કનેક્શનમાં સમસ્યા છે. ફરી પ્રયાસ કરો.",
  [ERROR_CODE.UNKNOWN]: "કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.",
};

export function toMessage(error) {
  if (isAppError(error)) {
    return error.message || ERROR_MESSAGE[error.code] || ERROR_MESSAGE.UNKNOWN;
  }
  return ERROR_MESSAGE.UNKNOWN;
}
