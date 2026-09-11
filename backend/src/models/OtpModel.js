import { prisma } from '../config/prisma.client.js';

export class OtpModel {
  static async create({ role, phone, otp, expiresAt }) {
    return prisma.otpRequest.create({
      data: { role, phone, otp, expiresAt },
    });
  }

  /** Pending challenge: not yet verified and not expired. */
  static async findActiveById(id) {
    const otpId = Number(id);
    if (!Number.isInteger(otpId) || otpId <= 0) return null;
    return prisma.otpRequest.findFirst({
      where: {
        id: otpId,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async markVerified(id) {
    return prisma.otpRequest.update({
      where: { id },
      data: { verifiedAt: new Date() },
    });
  }

  /** OTP already accepted; still within expiry for signup / roster link. */
  static async findVerifiedById(id) {
    const otpId = Number(id);
    if (!Number.isInteger(otpId) || otpId <= 0) return null;
    return prisma.otpRequest.findFirst({
      where: {
        id: otpId,
        verifiedAt: { not: null },
        expiresAt: { gt: new Date() },
      },
    });
  }

  static async deleteById(id) {
    return prisma.otpRequest.delete({ where: { id } }).catch(() => null);
  }
}
