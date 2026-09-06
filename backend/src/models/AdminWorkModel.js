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
   * Each call is its own history batch, even on the same day.
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

      const batch = await tx.adminWorkBatch.create({
        data: {
          adminId,
          assignedById,
          assignmentDate,
          allocated: pool.length,
        },
      });

      const result = await tx.adminQuestionAssignment.createMany({
        data: pool.map((q) => ({
          adminId,
          queId: q.queId,
          batchId: batch.id,
          assignmentDate,
          assignedById,
        })),
        skipDuplicates: true,
      });

      return {
        created: result.count,
        requested: count,
        available: pool.length,
        batch_id: batch.id,
      };
    });
  }

  /**
   * Take back up to `count` still-PENDING assignments. Newest batches first
   * unless `batchId` is set. Reviewed questions stay assigned.
   */
  static async unassignPending({ adminId, count, batchId }) {
    if (count <= 0) {
      return { released: 0, requested: count };
    }

    return prisma.$transaction(async (tx) => {
      const rows = await tx.adminQuestionAssignment.findMany({
        where: {
          adminId,
          ...(batchId ? { batchId } : {}),
          question: { reviewStatus: 'PENDING' },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: count,
        select: { id: true, batchId: true },
      });

      if (!rows.length) {
        return { released: 0, requested: count };
      }

      await tx.adminQuestionAssignment.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });

      const releasedByBatch = new Map();
      for (const row of rows) {
        releasedByBatch.set(row.batchId, (releasedByBatch.get(row.batchId) || 0) + 1);
      }
      await Promise.all(
        [...releasedByBatch.entries()].map(([id, released]) =>
          tx.adminWorkBatch.update({
            where: { id },
            data: { released: { increment: released } },
          })
        )
      );

      return { released: rows.length, requested: count };
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

  static async reviewerStats(admin) {
    const [
      assignedTotal,
      assignedOpen,
      accepted,
      rejected,
    ] = await Promise.all([
      prisma.adminQuestionAssignment.count({ where: { adminId: admin.id } }),
      prisma.adminQuestionAssignment.count({
        where: {
          adminId: admin.id,
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

    const reviewed = accepted + rejected;
    const remaining = assignedOpen;
    const progressPct =
      assignedTotal > 0
        ? Math.min(100, Math.round(((assignedTotal - assignedOpen) / assignedTotal) * 100))
        : 0;

    let status = 'not_started';
    if (!admin.isActive) status = 'inactive';
    else if (assignedTotal > 0 && reviewed > 0 && assignedOpen > 0) status = 'in_progress';
    else if (assignedTotal > 0 && assignedOpen === 0) status = 'done';

    return {
      admin_id: admin.id,
      username: admin.username,
      full_name: admin.fullName ?? null,
      role: admin.role,
      is_active: Boolean(admin.isActive),
      assigned_total: assignedTotal,
      assigned_open: assignedOpen,
      remaining,
      reviewed,
      accepted,
      rejected,
      progress_pct: progressPct,
      status,
    };
  }

  static async assignmentHistory(adminId) {
    const batches = await prisma.adminWorkBatch.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        allocated: true,
        released: true,
        assignmentDate: true,
        createdAt: true,
      },
    });
    if (!batches.length) return [];

    const pendingCounts = await prisma.adminQuestionAssignment.groupBy({
      by: ['batchId'],
      where: {
        adminId,
        question: { reviewStatus: 'PENDING' },
      },
      _count: { _all: true },
    });
    const pendingByBatch = new Map(
      pendingCounts.map((row) => [row.batchId, row._count._all])
    );

    return batches.map((batch) => {
      const remaining = pendingByBatch.get(batch.id) || 0;
      const kept = Math.max(0, batch.allocated - batch.released);
      let status = 'not_started';
      if (kept === 0) status = 'withdrawn';
      else if (remaining === 0) status = 'done';
      else if (remaining < kept) status = 'in_progress';
      return {
        id: batch.id,
        date: ymdFromDate(batch.assignmentDate),
        created_at: batch.createdAt.toISOString(),
        count: batch.allocated,
        remaining,
        released: batch.released,
        status,
      };
    });
  }

  static async recentDayCounts(adminId, ymd) {
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
        const target = assigned;
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

  static async commentedQuestions(adminId, take = 12) {
    const rows = await prisma.bankQuestionComment.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        question: {
          select: {
            queId: true,
            questionEn: true,
            questionGu: true,
            reviewStatus: true,
          },
        },
      },
    });

    const byQue = new Map();
    for (const row of rows) {
      const existing = byQue.get(row.queId);
      if (!existing) {
        byQue.set(row.queId, {
          que_id: row.queId,
          question_en: row.question?.questionEn ?? null,
          question_gu: row.question?.questionGu ?? null,
          review_status: row.question?.reviewStatus ?? 'PENDING',
          comment_count: 1,
          latest_comment: {
            id: row.id,
            body: row.body,
            created_at: row.createdAt ? row.createdAt.toISOString() : null,
          },
        });
      } else {
        existing.comment_count += 1;
      }
    }

    const items = [...byQue.values()].slice(0, take);
    if (!items.length) return items;

    const counts = await prisma.bankQuestionComment.groupBy({
      by: ['queId'],
      where: {
        userId: adminId,
        queId: { in: items.map((item) => item.que_id) },
      },
      _count: { _all: true },
    });
    const countByQue = new Map(counts.map((row) => [row.queId, row._count._all]));
    return items.map((item) => ({
      ...item,
      comment_count: countByQue.get(item.que_id) || item.comment_count,
    }));
  }

  static findAssignment(queId) {
    return prisma.adminQuestionAssignment.findUnique({
      where: { queId },
      include: assignmentInclude,
    });
  }
}
