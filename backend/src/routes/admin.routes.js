import { Router } from 'express';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { requireAdminAuth, requireMaster } from '../middlewares/adminAuth.middleware.js';
import {
  adminLoginSchema,
  adminProfileUpdateSchema,
  adminCreateUserSchema,
  adminWorkQuotaSchema,
  questionUpdateSchema,
  questionReviewSchema,
  questionCommentSchema,
} from '../validators/admin.validator.js';
import {
  adminLogin,
  adminMe,
  adminUpdateMe,
  adminStats,
  adminAnalyticsDashboard,
  adminAnalyticsGeo,
  adminAnalyticsWeekly,
  adminAnalyticsCaste,
  adminWorkDashboard,
  adminSetWorkQuota,
  adminListQuestions,
  adminGetQuestion,
  adminUpdateQuestion,
  adminReviewQuestion,
  adminCommentQuestion,
  adminListUsers,
  adminCreateUser,
  adminSetUserActive,
} from '../controllers/admin.controller.js';

const router = Router();

router.post('/login', validateRequest(adminLoginSchema), adminLogin);

router.use(requireAdminAuth);

router.get('/me', adminMe);
router.patch('/me', validateRequest(adminProfileUpdateSchema), adminUpdateMe);

router.get('/stats', adminStats);
router.get('/work/dashboard', adminWorkDashboard);
router.post('/work/quota', requireMaster, validateRequest(adminWorkQuotaSchema), adminSetWorkQuota);
router.get('/analytics', adminAnalyticsDashboard);
router.get('/analytics/geo', adminAnalyticsGeo);
router.get('/analytics/weekly', adminAnalyticsWeekly);
router.get('/analytics/caste', adminAnalyticsCaste);

router.get('/questions', adminListQuestions);
router.get('/questions/:queId', adminGetQuestion);
router.patch('/questions/:queId', validateRequest(questionUpdateSchema), adminUpdateQuestion);
router.post(
  '/questions/:queId/review',
  validateRequest(questionReviewSchema),
  adminReviewQuestion
);
router.post(
  '/questions/:queId/comments',
  validateRequest(questionCommentSchema),
  adminCommentQuestion
);

router.get('/users', requireMaster, adminListUsers);
router.post('/users', requireMaster, validateRequest(adminCreateUserSchema), adminCreateUser);
router.patch('/users/:id/active', requireMaster, adminSetUserActive);

export default router;
