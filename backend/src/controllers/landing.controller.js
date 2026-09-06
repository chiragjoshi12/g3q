import { asyncHandler } from '../middlewares/error.middleware.js';
import { landingService } from '../services/landing.service.js';

export const getLandingSummary = asyncHandler(async (_req, res) => {
  const summary = await landingService.summary();
  return res.status(200).json(summary);
});
