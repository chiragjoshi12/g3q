import { asyncHandler } from '../middlewares/error.middleware.js';
import { sessionService } from '../services/session.service.js';

export const startSession = asyncHandler(async (req, res) => {
  const result = await sessionService.start({
    userId: req.user.id,
    count: req.body.count,
    language: req.body.language,
  });
  return res.status(201).json(result);
});

export const getSession = asyncHandler(async (req, res) => {
  const result = await sessionService.get({
    userId: req.user.id,
    sessionId: req.params.sessionId,
  });
  return res.status(200).json(result);
});

export const submitSession = asyncHandler(async (req, res) => {
  // `abandoned` lets the server persist a left-midway attempt separately from a completed one.
  const result = await sessionService.submit({
    userId: req.user.id,
    sessionId: req.params.sessionId,
    answers: req.body.answers,
    timings: req.body.timings,
    startedAt: req.body.startedAt,
    abandoned: req.body.abandoned,
  });
  return res.status(200).json(result);
});

export const getSessionResult = asyncHandler(async (req, res) => {
  const result = await sessionService.getResult({
    userId: req.user.id,
    sessionId: req.params.sessionId,
  });
  return res.status(200).json(result);
});

export const listMySessions = asyncHandler(async (req, res) => {
  const result = await sessionService.listMine({ userId: req.user.id });
  return res.status(200).json(result);
});

export const myCurrentSession = asyncHandler(async (req, res) => {
  const result = await sessionService.currentMine({ userId: req.user.id });
  return res.status(200).json(result);
});

export const mySessionStats = asyncHandler(async (req, res) => {
  const stats = await sessionService.stats(req.user.id);
  return res.status(200).json(stats);
});
