import { prisma } from '../config/prisma.client.js';

export class OtpModel {
  static async create({ requestId, userId, role, phone, maskedPhone, otp, expiresAt }) {
    return prisma.otpRequest.create({
      data: { requestId, userId, role, phone, maskedPhone, otp, expiresAt },
    });
  }

  static async findActiveByRequestId(requestId) {
    return prisma.otpRequest.findFirst({
      where: { requestId, consumedAt: null },
      include: { user: true },
    });
  }

  static async consume(id) {
    return prisma.otpRequest.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }
}
