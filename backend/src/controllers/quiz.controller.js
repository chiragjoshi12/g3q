import { asyncHandler } from '../middlewares/error.middleware.js';
import { quizService } from '../services/quiz.service.js';

export const getPracticeBundle = asyncHandler(async (req, res) => {
  const bundle = await quizService.getPracticeBundle({
    quizId: req.query.quiz_id || 'practice',
    language: req.query.language || 'gu',
  });
  return res.status(200).json(bundle);
});
