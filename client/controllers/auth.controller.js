import { appConfig } from "@/config/app.config";
import { authRepository } from "@/lib/data/repositories/auth.repository";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import {
  isCitizen,
  usesRosterIdentity,
  validateBetaLoginProfile,
  validateCitizenProfile,
  validateCredential,
  validatePhone,
} from "@/lib/domain/roles";

/**
 * Authentication use cases. No React, no store, no storage — just validation
 * plus repository orchestration, so this is portable to any UI or to a test.
 */
export const authController = {
  /** Step 1 → 2: resolve the CTS Number/ABC code to a name, before any phone or OTP is involved. */
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

  /** School/college: code + phone. Citizen: mobile only. */
  async sendOtp({ role, credential, phone }) {
    if (isCitizen(role)) {
      const otpPhone = String(phone || credential || "").trim();
      const invalidPhone = validatePhone(otpPhone);
      if (invalidPhone) {
        throw new AppError(ERROR_CODE.INVALID_PHONE, invalidPhone);
      }
      return authRepository.requestOtp({
        role,
        credential: otpPhone,
        phone: otpPhone,
      });
    }

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

  async verifyOtp({ id, otp, role, credential }) {
    const code = String(otp || "").trim();
    if (code.length !== appConfig.auth.otpLength) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        `OTP ${appConfig.auth.otpLength} અંકનો હોવો જોઈએ.`
      );
    }
    const result = await authRepository.verifyOtp({
      id,
      otp: code,
      role,
      credential: String(credential || "").trim(),
    });
    if (result.needsSignup || result.needsProfile) {
      return {
        needsSignup: true,
        needsProfile: Boolean(result.needsProfile),
        id: result.id ?? id,
        phone: result.phone || null,
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

  async registerCitizen({ id, name, district, taluka, districtId, talukaId }) {
    const invalid = validateCitizenProfile({ name, district, taluka, districtId, talukaId });
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    if (!id) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }
    const { user, token } = await authRepository.registerCitizen({
      id,
      name: String(name).trim(),
      district: district != null ? String(district).trim() : undefined,
      taluka: taluka != null ? String(taluka).trim() : undefined,
      districtId: districtId != null ? Number(districtId) : undefined,
      talukaId: talukaId != null ? Number(talukaId) : undefined,
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },

  async linkRoster({ id, role, credential }) {
    if (!usesRosterIdentity(role)) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, "અમાન્ય પ્રકાર.");
    }
    const invalid = validateCredential(role, credential);
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    if (!id) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }
    const { user, token } = await authRepository.linkRoster({
      id,
      role,
      credential: String(credential).trim(),
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },

  async betaLogin({ firstName, lastName, district, taluka, districtId, talukaId, phone }) {
    const invalid = validateBetaLoginProfile({
      firstName,
      lastName,
      district,
      taluka,
      districtId,
      talukaId,
      phone: String(phone || "").trim(),
    });
    if (invalid) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, invalid);
    }
    const { user, token } = await authRepository.betaLogin({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      district: district != null ? String(district).trim() : undefined,
      taluka: taluka != null ? String(taluka).trim() : undefined,
      districtId: districtId != null ? Number(districtId) : undefined,
      talukaId: talukaId != null ? Number(talukaId) : undefined,
      phone: String(phone).trim(),
    });
    if (!user) {
      throw new AppError(ERROR_CODE.UNKNOWN, ERROR_MESSAGE[ERROR_CODE.UNKNOWN]);
    }
    return { user, token };
  },
};
