import { CONFIG } from '../config/index.js';
import { CURRENT_CONSENT_VERSION } from '../config/consent.js';
import {
  usesRosterIdentity,
  validateCitizenProfile,
  validateCredential,
  validateMobile,
  validateRole,
  ROLE,
} from '../config/roles.js';
import { UserModel } from '../models/UserModel.js';
import { OtpModel } from '../models/OtpModel.js';
import { generateAccessToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { maskMobile, normalizeMobileDigits } from '../utils/mobileCrypto.js';
import { sendOtpSms } from './otpSms.service.js';

const generateOtp = () =>
  String(Math.floor(Math.random() * 10 ** CONFIG.OTP.LENGTH)).padStart(CONFIG.OTP.LENGTH, '0');

function hasCitizenProfile(user) {
  return Boolean(
    user &&
      String(user.name || '').trim() &&
      String(user.surname || '').trim() &&
      user.districtId != null &&
      user.talukaId != null
  );
}

async function resolveUser(role, credential) {
  const roleError = validateRole(role);
  if (roleError) throw new AppError(ERROR_CODE.INVALID_REQUEST, roleError);

  if (!usesRosterIdentity(role)) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'અમાન્ય પ્રકાર.');
  }

  const credentialError = validateCredential(role, credential);
  if (credentialError) throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, credentialError);

  const user = await UserModel.findByCredential(role, String(credential).trim());
  if (!user) throw new AppError(ERROR_CODE.INVALID_CREDENTIAL);
  return user;
}

export const authService = {
  /** Step 1 → 2: resolve CTS ID / Appar ID to a name, before mobile or OTP. */
  async lookupIdentity({ role, credential }) {
    return resolveUser(role, credential);
  },

  /**
   * Mobile-only OTP issue.
   * Role/credential are not accepted — we discover whether the number is known.
   */
  async requestOtp({ mobile }) {
    const mobileError = validateMobile(mobile);
    if (mobileError) throw new AppError(ERROR_CODE.INVALID_PHONE, mobileError);

    const trimmedMobile = normalizeMobileDigits(mobile);
    await OtpModel.assertCanSend(trimmedMobile);

    const user = await UserModel.findByMobileAny(trimmedMobile);
    const authCase = user ? 'login' : 'signup';
    const otpRole = user?.role || ROLE.CITIZEN;

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + CONFIG.OTP.EXPIRY_MINUTES * 60_000);

    const row = await OtpModel.create({
      role: otpRole,
      mobile: trimmedMobile,
      otp,
      expiresAt,
    });

    await sendOtpSms({ mobile: trimmedMobile, otp });

    const logLabel = user ? `${user.role} ${user.name}` : 'new';
    if (!CONFIG.OTP.SEND_SMS) {
      console.log(`[OTP] ${trimmedMobile} (${logLabel}) -> ${otp} (token ${row.token})`);
    } else {
      console.log(`[OTP] issued token ${row.token} for ${maskMobile(trimmedMobile)} (${logLabel})`);
    }

    return {
      message: 'OTP Sended successfully.',
      otp_token: row.token,
      maskedMobile: maskMobile(trimmedMobile),
      resendSeconds: CONFIG.OTP.RESEND_SECONDS,
      case: authCase,
    };
  },

  /**
   * Verify OTP by public otp_token.
   * Existing account → session; unknown mobile → needsSignup (keep token for register/link).
   */
  async verifyOtp({ otp_token, otp }) {
    const code = String(otp ?? '').trim();
    if (code.length !== CONFIG.OTP.LENGTH) {
      throw new AppError(ERROR_CODE.INVALID_OTP, `OTP ${CONFIG.OTP.LENGTH} અંકનો હોવો જોઈએ.`);
    }

    const pending = await OtpModel.findActiveByToken(otp_token);
    const otpRow = pending || (await OtpModel.findByToken(otp_token));
    const isDevBypass = code === CONFIG.OTP.DEV_BYPASS_CODE;

    if (otpRow?.mobile) {
      await OtpModel.assertNotLocked(otpRow.mobile);
    }

    const rejectInvalidOtp = async () => {
      if (otpRow && !otpRow.consumedAt) {
        await OtpModel.recordFailedVerify(otpRow.id);
      }
      throw new AppError(ERROR_CODE.INVALID_OTP);
    };

    if (!pending) {
      await rejectInvalidOtp();
    }
    if (!isDevBypass && code !== pending.otp) {
      await rejectInvalidOtp();
    }

    const user = await UserModel.findByMobileAny(pending.mobile);

    if (user) {
      if (user.role === ROLE.CITIZEN && !hasCitizenProfile(user)) {
        await OtpModel.markVerified(pending.id);
        return {
          needsSignup: true,
          needsProfile: true,
          otp_token: pending.token,
          mobile: pending.mobile,
        };
      }
      await OtpModel.markVerified(pending.id);
      await OtpModel.consumeById(pending.id);
      const token = generateAccessToken({ id: user.id, role: user.role });
      return { user, token, existing: true, needsProfile: false, needsSignup: false };
    }

    await OtpModel.markVerified(pending.id);
    return {
      needsSignup: true,
      needsProfile: false,
      otp_token: pending.token,
      mobile: pending.mobile,
    };
  },

  /** After mobile OTP signup: attach verified mobile to a roster school/college identity. */
  async linkRoster({ otp_token, role, credential }) {
    if (!usesRosterIdentity(role)) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'અમાન્ય પ્રકાર.');
    }

    const pending = await OtpModel.findVerifiedByToken(otp_token);
    if (!pending) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    const user = await resolveUser(role, credential);
    const mobileOwner = await UserModel.findByMobileAny(pending.mobile);
    if (mobileOwner && mobileOwner.id !== user.id) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        'આ મોબાઇલ નંબર પહેલેથી બીજા એકાઉન્ટ સાથે જોડાયેલો છે.'
      );
    }

    const linked = await UserModel.updateMobile(user.id, pending.mobile);
    await OtpModel.consumeById(pending.id);
    const token = generateAccessToken({ id: linked.id, role: linked.role });
    return { user: linked, token };
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
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'સંમતિ આપ્યા વગર સાઇન-અપ થઈ શકે નહીં.');
    }
    const version = String(consentVersion || '').trim();
    if (!version || version !== CURRENT_CONSENT_VERSION) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'સંમતિનું સંસ્કરણ અમાન્ય છે.');
    }

    const profileError = validateCitizenProfile({ name, surname, districtId, talukaId });
    if (profileError) throw new AppError(ERROR_CODE.INVALID_REQUEST, profileError);

    const pending = await OtpModel.findVerifiedByToken(otp_token);
    if (!pending) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }
    if (pending.role && pending.role !== ROLE.CITIZEN) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }
    if (!pending.mobile) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'મોબાઇલ નંબર જરૂરી છે.');
    }

    let user = await UserModel.findByMobile(ROLE.CITIZEN, pending.mobile);
    const geoInput = { districtId, talukaId };
    const profile = {
      name: String(name).trim(),
      surname: String(surname).trim(),
      ...geoInput,
    };

    if (user) {
      user = await UserModel.updateCitizenProfile(user.id, profile);
    } else {
      user = await UserModel.createCitizen({
        ...profile,
        mobile: pending.mobile,
      });
    }

    await UserModel.recordConsent(user.id, version);
    await OtpModel.consumeById(pending.id);
    const token = generateAccessToken({ id: user.id, role: user.role });
    return { user, token };
  },
};
