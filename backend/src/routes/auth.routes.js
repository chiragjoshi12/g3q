import { Router } from 'express';
import {
  lookupIdentity,
  requestOtp,
  verifyOtp,
  registerCitizen,
  linkRoster,
} from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  identityLookupSchema,
  requestOtpSchema,
  verifyOtpSchema,
  registerCitizenSchema,
  linkRosterSchema,
} from '../validators/auth.validator.js';

const router = Router();

// Matches the DataSource contract in gujarat-gov-quiz/lib/data/sources/http.source.js
router.post('/identity/lookup', validateRequest(identityLookupSchema), lookupIdentity);
router.post('/otp/request', validateRequest(requestOtpSchema), requestOtp);
router.post('/otp/verify', validateRequest(verifyOtpSchema), verifyOtp);
router.post('/citizen/register', validateRequest(registerCitizenSchema), registerCitizen);
router.post('/roster/link', validateRequest(linkRosterSchema), linkRoster);

export default router;
