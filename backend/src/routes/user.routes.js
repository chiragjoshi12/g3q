import { Router } from 'express';
import { getMe } from '../controllers/user.controller.js';
import { clearMyAttempts, listMyAttempts, myAttemptStats } from '../controllers/attempt.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Matches profileController.loadOverview()/clearHistory() in
// gujarat-gov-quiz/controllers/profile.controller.js.
router.get('/me', requireAuth, getMe);
router.get('/me/attempts', requireAuth, listMyAttempts);
router.get('/me/attempts/stats', requireAuth, myAttemptStats);
router.delete('/me/attempts', requireAuth, clearMyAttempts);

export default router;
