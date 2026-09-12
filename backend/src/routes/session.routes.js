import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  startSessionSchema,
  submitSessionSchema,
  lockSessionQuestionSchema,
} from '../validators/session.validator.js';
import {
  startSession,
  getSession,
  lockSessionQuestion,
  submitSession,
  getSessionResult,
  listMySessions,
  myCurrentSession,
  mySessionStats,
  clearMySessions,
} from '../controllers/session.controller.js';

const router = Router();

router.use(requireAuth);

router.post('/', validateRequest(startSessionSchema), startSession);
router.get('/', listMySessions);
router.delete('/', clearMySessions);
router.get('/current', myCurrentSession);
router.get('/stats', mySessionStats);
router.get('/:sessionId', getSession);
router.get('/:sessionId/result', getSessionResult);
router.post(
  '/:sessionId/questions/:queId/lock',
  validateRequest(lockSessionQuestionSchema),
  lockSessionQuestion
);
router.post('/:sessionId/submit', validateRequest(submitSessionSchema), submitSession);

export default router;
