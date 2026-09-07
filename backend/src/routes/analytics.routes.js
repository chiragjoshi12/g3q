import { Router } from 'express';
import { optionalAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { requireAnalyticsAuth } from '../middlewares/adminAuth.middleware.js';
import { adminLoginSchema } from '../validators/admin.validator.js';
import { analyticsEventSchema } from '../validators/analyticsEvent.validator.js';
import { analyticsLogin, analyticsMe } from '../controllers/analyticsAuth.controller.js';
import { trackAnalyticsEvent } from '../controllers/analyticsTracking.controller.js';

const router = Router();

router.post('/events', optionalAuth, validateRequest(analyticsEventSchema), trackAnalyticsEvent);
router.post('/login', validateRequest(adminLoginSchema), analyticsLogin);
router.get('/me', requireAnalyticsAuth, analyticsMe);

export default router;
