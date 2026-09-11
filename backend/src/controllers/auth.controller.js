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
  const { id, otp, role, credential } = req.body;
  const result = await authService.verifyOtp({ id, otp, role, credential });
  return res.status(200).json(result);
});

export const registerCitizen = asyncHandler(async (req, res) => {
  const { id, name, district, taluka, districtId, talukaId } = req.body;
  const result = await authService.registerCitizen({
    id,
    name,
    district,
    taluka,
    districtId,
    talukaId,
  });
  return res.status(200).json(result);
});

export const linkRoster = asyncHandler(async (req, res) => {
  const { id, role, credential } = req.body;
  const result = await authService.linkRoster({ id, role, credential });
  return res.status(200).json(result);
});

export const betaLogin = asyncHandler(async (req, res) => {
  const { firstName, lastName, district, taluka, districtId, talukaId, phone } = req.body;
  const result = await authService.betaLogin({
    firstName,
    lastName,
    district,
    taluka,
    districtId,
    talukaId,
    phone,
  });
  return res.status(200).json(result);
});
