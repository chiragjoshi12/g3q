import { appConfig } from "@/config/app.config";
import { authRepository } from "@/lib/data/repositories/auth.repository";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import {
  usesRosterIdentity,
  validateCitizenProfile,
  validateCredential,
  validateMobile,
} from "@/lib/domain/roles";
import { translateCurrent } from "@/lib/i18n";

/**
 * Authentication use cases. No React, no store, no storage — just validation
 * plus repository orchestration, so this is portable to any UI or to a test.
 */
export const authController = {
  /** Step 1 → 2: resolve CTS ID / Appar ID to a name, before mobile or OTP. */
  async lookupIdentity({ role, credential }) {
    if (!usesRosterIdentity(role)) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, "અમાન્ય પ્રકાર.");
    }
    const invalid = validateCredential(role, credential);
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    return authRepository.lookupIdentity({ role, credential: String(credential).trim() });
  },

  /** Mobile-only OTP request. */
  async sendOtp({ mobile }) {
    const otpMobile = String(mobile || "").trim();
    const invalidMobile = validateMobile(otpMobile);
    if (invalidMobile) {
      throw new AppError(ERROR_CODE.INVALID_PHONE, invalidMobile);
    }
    return authRepository.requestOtp({ mobile: otpMobile });
  },

  async verifyOtp({ otp_token, otp }) {
    const code = String(otp || "").trim();
    if (code.length !== appConfig.auth.otpLength) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        `OTP ${appConfig.auth.otpLength} અંકનો હોવો જોઈએ.`
      );
    }
    const result = await authRepository.verifyOtp({
      otp_token,
      otp: code,
    });
    if (result.needsSignup || result.needsProfile) {
      return {
        needsSignup: true,
        needsProfile: Boolean(result.needsProfile),
        otp_token: result.otp_token ?? otp_token,
        mobile: result.mobile || null,
      };
    }
    if (!result.user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return {
      user: result.user,
      token: result.token,
      existing: Boolean(result.existing),
      needsSignup: false,
      needsProfile: false,
    };
  },

  async registerCitizen({
    otp_token,
    name,
    surname,
    districtId,
    talukaId,
    consentAccepted,
    consentVersion,
  }) {
    if (consentAccepted !== true) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, translateCurrent("signupConsentRequired"));
    }
    const invalid = validateCitizenProfile({ name, surname, districtId, talukaId });
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    if (!otp_token) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }
    const { user, token } = await authRepository.registerCitizen({
      otp_token,
      name: String(name).trim(),
      surname: String(surname).trim(),
      districtId: Number(districtId),
      talukaId: Number(talukaId),
      consentAccepted: true,
      consentVersion: String(consentVersion || appConfig.auth.consentVersion).trim(),
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },

  async linkRoster({ otp_token, role, credential }) {
    if (!usesRosterIdentity(role)) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, "અમાન્ય પ્રકાર.");
    }
    const invalid = validateCredential(role, credential);
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    if (!otp_token) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }
    const { user, token } = await authRepository.linkRoster({
      otp_token,
      role,
      credential: String(credential).trim(),
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },
};
