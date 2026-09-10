import jwt from 'jsonwebtoken';
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
      throw new AppError(
        ERROR_CODE.UNAUTHORIZED,
        'Missing or invalid Authorization bearer token.'
      );
    }

    req.user = verifyToken(token);
    next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError(ERROR_CODE.UNAUTHORIZED, 'Your session has expired. Please sign in again.'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError(ERROR_CODE.UNAUTHORIZED, 'Invalid access token. Please sign in again.'));
    }
    next(new AppError(ERROR_CODE.UNAUTHORIZED, 'Authentication failed. Please sign in again.'));
  }
};

export const optionalAuth = (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token) {
      req.user = verifyToken(token);
    }
  } catch {
    req.user = null;
  }
  next();
};
