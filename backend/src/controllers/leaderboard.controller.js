import { asyncHandler } from '../middlewares/error.middleware.js';
import { leaderboardService } from '../services/leaderboard.service.js';
import {
  globalLeaderboardQuerySchema,
  schoolLeaderboardQuerySchema,
  talukaLeaderboardQuerySchema,
} from '../validators/leaderboard.validator.js';

export const schoolLeaderboard = asyncHandler(async (req, res) => {
  const query = schoolLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.school({
    userId: req.user?.id ?? null,
    schoolId: query.school_id,
    institute: query.institute,
    talukaId: query.taluka,
    lang: query.lang,
    limit: query.limit,
  });
  return res.status(200).json(result);
});

export const leaderboardOverview = asyncHandler(async (req, res) => {
  const query = globalLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.overview({
    userId: req.user?.id ?? null,
    talukaId: query.taluka,
    lang: query.lang,
    limit: query.limit,
  });
  return res.status(200).json(result);
});

export const talukaLeaderboard = asyncHandler(async (req, res) => {
  const query = talukaLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.taluka({
    userId: req.user?.id ?? null,
    talukaId: query.taluka,
    lang: query.lang,
    limit: query.limit,
  });
  return res.status(200).json(result);
});

export const collegeLeaderboard = asyncHandler(async (req, res) => {
  const query = globalLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.college({
    userId: req.user?.id ?? null,
    talukaId: query.taluka,
    lang: query.lang,
    limit: query.limit,
  });
  return res.status(200).json(result);
});

export const citizenLeaderboard = asyncHandler(async (req, res) => {
  const query = globalLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.citizen({
    userId: req.user?.id ?? null,
    talukaId: query.taluka,
    lang: query.lang,
    limit: query.limit,
  });
  return res.status(200).json(result);
});
