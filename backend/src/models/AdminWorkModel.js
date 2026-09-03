import { prisma } from '../config/prisma.client.js';
import { istDateValue, istDayBounds, istDaysInclusive, recentIstDays, ymdFromDate } from '../utils/istDate.js';

const assignmentInclude = {
  admin: { select: { id: true, username: true, fullName: true } },
};

export class AdminWorkModel {
  static async getQuota(adminId) {
    return prisma.adminWorkQuota.findUnique({ where: { adminId } });
  }

  static async upsertQuota({ adminId, dailyQuota, isActive, notes, createdById }) {
    return prisma.adminWorkQuota.upsert({
      where: { adminId },
      create: {
        adminId,
        dailyQuota,
        isActive: isActive ?? true,
        notes: notes ?? null,
        createdById,
      },
      update: {
        dailyQuota,
        isActive: isActive ?? true,
        notes: notes === undefined ? undefined : notes,
        createdById,
      },
    });
  }

  static async listActiveQuotas() {
    return prisma.adminWorkQuota.findMany({
      where: { isActive: true },
      include: {
        admin: {
          select: { id: true, username: true, fullName: true, role: true, isActive: true },
        },
      },
    });
  }

  static async listReviewers() {
    return prisma.adminUser.findMany({
      where: { role: 'admin' },
      orderBy: { username: 'asc' },
      include: { workQuota: true },
    });
  }

  static async countUnassignedPending() {
    return prisma.bankQuestion.count({
      where: {
        reviewStatus: 'PENDING',
        assignment: { is: null },
      },
    });
  }

  /**
   * Assign up to `count` unassigned PENDING questions to an admin for `ymd`.
   * Safe to call repeatedly — unique que_id prevents double assignment.
   */
  static async allocatePending({ adminId, assignedById, count, ymd }) {
    if (count <= 0) {
      return { created: 0, requested: count, available: 0 };
    }

    const assignmentDate = istDateValue(ymd);

    return prisma.$transaction(async (tx) => {
      const pool = await tx.bankQuestion.findMany({
        where: {
          reviewStatus: 'PENDING',
          assignment: { is: null },
        },
        orderBy: { id: 'asc' },
        take: count,
        select: { queId: true },
      });

      if (!pool.length) {
        return { created: 0, requested: count, available: 0 };
      }

      const result = await tx.adminQuestionAssignment.createMany({
        data: pool.map((q) => ({
          adminId,
          queId: q.queId,
          assignmentDate,
          assignedById,
        })),
        skipDuplicates: true,
      });

      return { created: result.count, requested: count, available: pool.length };
    });
  }

  static async countAssignedOnDate(adminId, ymd) {
    return prisma.adminQuestionAssignment.count({
      where: { adminId, assignmentDate: istDateValue(ymd) },
    });
  }

  static async fillDailyQuota({ adminId, assignedById, dailyQuota, ymd }) {
    const already = await this.countAssignedOnDate(adminId, ymd);
    const need = Math.max(0, dailyQuota - already);
    if (need === 0) {
      return { created: 0, requested: 0, available: 0, already, dailyQuota };
    }
    const result = await this.allocatePending({ adminId, assignedById, count: need, ymd });
    return { ...result, already, dailyQuota };
  }

  static async reviewerStats(admin, ymd) {
    const { start, end } = istDayBounds(ymd);
    const quota = admin.workQuota ?? (await this.getQuota(admin.id));
    const dailyQuota = quota?.isActive ? quota.dailyQuota : 0;
    const quotaActive = Boolean(quota?.isActive);

    const [
      assignedToday,
      reviewedToday,
      acceptedToday,
      rejectedToday,
      queuePending,
      backlogPending,
      lifetimeAccepted,
      lifetimeRejected,
    ] = await Promise.all([
      this.countAssignedOnDate(admin.id, ymd),
      prisma.bankQuestion.count({
        where: {
          reviewedById: admin.id,
          reviewedAt: { gte: start, lte: end },
          reviewStatus: { in: ['ACCEPTED', 'REJECTED'] },
        },
      }),
      prisma.bankQuestion.count({
        where: {
          reviewedById: admin.id,
          reviewedAt: { gte: start, lte: end },
          reviewStatus: 'ACCEPTED',
        },
      }),
      prisma.bankQuestion.count({
        where: {
          reviewedById: admin.id,
          reviewedAt: { gte: start, lte: end },
          reviewStatus: 'REJECTED',
        },
      }),
      prisma.adminQuestionAssignment.count({
        where: {
          adminId: admin.id,
          question: { reviewStatus: 'PENDING' },
        },
      }),
      prisma.adminQuestionAssignment.count({
        where: {
          adminId: admin.id,
          assignmentDate: { lt: istDateValue(ymd) },
          question: { reviewStatus: 'PENDING' },
        },
      }),
      prisma.bankQuestion.count({
        where: { reviewedById: admin.id, reviewStatus: 'ACCEPTED' },
      }),
      prisma.bankQuestion.count({
        where: { reviewedById: admin.id, reviewStatus: 'REJECTED' },
      }),
    ]);

    const remainingToday = quotaActive ? Math.max(0, dailyQuota - reviewedToday) : 0;
    const progressPct =
      quotaActive && dailyQuota > 0
        ? Math.min(100, Math.round((reviewedToday / dailyQuota) * 100))
        : 0;

    let status = 'no_quota';
    if (!admin.isActive) status = 'inactive';
    else if (quota && !quota.isActive) status = 'paused';
    else if (quotaActive && remainingToday === 0 && dailyQuota > 0) status = 'done';
    else if (quotaActive && reviewedToday > 0) status = 'in_progress';
    else if (quotaActive) status = 'not_started';

    return {
      admin_id: admin.id,
      username: admin.username,
      full_name: admin.fullName ?? null,
      role: admin.role,
      is_active: Boolean(admin.isActive),
      daily_quota: dailyQuota,
      quota_active: quotaActive,
      quota_notes: quota?.notes ?? null,
      assigned_today: assignedToday,
      reviewed_today: reviewedToday,
      accepted_today: acceptedToday,
      rejected_today: rejectedToday,
      remaining_today: remainingToday,
      queue_pending: queuePending,
      backlog_pending: backlogPending,
      lifetime_accepted: lifetimeAccepted,
      lifetime_rejected: lifetimeRejected,
      lifetime_reviewed: lifetimeAccepted + lifetimeRejected,
      progress_pct: progressPct,
      status,
    };
  }

