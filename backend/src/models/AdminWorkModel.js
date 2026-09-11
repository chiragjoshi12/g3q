import { prisma } from '../config/prisma.client.js';
import { istDateValue, istTodayYmd } from '../utils/istDate.js';
import { flattenVariantRow } from './BankQuestionModel.js';

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
    return prisma.questionVariant.count({
      where: {
        reviewStatus: 'PENDING',
        assignment: { is: null },
      },
    });
  }

  /** Assign up to `count` unassigned PENDING variants to an admin. */
  static async allocatePending({ adminId, assignedById, count }) {
    if (count <= 0) {
      return { created: 0, requested: count, available: 0 };
    }

    const assignmentDate = istDateValue(istTodayYmd());

    return prisma.$transaction(async (tx) => {
      const pool = await tx.questionVariant.findMany({
        where: {
          reviewStatus: 'PENDING',
          assignment: { is: null },
        },
        orderBy: { id: 'asc' },
        take: count,
        select: { id: true },
      });

      if (!pool.length) {
        return { created: 0, requested: count, available: 0 };
      }

      const result = await tx.adminQuestionAssignment.createMany({
        data: pool.map((q) => ({
          adminId,
          variantId: q.id,
          assignmentDate,
          assignedById,
        })),
        skipDuplicates: true,
      });

      return {
        created: result.count,
        requested: count,
        available: pool.length,
      };
    });
  }

  /** Take back up to `count` still-PENDING assignments (newest first). */
  static async unassignPending({ adminId, count }) {
    if (count <= 0) {
      return { released: 0, requested: count };
    }

    return prisma.$transaction(async (tx) => {
      const rows = await tx.adminQuestionAssignment.findMany({
        where: {
          adminId,
          variant: { reviewStatus: 'PENDING' },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: count,
        select: { id: true },
      });

      if (!rows.length) {
        return { released: 0, requested: count };
      }

      await tx.adminQuestionAssignment.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });

      return { released: rows.length, requested: count };
    });
  }

  static async reviewerStats(admin) {
    const [assignedTotal, assignedOpen, accepted, rejected] = await Promise.all([
      prisma.adminQuestionAssignment.count({ where: { adminId: admin.id } }),
      prisma.adminQuestionAssignment.count({
        where: {
          adminId: admin.id,
          variant: { reviewStatus: 'PENDING' },
        },
      }),
      prisma.questionVariant.count({
        where: { reviewedById: admin.id, reviewStatus: 'ACCEPTED' },
      }),
      prisma.questionVariant.count({
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

  static async commentedQuestions(adminId, take = 12) {
    const rows = await prisma.questionVariantComment.findMany({
      where: { userId: adminId },
      orderBy: { createdAt: 'desc' },
      take: 80,
      include: {
        variant: {
          include: { root: true },
        },
      },
    });

    const byVariant = new Map();
    for (const row of rows) {
      const flat = flattenVariantRow(row.variant);
      const queId = flat?.queId;
      if (!queId) continue;
      const existing = byVariant.get(queId);
      if (!existing) {
        byVariant.set(queId, {
          que_id: queId,
          question_en: flat.questionEn ?? null,
          question_gu: flat.questionGu ?? null,
          review_status: flat.reviewStatus ?? 'PENDING',
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

    const items = [...byVariant.values()].slice(0, take);
    if (!items.length) return items;

    const variants = await prisma.questionVariant.findMany({
      where: { legacyQueId: { in: items.map((item) => item.que_id) } },
      select: { id: true, legacyQueId: true },
    });
    const idByQue = new Map(variants.map((v) => [v.legacyQueId, v.id]));
    const counts = await prisma.questionVariantComment.groupBy({
      by: ['variantId'],
      where: {
        userId: adminId,
        variantId: { in: variants.map((v) => v.id) },
      },
      _count: { _all: true },
    });
    const countByVariant = new Map(counts.map((row) => [row.variantId, row._count._all]));
    return items.map((item) => ({
      ...item,
      comment_count:
        countByVariant.get(idByQue.get(item.que_id)) || item.comment_count,
    }));
  }

  static findAssignment(queId) {
    return prisma.adminQuestionAssignment.findFirst({
      where: { variant: { legacyQueId: queId } },
      include: assignmentInclude,
    });
  }
}
