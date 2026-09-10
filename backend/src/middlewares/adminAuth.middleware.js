import jwt from 'jsonwebtoken';
import { verifyToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_ACCESS_SCOPE, ADMIN_TOKEN_KIND, ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';

function authFailure(error) {
  if (error instanceof AppError) return error;
  if (error instanceof jwt.TokenExpiredError) {
    return new AppError(ERROR_CODE.UNAUTHORIZED, 'Admin session has expired. Please sign in again.');
  }
  if (error instanceof jwt.JsonWebTokenError) {
    return new AppError(ERROR_CODE.UNAUTHORIZED, 'Invalid admin access token. Please sign in again.');
  }
  return new AppError(ERROR_CODE.UNAUTHORIZED, 'Admin authentication failed. Please sign in again.');
}

/**
 * Requires a bearer JWT minted by admin login (`kind: 'admin'`).
 * Attaches `req.admin = { id, username, role }`.
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(
        ERROR_CODE.UNAUTHORIZED,
        'Missing or invalid Authorization bearer token.'
      );
    }

    const payload = verifyToken(token);
    if (payload.kind !== ADMIN_TOKEN_KIND || !payload.id) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED, 'This token is not valid for the admin console.');
    }

    const user = await AdminUserModel.findById(payload.id);
    if (!user || !user.isActive) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED, 'Admin account is inactive or missing.');
    }

    req.admin = {
      id: user.id,
      username: user.username,
      role: user.role,
      access_scope: user.accessScope ?? null,
    };
    next();
  } catch (error) {
    next(authFailure(error));
  }
};

export const requireMaster = (req, res, next) => {
  if (req.admin?.role !== ADMIN_ROLE.MASTER) {
    return next(new AppError(ERROR_CODE.FORBIDDEN, 'Master admin access required.'));
  }
  next();
};

export const requireAnalyticsAuth = async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      requireAdminAuth(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    if (
      req.admin?.role !== ADMIN_ROLE.MASTER &&
      !(
        req.admin?.role === ADMIN_ROLE.SUB_ADMIN &&
        req.admin?.access_scope === ADMIN_ACCESS_SCOPE.ANALYTICS
      )
    ) {
      throw new AppError(ERROR_CODE.FORBIDDEN, 'Analytics access required.');
    }

    next();
  } catch (error) {
    next(authFailure(error));
  }
};
