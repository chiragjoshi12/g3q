import { verifyToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_TOKEN_KIND, ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';

/**
 * Requires a bearer JWT minted by admin login (`kind: 'admin'`).
 * Attaches `req.admin = { id, username, role }`.
 */
export const requireAdminAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED);
    }

    const payload = verifyToken(token);
    if (payload.kind !== ADMIN_TOKEN_KIND || !payload.id) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED);
    }

    const user = await AdminUserModel.findById(payload.id);
    if (!user || !user.isActive) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED, 'Admin account is inactive or missing.');
    }

    req.admin = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(ERROR_CODE.UNAUTHORIZED));
  }
};

export const requireMaster = (req, res, next) => {
  if (req.admin?.role !== ADMIN_ROLE.MASTER) {
    return next(new AppError(ERROR_CODE.FORBIDDEN, 'Master admin access required.'));
  }
  next();
};
