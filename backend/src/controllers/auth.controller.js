import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const lookupIdentity = asyncHandler(async (req, res) => {
  const { role, credential } = req.body;
  const user = await authService.lookupIdentity({ role, credential });
  return res.status(200).json(user);
});

export const requestOtp = asyncHandler(async (req, res) => {
  const { role, credential, phone } = req.body;
  const result = await authService.requestOtp({ role, credential, phone });
  return res.status(200).json(result);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { requestId, otp, role, credential } = req.body;
  const result = await authService.verifyOtp({ requestId, otp, role, credential });
  return res.status(200).json(result);
});
