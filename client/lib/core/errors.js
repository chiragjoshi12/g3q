import { translateCurrent } from "@/lib/i18n";

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

export const ERROR_MESSAGE = {
  [ERROR_CODE.NOT_FOUND]: () => translateCurrent("errorNotFound"),
  [ERROR_CODE.INVALID_CREDENTIAL]: () => translateCurrent("errorInvalidCredential"),
  [ERROR_CODE.INVALID_PHONE]: () => translateCurrent("errorInvalidPhone"),
  [ERROR_CODE.INVALID_OTP]: () => translateCurrent("errorInvalidOtp"),
  [ERROR_CODE.NETWORK]: () => translateCurrent("errorNetwork"),
  [ERROR_CODE.UNKNOWN]: () => translateCurrent("somethingWentWrong"),
};

function resolveMessage(code) {
  const value = ERROR_MESSAGE[code] || ERROR_MESSAGE.UNKNOWN;
  return typeof value === "function" ? value() : value;
}

export function toMessage(error) {
  if (isAppError(error)) {
    return error.message || resolveMessage(error.code);
  }
  return resolveMessage(ERROR_CODE.UNKNOWN);
}
