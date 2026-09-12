import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const lookupIdentity = asyncHandler(async (req, res) => {
  const { role, credential } = req.body;
  const user = await authService.lookupIdentity({ role, credential });
  return res.status(200).json(user);
});

export const requestOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;
  const result = await authService.requestOtp({ mobile });
  return res.status(200).json(result);
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { otp_token, otp } = req.body;
  const result = await authService.verifyOtp({ otp_token, otp });
  return res.status(200).json(result);
});

export const registerCitizen = asyncHandler(async (req, res) => {
  const { otp_token, name, surname, districtId, talukaId, consentAccepted, consentVersion } =
    req.body;
  const result = await authService.registerCitizen({
    otp_token,
    name,
    surname,
    districtId,
    talukaId,
    consentAccepted,
    consentVersion,
  });
  return res.status(200).json(result);
});

export const linkRoster = asyncHandler(async (req, res) => {
  const { otp_token, role, credential } = req.body;
  const result = await authService.linkRoster({ otp_token, role, credential });
  return res.status(200).json(result);
});
