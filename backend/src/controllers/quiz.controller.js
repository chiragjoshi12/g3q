import { quizService } from '../services/quiz.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const listQuizzes = asyncHandler(async (req, res) => {
  const quizzes = await quizService.listQuizzes();
  return res.status(200).json(quizzes);
});

export const getQuiz = asyncHandler(async (req, res) => {
  const quiz = await quizService.getQuizById(req.params.quizId);
  return res.status(200).json(quiz);
});

export const getQuestions = asyncHandler(async (req, res) => {
  const questions = await quizService.getQuestions(req.params.quizId);
  return res.status(200).json(questions);
});

export const getExplanations = asyncHandler(async (req, res) => {
  const explanations = await quizService.getExplanations(req.params.quizId);
  return res.status(200).json(explanations);
});
