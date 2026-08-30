import { asyncHandler } from '../middlewares/error.middleware.js';
import { leaderboardService } from '../services/leaderboard.service.js';
import {
  schoolLeaderboardQuerySchema,
  talukaLeaderboardQuerySchema,
} from '../validators/leaderboard.validator.js';

export const schoolLeaderboard = asyncHandler(async (req, res) => {
  const query = schoolLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.school({
    userId: req.user.id,
    schoolId: query.school_id,
    institute: query.institute,
    limit: query.limit,
  });
  return res.status(200).json(result);
});

export const talukaLeaderboard = asyncHandler(async (req, res) => {
  const query = talukaLeaderboardQuerySchema.parse(req.query);
  const result = await leaderboardService.taluka({
    userId: req.user.id,
    taluka: query.taluka,
    limit: query.limit,
  });
  return res.status(200).json(result);
});
