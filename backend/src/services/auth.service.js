import { CONFIG } from '../config/index.js';
import { validateCredential, validatePhone, validateRole } from '../config/roles.js';
import { UserModel } from '../models/UserModel.js';
import { OtpModel } from '../models/OtpModel.js';
import { generateAccessToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

const generateOtp = () =>
  String(Math.floor(Math.random() * 10 ** CONFIG.OTP.LENGTH)).padStart(CONFIG.OTP.LENGTH, '0');

const maskPhone = (phone) => String(phone).replace(/\d(?=\d{4})/g, '•');

async function resolveUser(role, credential) {
  const roleError = validateRole(role);
  if (roleError) throw new AppError(ERROR_CODE.INVALID_REQUEST, roleError);

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

  /** Step 2 → 3: issue an OTP to the phone number just entered. */
  async requestOtp({ role, credential, phone }) {
    const user = await resolveUser(role, credential);

    const phoneError = validatePhone(phone);
    if (phoneError) throw new AppError(ERROR_CODE.INVALID_PHONE, phoneError);

    const otp = generateOtp();
    const requestId = `otp_${user.id}_${Date.now()}`;
    const trimmedPhone = String(phone).trim();

    await OtpModel.create({
      requestId,
      userId: user.id,
      role,
      phone: trimmedPhone,
      maskedPhone: maskPhone(trimmedPhone),
      otp,
      expiresAt: new Date(Date.now() + CONFIG.OTP.EXPIRY_MINUTES * 60_000),
    });

    // No SMS gateway wired up yet — log the OTP so it can be used in dev/QA.
    console.log(`[OTP] ${trimmedPhone} (${user.name}) -> ${otp} (request ${requestId})`);

    return {
      requestId,
      maskedPhone: maskPhone(trimmedPhone),
      resendSeconds: CONFIG.OTP.RESEND_SECONDS,
    };
  },

  /** Step 3 → 4: verify the OTP and mint a session token. */
  async verifyOtp({ requestId, otp, role, credential }) {
    const code = String(otp ?? '').trim();
    if (code.length !== CONFIG.OTP.LENGTH) {
      throw new AppError(ERROR_CODE.INVALID_OTP, `OTP ${CONFIG.OTP.LENGTH} અંકનો હોવો જોઈએ.`);
    }

    const pending = await OtpModel.findActiveByRequestId(requestId);
    const isDevBypass = CONFIG.NODE_ENV !== 'production' && code === CONFIG.OTP.DEV_BYPASS_CODE;

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
};
