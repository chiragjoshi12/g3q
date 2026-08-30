import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, CONFIG.JWT_SECRET, {
    expiresIn: CONFIG.JWT_EXPIRY,
    issuer: CONFIG.JWT_ISSUER,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, CONFIG.JWT_SECRET, {
    issuer: CONFIG.JWT_ISSUER,
  });
};
