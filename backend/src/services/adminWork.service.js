import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';
import { AdminWorkModel } from '../models/AdminWorkModel.js';
import { BankQuestionModel } from '../models/BankQuestionModel.js';
import { IST_TIMEZONE, istTodayYmd } from '../utils/istDate.js';

const toReviewerPayload = async (admin, ymd, { includeDays = false } = {}) => {
  const [stats, assignment_history] = await Promise.all([
    AdminWorkModel.reviewerStats(admin),
    AdminWorkModel.assignmentHistory(admin.id),
  ]);
  const payload = { ...stats, assignment_history };
  if (includeDays) {
    payload.recent_days = await AdminWorkModel.recentDayCounts(admin.id, ymd);
  }
  return payload;
};

export const adminWorkService = {
  async dashboard(actor) {
    const ymd = istTodayYmd();
    const bank = await BankQuestionModel.stats();
    const unassignedPending = await AdminWorkModel.countUnassignedPending();

    const meUser = await AdminUserModel.findById(actor.id);
    const me = await toReviewerPayload(meUser, ymd, {
      includeDays: actor.role !== ADMIN_ROLE.MASTER,
    });

    const payload = {
      date: ymd,
      timezone: IST_TIMEZONE,
      bank: {
        total: bank.total_questions,
        pending: bank.review_pending,
        accepted: bank.review_accepted,
        rejected: bank.review_rejected,
        unassigned_pending: unassignedPending,
      },
      me,
      my_comments: [],
      warnings: [],
    };

    if (actor.role === ADMIN_ROLE.MASTER) {
      const reviewers = await AdminWorkModel.listReviewers();
      payload.reviewers = await Promise.all(reviewers.map((row) => toReviewerPayload(row, ymd)));
      payload.recent_days = await AdminWorkModel.overallRecentDayCounts(ymd, 14);
      if (unassignedPending === 0) {
        payload.warnings.push('No unassigned pending questions left to allocate.');
      }
    } else {
      payload.recent_days = me.recent_days;
      payload.my_comments = await AdminWorkModel.commentedQuestions(actor.id, 12);
    }

    return payload;
  },

  async allocate(body, actor) {
    const admin = await AdminUserModel.findById(body.admin_id);
    if (!admin) throw new AppError(ERROR_CODE.NOT_FOUND, 'Admin user not found.');
    if (admin.role === ADMIN_ROLE.MASTER) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot assign questions to the master admin.');
    }
    if (!admin.isActive) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot assign questions to an inactive admin.');
    }

    const allocation = await AdminWorkModel.allocatePending({
      adminId: admin.id,
      assignedById: actor.id,
      count: body.count,
      ymd: istTodayYmd(),
    });
    const stats = await toReviewerPayload(admin, istTodayYmd());
    return { allocation, reviewer: stats };
  },

  async unassign(body, actor) {
    const admin = await AdminUserModel.findById(body.admin_id);
    if (!admin) throw new AppError(ERROR_CODE.NOT_FOUND, 'Admin user not found.');
    if (admin.role === ADMIN_ROLE.MASTER) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot change the master admin queue.');
    }

    const allocation = await AdminWorkModel.unassignPending({
      adminId: admin.id,
      count: body.count,
      batchId: body.batch_id ?? null,
    });
    const stats = await toReviewerPayload(admin, istTodayYmd());
    return { allocation, reviewer: stats };
  },
};
