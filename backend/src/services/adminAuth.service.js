import bcrypt from 'bcryptjs';
import { generateAccessToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_TOKEN_KIND, ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';
import { CONFIG } from '../config/index.js';

const SALT_ROUNDS = 10;

export const adminAuthService = {
  async login({ username, password }) {
    const user = await AdminUserModel.findByUsername(username);
    if (!user || !user.isActive) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, 'Invalid username or password.');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, 'Invalid username or password.');
    }

    const access_token = generateAccessToken({
      id: user.id,
      username: user.username,
      role: user.role,
      kind: ADMIN_TOKEN_KIND,
    });

    return {
      access_token,
      token_type: 'bearer',
      username: user.username,
      role: user.role,
      full_name: user.fullName ?? null,
      university: user.university ?? null,
      mobile_number: user.mobileNumber ?? null,
    };
  },

  async me(adminId) {
    const user = await AdminUserModel.findById(adminId);
    if (!user || !user.isActive) throw new AppError(ERROR_CODE.UNAUTHORIZED);
    return AdminUserModel.toProfile(user);
  },

  async updateMe(adminId, body) {
    return AdminUserModel.updateProfile(adminId, {
      fullName: body.full_name,
      university: body.university,
      mobileNumber: body.mobile_number,
    });
  },

  async listUsers() {
    return { items: await AdminUserModel.list() };
  },

  async createUser(body) {
    const existing = await AdminUserModel.findByUsername(body.username);
    if (existing) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Username already exists.');
    }

    const passwordHash = await bcrypt.hash(body.password, SALT_ROUNDS);
    return AdminUserModel.create({
      username: body.username,
      passwordHash,
      role: body.role || ADMIN_ROLE.ADMIN,
      fullName: body.full_name,
      university: body.university,
      mobileNumber: body.mobile_number,
    });
  },

  async setUserActive(id, active) {
    const user = await AdminUserModel.findById(id);
    if (!user) throw new AppError(ERROR_CODE.NOT_FOUND, 'Admin user not found.');
    if (user.role === ADMIN_ROLE.MASTER && !active) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot deactivate the master admin.');
    }
    return AdminUserModel.setActive(id, active);
  },

  async ensureMasterAdmin() {
    const { prisma } = await import('../config/prisma.client.js');
    const username = CONFIG.ADMIN.USERNAME;
    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      if (existing.role !== ADMIN_ROLE.MASTER || !existing.isActive) {
        await prisma.adminUser.update({
          where: { id: existing.id },
          data: {
            role: ADMIN_ROLE.MASTER,
            isActive: true,
            fullName: existing.fullName || CONFIG.ADMIN.FULL_NAME,
            university: existing.university || CONFIG.ADMIN.UNIVERSITY,
            mobileNumber: existing.mobileNumber || CONFIG.ADMIN.MOBILE_NUMBER,
          },
        });
      }
      return;
    }

    const passwordHash = await bcrypt.hash(CONFIG.ADMIN.PASSWORD, SALT_ROUNDS);
    await AdminUserModel.create({
      username,
      passwordHash,
      role: ADMIN_ROLE.MASTER,
      fullName: CONFIG.ADMIN.FULL_NAME,
      university: CONFIG.ADMIN.UNIVERSITY,
      mobileNumber: CONFIG.ADMIN.MOBILE_NUMBER,
    });
  },
};
