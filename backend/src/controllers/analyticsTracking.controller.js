import { asyncHandler } from '../middlewares/error.middleware.js';
import { analyticsTrackingService } from '../services/analyticsTracking.service.js';

export const trackAnalyticsEvent = asyncHandler(async (req, res) => {
  const result = await analyticsTrackingService.trackEvent(req.body, {
    userId: req.user?.id ?? null,
  });
  return res.status(202).json(result);
});
