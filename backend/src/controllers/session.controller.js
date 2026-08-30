import { asyncHandler } from '../middlewares/error.middleware.js';
import { sessionService } from '../services/session.service.js';
import { listSessionsQuerySchema } from '../validators/session.validator.js';

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
  const result = await sessionService.submit({
    userId: req.user.id,
    sessionId: req.params.sessionId,
    answers: req.body.answers,
    timings: req.body.timings,
    startedAt: req.body.startedAt,
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
  const query = listSessionsQuerySchema.parse(req.query);
  const result = await sessionService.listMine({
    userId: req.user.id,
    page: query.page,
    pageSize: query.page_size,
  });
  return res.status(200).json(result);
});

export const mySessionStats = asyncHandler(async (req, res) => {
  const stats = await sessionService.stats(req.user.id);
  return res.status(200).json(stats);
});
