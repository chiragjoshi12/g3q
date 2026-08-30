import { appConfig } from "@/config/app.config";
import { authRepository } from "@/lib/data/repositories/auth.repository";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import { validateCredential, validatePhone } from "@/lib/domain/roles";

/**
 * Authentication use cases. No React, no store, no storage — just validation
 * plus repository orchestration, so this is portable to any UI or to a test.
 */
export const authController = {
  /** Step 1 → 2: resolve the CTS Number/ABC code to a name, before any phone or OTP is involved. */
  async lookupIdentity({ role, credential }) {
    const invalid = validateCredential(role, credential);
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    return authRepository.lookupIdentity({ role, credential: String(credential).trim() });
  },

  /** Step 2 → 3: send the OTP to the phone number the user just entered. */
  async sendOtp({ role, credential, phone }) {
    const invalidCredential = validateCredential(role, credential);
    if (invalidCredential) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalidCredential);
    }
    const invalidPhone = validatePhone(phone);
    if (invalidPhone) {
      throw new AppError(ERROR_CODE.INVALID_PHONE, invalidPhone);
    }
    return authRepository.requestOtp({
      role,
      credential: String(credential).trim(),
      phone: String(phone).trim(),
    });
  },

  async verifyOtp({ requestId, otp, role, credential }) {
    const code = String(otp || "").trim();
    if (code.length !== appConfig.auth.otpLength) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        `OTP ${appConfig.auth.otpLength} અંકનો હોવો જોઈએ.`
      );
    }
    const { user, token } = await authRepository.verifyOtp({
      requestId,
      otp: code,
      role,
      credential: String(credential || "").trim(),
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },
};
