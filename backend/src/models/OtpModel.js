import crypto from 'crypto';

import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { normalizeMobileDigits } from '../utils/mobileCrypto.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

function minutesRemaining(until) {
  const ms = new Date(until).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 60_000));
}

function rateLimitError(until, message) {
  const mins = until ? minutesRemaining(until) : null;
  const text =
    message ||
    (mins
      ? `વધુ પ્રયાસો થઈ ગયા. કૃપા કરી ${mins} મિનિટ પછી ફરી પ્રયાસ કરો.`
      : 'વધુ પ્રયાસો થઈ ગયા. કૃપા કરી થોડા સમય પછી ફરી પ્રયાસ કરો.');
  return new AppError(ERROR_CODE.RATE_LIMITED, text, until ? { retryAfterMinutes: mins } : null);
}

/** 10-char hex public token (e.g. 61c2827cea). */
function generateOtpToken() {
  return crypto.randomBytes(5).toString('hex');
}

function normalizeToken(token) {
  const value = String(token ?? '').trim().toLowerCase();
  return /^[a-f0-9]{10,32}$/.test(value) ? value : null;
}

export class OtpModel {
  static async create({ role, mobile, otp, expiresAt }) {
    const digits = normalizeMobileDigits(mobile);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const token = generateOtpToken();
      try {
        return await prisma.otpRequest.create({
          data: {
            token,
            role,
            mobile: digits,
            otp,
            expiresAt,
          },
        });
      } catch (error) {
        if (error?.code === 'P2002') continue;
        throw error;
      }
    }
    throw new AppError(ERROR_CODE.UNKNOWN, 'Could not issue OTP token.');
  }

  /** Pending challenge: not verified, not consumed, not expired. */
  static async findActiveByToken(token) {
    const normalized = normalizeToken(token);
    if (!normalized) return null;
    return prisma.otpRequest.findFirst({
      where: {
        token: normalized,
        verifiedAt: null,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async findByToken(token) {
    const normalized = normalizeToken(token);
    if (!normalized) return null;
    return prisma.otpRequest.findUnique({ where: { token: normalized } });
  }

  static async markVerified(id) {
    return prisma.otpRequest.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  /** OTP already accepted; still within expiry for signup / roster link. */
  static async findVerifiedByToken(token) {
    const normalized = normalizeToken(token);
    if (!normalized) return null;
    return prisma.otpRequest.findFirst({
      where: {
        token: normalized,
        verifiedAt: { not: null },
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /** Soft-consume — keep row for send rate-limit history. */
  static async consumeById(id) {
    return prisma.otpRequest
      .update({
        where: { id },
        data: { consumedAt: new Date() },
      })
      .catch(() => null);
  }

  /** @deprecated Prefer consumeById so rate-limit history remains. */
  static async deleteById(id) {
    return this.consumeById(id);
  }

  static async countSendsSince(mobile, since) {
    return prisma.otpRequest.count({
      where: {
        mobile: normalizeMobileDigits(mobile),
        createdAt: { gte: since },
      },
    });
  }

  static async findActiveLock(mobile) {
    const digits = normalizeMobileDigits(mobile);
    const now = new Date();
    return prisma.otpRequest.findFirst({
      where: {
        mobile: digits,
        lockedUntil: { gt: now },
      },
      orderBy: { lockedUntil: 'desc' },
    });
  }

  static async findLatestSend(mobile) {
    return prisma.otpRequest.findFirst({
      where: { mobile: normalizeMobileDigits(mobile) },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Enforce per-mobile send limits before creating a new OTP.
   * - active verify lock
   * - min resend gap
   * - max sends in short window
   * - max sends per day
   */
  static async assertCanSend(mobile) {
    const digits = normalizeMobileDigits(mobile);
    const limits = CONFIG.OTP.RATE_LIMIT;
    const now = Date.now();

    const lock = await this.findActiveLock(digits);
    if (lock?.lockedUntil) {
      throw rateLimitError(
        lock.lockedUntil,
        `ખોટા OTP ના વધુ પ્રયાસો થઈ ગયા. કૃપા કરી ${minutesRemaining(lock.lockedUntil)} મિનિટ પછી ફરી પ્રયાસ કરો.`
      );
    }

    const latest = await this.findLatestSend(digits);
    if (latest?.createdAt) {
      const elapsedMs = now - new Date(latest.createdAt).getTime();
      const waitMs = CONFIG.OTP.RESEND_SECONDS * 1000;
      if (elapsedMs < waitMs) {
        const retryAt = new Date(new Date(latest.createdAt).getTime() + waitMs);
        const waitSec = Math.max(1, Math.ceil((waitMs - elapsedMs) / 1000));
        throw new AppError(
          ERROR_CODE.RATE_LIMITED,
          `નવો OTP મોકલતા પહેલાં ${waitSec} સેકન્ડ રાહ જુઓ.`,
          { retryAfterSeconds: waitSec, retryAfterMinutes: minutesRemaining(retryAt) }
        );
      }
    }

    const windowSince = new Date(now - limits.sendWindowMinutes * 60_000);
    const windowCount = await this.countSendsSince(digits, windowSince);
    if (windowCount >= limits.sendMaxPerWindow) {
      const oldestInWindow = await prisma.otpRequest.findFirst({
        where: { mobile: digits, createdAt: { gte: windowSince } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });
      const retryAt = oldestInWindow
        ? new Date(new Date(oldestInWindow.createdAt).getTime() + limits.sendWindowMinutes * 60_000)
        : new Date(now + limits.sendWindowMinutes * 60_000);
      throw rateLimitError(
        retryAt,
        `વધુ OTP વિનંતીઓ થઈ ગઈ. કૃપા કરી ${minutesRemaining(retryAt)} મિનિટ પછી ફરી પ્રયાસ કરો.`
      );
    }

    const daySince = new Date(now - limits.sendDayHours * 60 * 60_000);
    const dayCount = await this.countSendsSince(digits, daySince);
    if (dayCount >= limits.sendMaxPerDay) {
      const oldestInDay = await prisma.otpRequest.findFirst({
        where: { mobile: digits, createdAt: { gte: daySince } },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      });
      const retryAt = oldestInDay
        ? new Date(new Date(oldestInDay.createdAt).getTime() + limits.sendDayHours * 60 * 60_000)
        : new Date(now + limits.sendDayHours * 60 * 60_000);
      throw rateLimitError(
        retryAt,
        `આજે OTP ની મર્યાદા પૂરી થઈ. કૃપા કરી ${minutesRemaining(retryAt)} મિનિટ પછી ફરી પ્રયાસ કરો.`
      );
    }
  }

  /** Wrong OTP: bump attempts; lock mobile after max failures. */
  static async recordFailedVerify(id) {
    const limits = CONFIG.OTP.RATE_LIMIT;
    const row = await prisma.otpRequest.findUnique({ where: { id } });
    if (!row) return null;

    const nextAttempts = (row.failedAttempts || 0) + 1;
    const hitLimit = nextAttempts >= limits.verifyMaxFailed;
    const lockedUntil = hitLimit
      ? new Date(Date.now() + limits.verifyLockMinutes * 60_000)
      : row.lockedUntil;

    const updated = await prisma.otpRequest.update({
      where: { id },
      data: {
        failedAttempts: nextAttempts,
        ...(hitLimit
          ? {
              lockedUntil,
              expiresAt: new Date(),
            }
          : {}),
      },
    });

    if (hitLimit) {
      throw rateLimitError(
        lockedUntil,
        `ખોટા OTP ના વધુ પ્રયાસો થઈ ગયા. કૃપા કરી ${minutesRemaining(lockedUntil)} મિનિટ પછી ફરી પ્રયાસ કરો.`
      );
    }

    return updated;
  }

  static async assertNotLocked(mobile) {
    const lock = await this.findActiveLock(mobile);
    if (lock?.lockedUntil) {
      throw rateLimitError(
        lock.lockedUntil,
        `વધુ પ્રયાસો થઈ ગયા. કૃપા કરી ${minutesRemaining(lock.lockedUntil)} મિનિટ પછી ફરી પ્રયાસ કરો.`
      );
    }
  }
}
