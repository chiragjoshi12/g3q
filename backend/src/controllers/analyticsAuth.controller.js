import { asyncHandler } from '../middlewares/error.middleware.js';
import { adminAuthService } from '../services/adminAuth.service.js';

export const analyticsLogin = asyncHandler(async (req, res) => {
  const result = await adminAuthService.analyticsLogin(req.body);
  return res.status(200).json(result);
});

export const analyticsMe = asyncHandler(async (req, res) => {
  const profile = await adminAuthService.analyticsMe(req.admin.id);
  return res.status(200).json(profile);
});