  static async recentDayCounts(adminId, ymd, _days = 14, dailyQuota = 0) {
    const first = await prisma.adminQuestionAssignment.findFirst({
      where: { adminId },
      orderBy: { assignmentDate: 'asc' },
      select: { assignmentDate: true },
    });
    if (!first) return [];
    const dates = istDaysInclusive(ymdFromDate(first.assignmentDate), ymd);
    const rows = await Promise.all(
      dates.map(async (day) => {
        const { start, end } = istDayBounds(day);
        const [reviewed, accepted, rejected, assigned] = await Promise.all([
          prisma.bankQuestion.count({
            where: {
              reviewedById: adminId,
              reviewedAt: { gte: start, lte: end },
              reviewStatus: { in: ['ACCEPTED', 'REJECTED'] },
            },
          }),
          prisma.bankQuestion.count({
            where: {
              reviewedById: adminId,
              reviewedAt: { gte: start, lte: end },
              reviewStatus: 'ACCEPTED',
            },
          }),
          prisma.bankQuestion.count({
            where: {
              reviewedById: adminId,
              reviewedAt: { gte: start, lte: end },
              reviewStatus: 'REJECTED',
            },
          }),
          prisma.adminQuestionAssignment.count({
            where: { adminId, assignmentDate: istDateValue(day) },
          }),
        ]);
        const target = dailyQuota > 0 ? dailyQuota : assigned;
        return {
          date: day,
          assigned,
          reviewed,
          accepted,
          rejected,
          remaining: Math.max(0, target - reviewed),
        };
      })
    );
    return rows;
  }

  static async overallRecentDayCounts(ymd, days = 14) {
    const dates = recentIstDays(days, ymd);
    return Promise.all(
      dates.map(async (day) => {
        const { start, end } = istDayBounds(day);
        const [reviewed, accepted, rejected, assigned] = await Promise.all([
          prisma.bankQuestion.count({
            where: {
              reviewedAt: { gte: start, lte: end },
              reviewStatus: { in: ['ACCEPTED', 'REJECTED'] },
            },
          }),
          prisma.bankQuestion.count({
            where: { reviewedAt: { gte: start, lte: end }, reviewStatus: 'ACCEPTED' },
          }),
          prisma.bankQuestion.count({
            where: { reviewedAt: { gte: start, lte: end }, reviewStatus: 'REJECTED' },
          }),
          prisma.adminQuestionAssignment.count({
            where: { assignmentDate: istDateValue(day) },
          }),
        ]);
        return {
          date: day,
          assigned,
          reviewed,
          accepted,
          rejected,
          remaining: Math.max(0, assigned - reviewed),
        };
      })
    );
  }

  static async queuePreview(adminId, take = 8) {
    const rows = await prisma.adminQuestionAssignment.findMany({
      where: {
        adminId,
        question: { reviewStatus: 'PENDING' },
      },
      include: {
        question: {
          select: {
            queId: true,
            questionEn: true,
            questionGu: true,
            reviewStatus: true,
            departmentEn: true,
            departmentGu: true,
          },
        },
      },
      orderBy: [{ assignmentDate: 'asc' }, { id: 'asc' }],
      take,
    });

    return rows.map((row) => ({
      que_id: row.question.queId,
      question_en: row.question.questionEn,
      question_gu: row.question.questionGu,
      department_en: row.question.departmentEn,
      department_gu: row.question.departmentGu,
      review_status: row.question.reviewStatus,
      assignment_date: ymdFromDate(row.assignmentDate),
    }));
  }

  static findAssignment(queId) {
    return prisma.adminQuestionAssignment.findUnique({
      where: { queId },
      include: assignmentInclude,
    });
  }
}
