import { prisma } from '../config/prisma.client.js';

const toRaw = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.fullName ?? null,
    university: user.university ?? null,
    mobile_number: user.mobileNumber ?? null,
    is_active: Boolean(user.isActive),
    created_at: user.createdAt ? user.createdAt.toISOString() : null,
  };
};

const toProfile = (user) => {
  if (!user) return null;
  return {
    username: user.username,
    role: user.role,
    full_name: user.fullName ?? null,
    university: user.university ?? null,
    mobile_number: user.mobileNumber ?? null,
  };
};

export class AdminUserModel {
  static toRaw = toRaw;
  static toProfile = toProfile;

  static async findByUsername(username) {
    return prisma.adminUser.findUnique({ where: { username } });
  }

  static async findById(id) {
    return prisma.adminUser.findUnique({ where: { id } });
  }

  static async list() {
    const rows = await prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    });
    return rows.map(toRaw);
  }

  static async create({ username, passwordHash, role, fullName, university, mobileNumber }) {
    const row = await prisma.adminUser.create({
      data: {
        username,
        passwordHash,
        role,
        fullName: fullName ?? null,
        university: university ?? null,
        mobileNumber: mobileNumber ?? null,
      },
    });
    return toRaw(row);
  }

  static async updateProfile(id, { fullName, university, mobileNumber }) {
    const row = await prisma.adminUser.update({
      where: { id },
      data: {
        fullName: fullName ?? null,
        university: university ?? null,
        mobileNumber: mobileNumber ?? null,
      },
    });
    return toProfile(row);
  }

  static async setActive(id, isActive) {
    const row = await prisma.adminUser.update({
      where: { id },
      data: { isActive },
    });
    return toRaw(row);
  }
}
