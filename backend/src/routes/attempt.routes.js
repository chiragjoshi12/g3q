import { Router } from 'express';
import { getAttempt } from '../controllers/attempt.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:attemptId', requireAuth, getAttempt);

export default router;
