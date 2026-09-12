import { CONFIG } from '../config/index.js';
import {
  isCitizen,
  usesRosterIdentity,
  validateCitizenProfile,
  validateCredential,
  validatePhone,
  validateRole,
  ROLE,
} from '../config/roles.js';
import { UserModel } from '../models/UserModel.js';
import { OtpModel } from '../models/OtpModel.js';
import { generateAccessToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

const generateOtp = () =>
  String(Math.floor(Math.random() * 10 ** CONFIG.OTP.LENGTH)).padStart(CONFIG.OTP.LENGTH, '0');

const maskPhone = (phone) => String(phone).replace(/\d(?=\d{4})/g, '•');

function hasCitizenProfile(user) {
  return Boolean(
    user &&
      String(user.name || '').trim() &&
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
  /** Step 1 → 2: resolve the CTS Number/ABC code to a name, before phone or OTP. */
  async lookupIdentity({ role, credential }) {
    return resolveUser(role, credential);
  },

  /** School/college: issue OTP after resolving the roster identity. Citizen / phone-first: OTP by mobile. */
  async requestOtp({ role, credential, phone }) {
    const roleError = validateRole(role);
    if (roleError) throw new AppError(ERROR_CODE.INVALID_REQUEST, roleError);

    const phoneError = validatePhone(phone);
    if (phoneError) throw new AppError(ERROR_CODE.INVALID_PHONE, phoneError);

    const trimmedPhone = String(phone).trim();
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + CONFIG.OTP.EXPIRY_MINUTES * 60_000);

    if (isCitizen(role)) {
      const user = await UserModel.findByPhoneAny(trimmedPhone);
      const otpRole = user?.role || ROLE.CITIZEN;

      const row = await OtpModel.create({
        role: otpRole,
        phone: trimmedPhone,
        otp,
        expiresAt,
      });

      console.log(
        `[OTP] ${trimmedPhone} (${user ? `${user.role} ${user.name}` : 'new'}) -> ${otp} (id ${row.id})`
      );

      return {
        id: row.id,
        maskedPhone: maskPhone(trimmedPhone),
        resendSeconds: CONFIG.OTP.RESEND_SECONDS,
      };
    }

    await resolveUser(role, credential);

    const row = await OtpModel.create({
      role,
      phone: trimmedPhone,
      otp,
      expiresAt,
    });

    console.log(`[OTP] ${trimmedPhone} (${role}) -> ${otp} (id ${row.id})`);

    return {
      id: row.id,
      maskedPhone: maskPhone(trimmedPhone),
      resendSeconds: CONFIG.OTP.RESEND_SECONDS,
    };
  },

  /**
   * Verify OTP.
   * Phone-first (citizen role on request): existing user → session; else needsSignup.
   * Legacy roster OTP still returns session for school/college codes.
   */
  async verifyOtp({ id, otp, role, credential }) {
    const code = String(otp ?? '').trim();
    if (code.length !== CONFIG.OTP.LENGTH) {
      throw new AppError(ERROR_CODE.INVALID_OTP, `OTP ${CONFIG.OTP.LENGTH} અંકનો હોવો જોઈએ.`);
    }

    const pending = await OtpModel.findActiveById(id);
    const isDevBypass = CONFIG.NODE_ENV !== 'production' && code === CONFIG.OTP.DEV_BYPASS_CODE;
    const phoneFirst = isCitizen(role) || !credential;

    if (phoneFirst) {
      if (!pending) {
        throw new AppError(ERROR_CODE.INVALID_OTP);
      }
      if (!isDevBypass && code !== pending.otp) {
        throw new AppError(ERROR_CODE.INVALID_OTP);
      }

      const user = await UserModel.findByPhoneAny(pending.phone);

      if (user) {
        if (user.role === ROLE.CITIZEN && !hasCitizenProfile(user)) {
          await OtpModel.markVerified(pending.id);
          return { needsSignup: true, needsProfile: true, id: pending.id, phone: pending.phone };
        }
        await OtpModel.markVerified(pending.id);
        await OtpModel.deleteById(pending.id);
        const token = generateAccessToken({ id: user.id, role: user.role });
        return { user, token, existing: true, needsProfile: false, needsSignup: false };
      }

      await OtpModel.markVerified(pending.id);
      return { needsSignup: true, needsProfile: false, id: pending.id, phone: pending.phone };
    }

    if (!pending) {
      if (isDevBypass) {
        const user = await resolveUser(role, credential);
        return { user, token: generateAccessToken({ id: user.id, role: user.role }) };
      }
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    if (!isDevBypass && code !== pending.otp) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    await OtpModel.markVerified(pending.id);
    await OtpModel.deleteById(pending.id);

    const user = await resolveUser(role, credential);
    const token = generateAccessToken({ id: user.id, role: user.role });
    return { user, token };
  },

  /** After phone OTP signup: attach verified phone to a roster school/college identity. */
  async linkRoster({ id, role, credential }) {
    if (!usesRosterIdentity(role)) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'અમાન્ય પ્રકાર.');
    }

    const pending = await OtpModel.findVerifiedById(id);
    if (!pending) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    const user = await resolveUser(role, credential);
    const phoneOwner = await UserModel.findByPhoneAny(pending.phone);
    if (phoneOwner && phoneOwner.id !== user.id) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        'આ મોબાઇલ નંબર પહેલેથી બીજા એકાઉન્ટ સાથે જોડાયેલો છે.'
      );
    }

    const linked = await UserModel.updatePhone(user.id, pending.phone);
    await OtpModel.deleteById(pending.id);
    const token = generateAccessToken({ id: linked.id, role: linked.role });
    return { user: linked, token };
  },

  async registerCitizen({ id, name, district, taluka, districtId, talukaId }) {
    const profileError = validateCitizenProfile({ name, district, taluka, districtId, talukaId });
    if (profileError) throw new AppError(ERROR_CODE.INVALID_REQUEST, profileError);

    const pending = await OtpModel.findVerifiedById(id);
    if (!pending) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }
    if (pending.role && pending.role !== ROLE.CITIZEN) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    let user = await UserModel.findByPhone(ROLE.CITIZEN, pending.phone);
    const geoInput = { district, taluka, districtId, talukaId };

    if (user) {
      user = await UserModel.updateCitizenProfile(user.id, { name, ...geoInput });
    } else {
      user = await UserModel.createCitizen({
        name,
        phone: pending.phone,
        ...geoInput,
      });
    }

    await OtpModel.deleteById(pending.id);
    const token = generateAccessToken({ id: user.id, role: user.role });
    return { user, token };
  },
};
