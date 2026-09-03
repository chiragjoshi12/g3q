import { asyncHandler } from '../middlewares/error.middleware.js';
import { adminAuthService } from '../services/adminAuth.service.js';
import { adminQuestionService } from '../services/adminQuestion.service.js';
import { adminAnalyticsService } from '../services/adminAnalytics.service.js';
import { adminWorkService } from '../services/adminWork.service.js';
import { questionListQuerySchema } from '../validators/admin.validator.js';
import {
  analyticsQuerySchema,
  analyticsGeoQuerySchema,
} from '../validators/analytics.validator.js';

export const adminLogin = asyncHandler(async (req, res) => {
  const result = await adminAuthService.login(req.body);
  return res.status(200).json(result);
});

export const adminMe = asyncHandler(async (req, res) => {
  const profile = await adminAuthService.me(req.admin.id);
  return res.status(200).json(profile);
});

export const adminUpdateMe = asyncHandler(async (req, res) => {
  const profile = await adminAuthService.updateMe(req.admin.id, req.body);
  return res.status(200).json(profile);
});

export const adminStats = asyncHandler(async (req, res) => {
  const stats = await adminQuestionService.stats();
  return res.status(200).json(stats);
});

export const adminAnalyticsDashboard = asyncHandler(async (req, res) => {
  const filters = analyticsQuerySchema.parse(req.query);
  const data = await adminAnalyticsService.dashboard(filters);
  return res.status(200).json(data);
});

export const adminAnalyticsGeo = asyncHandler(async (req, res) => {
  const filters = analyticsGeoQuerySchema.parse(req.query);
  const data = await adminAnalyticsService.geo(filters);
  return res.status(200).json(data);
});

export const adminAnalyticsWeekly = asyncHandler(async (req, res) => {
  const filters = analyticsQuerySchema.parse(req.query);
  const data = await adminAnalyticsService.weekly(filters);
  return res.status(200).json(data);
});

export const adminAnalyticsCaste = asyncHandler(async (req, res) => {
  const filters = analyticsQuerySchema.parse(req.query);
  const data = await adminAnalyticsService.caste(filters);
  return res.status(200).json(data);
});

export const adminWorkDashboard = asyncHandler(async (req, res) => {
  const data = await adminWorkService.dashboard(req.admin);
  return res.status(200).json(data);
});

export const adminSetWorkQuota = asyncHandler(async (req, res) => {
  const result = await adminWorkService.setQuota(req.body, req.admin);
  return res.status(200).json(result);
});

export const adminListQuestions = asyncHandler(async (req, res) => {
  const query = questionListQuerySchema.parse(req.query);
  const result = await adminQuestionService.list(query, req.admin);
  return res.status(200).json(result);
});

export const adminGetQuestion = asyncHandler(async (req, res) => {
  const detail = await adminQuestionService.get(req.params.queId);
  return res.status(200).json(detail);
});

export const adminUpdateQuestion = asyncHandler(async (req, res) => {
  const detail = await adminQuestionService.update(req.params.queId, req.body, req.admin);
  return res.status(200).json(detail);
});

export const adminReviewQuestion = asyncHandler(async (req, res) => {
  const detail = await adminQuestionService.review(req.params.queId, req.body, req.admin);
  return res.status(200).json(detail);
});

export const adminCommentQuestion = asyncHandler(async (req, res) => {
  const detail = await adminQuestionService.comment(req.params.queId, req.body, req.admin);
  return res.status(200).json(detail);
});

export const adminListUsers = asyncHandler(async (req, res) => {
  const result = await adminAuthService.listUsers();
  return res.status(200).json(result);
});

export const adminCreateUser = asyncHandler(async (req, res) => {
  const user = await adminAuthService.createUser(req.body);
  if (req.body.daily_quota && user.role === 'admin') {
    await adminWorkService.setQuota(
      {
        admin_id: user.id,
        daily_quota: req.body.daily_quota,
        is_active: true,
      },
      req.admin
    );
  }
  return res.status(201).json(user);
});

export const adminSetUserActive = asyncHandler(async (req, res) => {
  const active = String(req.query.active).toLowerCase() === 'true';
  const user = await adminAuthService.setUserActive(Number(req.params.id), active);
  return res.status(200).json(user);
});
