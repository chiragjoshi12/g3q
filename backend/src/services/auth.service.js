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
      String(user.district || '').trim() &&
      String(user.taluka || '').trim()
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

  /** School/college: issue OTP after resolving the roster identity. Citizen: OTP by mobile only. */
  async requestOtp({ role, credential, phone }) {
    const roleError = validateRole(role);
    if (roleError) throw new AppError(ERROR_CODE.INVALID_REQUEST, roleError);

    const phoneError = validatePhone(phone);
    if (phoneError) throw new AppError(ERROR_CODE.INVALID_PHONE, phoneError);

    const trimmedPhone = String(phone).trim();
    const otp = generateOtp();

    if (isCitizen(role)) {
      const user = await UserModel.findByPhone(ROLE.CITIZEN, trimmedPhone);
      const requestId = `otp_${user?.id ?? 'citizen'}_${Date.now()}`;

      await OtpModel.create({
        requestId,
        userId: user?.id ?? null,
        role,
        phone: trimmedPhone,
        maskedPhone: maskPhone(trimmedPhone),
        otp,
        expiresAt: new Date(Date.now() + CONFIG.OTP.EXPIRY_MINUTES * 60_000),
      });

      console.log(`[OTP] ${trimmedPhone} (નાગરિક${user ? ` ${user.name}` : ''}) -> ${otp} (request ${requestId})`);

      return {
        requestId,
        maskedPhone: maskPhone(trimmedPhone),
        resendSeconds: CONFIG.OTP.RESEND_SECONDS,
      };
    }

    const user = await resolveUser(role, credential);
    const requestId = `otp_${user.id}_${Date.now()}`;

    await OtpModel.create({
      requestId,
      userId: user.id,
      role,
      phone: trimmedPhone,
      maskedPhone: maskPhone(trimmedPhone),
      otp,
      expiresAt: new Date(Date.now() + CONFIG.OTP.EXPIRY_MINUTES * 60_000),
    });

    console.log(`[OTP] ${trimmedPhone} (${user.name}) -> ${otp} (request ${requestId})`);

    return {
      requestId,
      maskedPhone: maskPhone(trimmedPhone),
      resendSeconds: CONFIG.OTP.RESEND_SECONDS,
    };
  },

  /** Verify the OTP. Roster users get a session; new citizens continue to the profile form. */
  async verifyOtp({ requestId, otp, role, credential }) {
    const code = String(otp ?? '').trim();
    if (code.length !== CONFIG.OTP.LENGTH) {
      throw new AppError(ERROR_CODE.INVALID_OTP, `OTP ${CONFIG.OTP.LENGTH} અંકનો હોવો જોઈએ.`);
    }

    const pending = await OtpModel.findActiveByRequestId(requestId);
    const isDevBypass = CONFIG.NODE_ENV !== 'production' && code === CONFIG.OTP.DEV_BYPASS_CODE;
    const citizenFlow = isCitizen(role) || pending?.role === ROLE.CITIZEN;

    if (citizenFlow) {
      if (!pending) {
        throw new AppError(ERROR_CODE.INVALID_OTP);
      }
      if (pending.expiresAt.getTime() < Date.now()) {
        throw new AppError(ERROR_CODE.INVALID_OTP, 'OTP ની મુદત પૂરી થઈ ગઈ છે. ફરી પ્રયાસ કરો.');
      }
      if (!isDevBypass && code !== pending.otp) {
        throw new AppError(ERROR_CODE.INVALID_OTP);
      }

      const user = pending.userId
        ? await UserModel.findById(pending.userId)
        : await UserModel.findByPhone(ROLE.CITIZEN, pending.phone);

      if (hasCitizenProfile(user)) {
        await OtpModel.consume(pending.id);
        const token = generateAccessToken({ id: user.id, role: user.role });
        return { user, token, needsProfile: false };
      }

      await OtpModel.markVerified(pending.id);
      return { needsProfile: true, requestId: pending.requestId, phone: pending.phone };
    }

    if (!pending) {
      // In-memory request lost (e.g. server restart) — fall back to the
      // credential like the frontend's json data source does, but only the
      // dev bypass code can succeed since there's no OTP left to check.
      if (isDevBypass) {
        const user = await resolveUser(role, credential);
        return { user, token: generateAccessToken({ id: user.id, role: user.role }) };
      }
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      throw new AppError(ERROR_CODE.INVALID_OTP, 'OTP ની મુદત પૂરી થઈ ગઈ છે. ફરી પ્રયાસ કરો.');
    }

    if (!isDevBypass && code !== pending.otp) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }

    await OtpModel.consume(pending.id);

    const user = await UserModel.findById(pending.userId);
    if (!user) throw new AppError(ERROR_CODE.UNKNOWN);

    const token = generateAccessToken({ id: user.id, role: user.role });
    return { user, token };
  },

  async registerCitizen({ requestId, name, district, taluka }) {
    const profileError = validateCitizenProfile({ name, district, taluka });
    if (profileError) throw new AppError(ERROR_CODE.INVALID_REQUEST, profileError);

    const pending = await OtpModel.findVerifiedByRequestId(requestId);
    if (!pending || pending.role !== ROLE.CITIZEN) {
      throw new AppError(ERROR_CODE.INVALID_OTP);
    }
    if (pending.expiresAt.getTime() < Date.now()) {
      throw new AppError(ERROR_CODE.INVALID_OTP, 'OTP ની મુદત પૂરી થઈ ગઈ છે. ફરી પ્રયાસ કરો.');
    }

    let user = pending.userId
      ? await UserModel.findById(pending.userId)
      : await UserModel.findByPhone(ROLE.CITIZEN, pending.phone);

    if (user) {
      user = await UserModel.updateCitizenProfile(user.id, { name, district, taluka });
    } else {
      user = await UserModel.createCitizen({
        name,
        district,
        taluka,
        phone: pending.phone,
      });
    }

    await OtpModel.consume(pending.id);
    const token = generateAccessToken({ id: user.id, role: user.role });
    return { user, token };
  },
};
