import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';
import { AdminWorkModel } from '../models/AdminWorkModel.js';
import { BankQuestionModel } from '../models/BankQuestionModel.js';
import { IST_TIMEZONE, istTodayYmd } from '../utils/istDate.js';

export const adminWorkService = {
  async dashboard(actor) {
    const ymd = istTodayYmd();
    const bank = await BankQuestionModel.stats();
    const unassignedPending = await AdminWorkModel.countUnassignedPending();

    const meUser = await AdminUserModel.findById(actor.id);
    const me = await AdminWorkModel.reviewerStats(meUser);

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
      payload.reviewers = await Promise.all(
        reviewers.map((row) => AdminWorkModel.reviewerStats(row))
      );
      if (unassignedPending === 0) {
        payload.warnings.push('No unassigned pending questions left to allocate.');
      }
    } else {
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
    });
    const reviewer = await AdminWorkModel.reviewerStats(admin);
    return { allocation, reviewer };
  },

  async unassign(body) {
    const admin = await AdminUserModel.findById(body.admin_id);
    if (!admin) throw new AppError(ERROR_CODE.NOT_FOUND, 'Admin user not found.');
    if (admin.role === ADMIN_ROLE.MASTER) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot change the master admin queue.');
    }

    const allocation = await AdminWorkModel.unassignPending({
      adminId: admin.id,
      count: body.count,
    });
    const reviewer = await AdminWorkModel.reviewerStats(admin);
    return { allocation, reviewer };
  },
};
