import { Router } from 'express';
import { getExplanations, getQuestions, getQuiz, listQuizzes } from '../controllers/quiz.controller.js';
import { submitAttempt } from '../controllers/attempt.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { submitAttemptSchema } from '../validators/attempt.validator.js';

const router = Router();

// Matches the DataSource contract in gujarat-gov-quiz/lib/data/sources/http.source.js
router.get('/', listQuizzes);
router.get('/:quizId', getQuiz);
router.get('/:quizId/questions', getQuestions);
router.get('/:quizId/explanations', getExplanations);

// Not yet in the frontend's dummy contract — the attempt flow there is still
// localStorage-only. This is where it plugs in once wired up client-side.
router.post('/:quizId/attempts', requireAuth, validateRequest(submitAttemptSchema), submitAttempt);

export default router;
