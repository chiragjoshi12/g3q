import { attemptService } from '../services/attempt.service.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

export const submitAttempt = asyncHandler(async (req, res) => {
  const attempt = await attemptService.finalizeAttempt(req.user.id, req.params.quizId, req.body);
  return res.status(201).json(attempt);
});

export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await attemptService.getAttempt(req.params.attemptId, req.user.id);
  return res.status(200).json(attempt);
});

export const listMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await attemptService.listMine(req.user.id);
  return res.status(200).json(attempts);
});

export const myAttemptStats = asyncHandler(async (req, res) => {
  const stats = await attemptService.statsMine(req.user.id);
  return res.status(200).json(stats);
});

export const clearMyAttempts = asyncHandler(async (req, res) => {
  const stats = await attemptService.clearMine(req.user.id);
  return res.status(200).json(stats);
});
