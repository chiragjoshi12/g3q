import { verifyToken } from '../utils/jwt.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

/**
 * OTP login issues a single bearer token (see auth.service.js) — no cookies,
 * no refresh token. Protected routes read it from the Authorization header.
 */
export const requireAuth = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError(ERROR_CODE.UNAUTHORIZED);
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    next(new AppError(ERROR_CODE.UNAUTHORIZED));
  }
};
