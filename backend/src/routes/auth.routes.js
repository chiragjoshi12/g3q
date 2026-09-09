import { Router } from 'express';
import { lookupIdentity, requestOtp, verifyOtp, registerCitizen } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  identityLookupSchema,
  requestOtpSchema,
  verifyOtpSchema,
  registerCitizenSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Matches the DataSource contract in gujarat-gov-quiz/lib/data/sources/http.source.js
router.post('/identity/lookup', validateRequest(identityLookupSchema), lookupIdentity);
router.post('/otp/request', validateRequest(requestOtpSchema), requestOtp);
router.post('/otp/verify', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/citizen/register', validateRequest(registerCitizenSchema), registerCitizen);

export default router;
