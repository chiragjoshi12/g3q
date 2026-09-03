import { AppError, ERROR_CODE } from '../utils/appError.js';
import { ADMIN_ROLE } from '../config/admin.roles.js';
import { AdminUserModel } from '../models/AdminUserModel.js';
import { AdminWorkModel } from '../models/AdminWorkModel.js';
import { BankQuestionModel } from '../models/BankQuestionModel.js';
import { IST_TIMEZONE, istTodayYmd } from '../utils/istDate.js';

const toReviewerPayload = async (admin, ymd) => {
  const stats = await AdminWorkModel.reviewerStats(admin, ymd);
  const recent_days = await AdminWorkModel.recentDayCounts(
    admin.id,
    ymd,
    14,
    stats.daily_quota
  );
  return { ...stats, recent_days };
};

export const adminWorkService = {
  async dashboard(actor) {
    const ymd = istTodayYmd();
    const bank = await BankQuestionModel.stats();
    const unassignedPending = await AdminWorkModel.countUnassignedPending();

    if (actor.role === ADMIN_ROLE.MASTER) {
      const quotas = await AdminWorkModel.listActiveQuotas();
      await Promise.all(
        quotas
          .filter((q) => q.admin?.isActive && q.admin.role === ADMIN_ROLE.ADMIN)
          .map((q) =>
            AdminWorkModel.fillDailyQuota({
              adminId: q.adminId,
              assignedById: actor.id,
              dailyQuota: q.dailyQuota,
              ymd,
            })
          )
      );
    } else {
      const quota = await AdminWorkModel.getQuota(actor.id);
      if (quota?.isActive) {
        await AdminWorkModel.fillDailyQuota({
          adminId: actor.id,
          assignedById: actor.id,
          dailyQuota: quota.dailyQuota,
          ymd,
        });
      }
    }

    const meUser = await AdminUserModel.findById(actor.id);
    const meQuota = await AdminWorkModel.getQuota(actor.id);
    const me = await toReviewerPayload({ ...meUser, workQuota: meQuota }, ymd);
    const my_queue = await AdminWorkModel.queuePreview(actor.id, actor.role === ADMIN_ROLE.MASTER ? 8 : 15);

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
      my_queue,
    };

    if (actor.role === ADMIN_ROLE.MASTER) {
      const reviewers = await AdminWorkModel.listReviewers();
      payload.reviewers = await Promise.all(reviewers.map((row) => toReviewerPayload(row, ymd)));
      payload.recent_days = await AdminWorkModel.overallRecentDayCounts(ymd, 14);

      const shortfall = payload.reviewers.filter(
        (r) => r.quota_active && r.is_active && r.assigned_today < r.daily_quota
      );
      payload.warnings = [];
      if (unassignedPending === 0 && shortfall.length) {
        payload.warnings.push('No unassigned pending questions left to allocate.');
      } else if (shortfall.length) {
        payload.warnings.push(
          `Pending pool is short: ${shortfall.length} reviewer(s) did not receive a full daily batch.`
        );
      }
    } else {
      payload.recent_days = me.recent_days;
      payload.warnings = [];
      if (me.quota_active && me.assigned_today < me.daily_quota && unassignedPending === 0) {
        payload.warnings.push('The pending pool is empty, so today’s remaining questions could not all be assigned.');
      }
    }

    return payload;
  },

  async setQuota(body, actor) {
    const admin = await AdminUserModel.findById(body.admin_id);
    if (!admin) throw new AppError(ERROR_CODE.NOT_FOUND, 'Admin user not found.');
    if (admin.role === ADMIN_ROLE.MASTER) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Cannot assign a review quota to the master admin.');
    }

    const quota = await AdminWorkModel.upsertQuota({
      adminId: admin.id,
      dailyQuota: body.daily_quota,
      isActive: body.is_active,
      notes: body.notes ?? null,
      createdById: actor.id,
    });

    let allocation = { created: 0, requested: 0, available: 0 };
    if (quota.isActive && admin.isActive) {
      allocation = await AdminWorkModel.fillDailyQuota({
        adminId: admin.id,
        assignedById: actor.id,
        dailyQuota: quota.dailyQuota,
        ymd: istTodayYmd(),
      });
    }

    const stats = await toReviewerPayload({ ...admin, workQuota: quota }, istTodayYmd());
    return { quota: { daily_quota: quota.dailyQuota, is_active: quota.isActive, notes: quota.notes }, allocation, reviewer: stats };
  },
};
