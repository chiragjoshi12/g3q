import { prisma } from '../config/prisma.client.js';
import { ymdFromDate } from '../utils/istDate.js';

const OPTION_GU = {
  A: 'optionAGu',
  B: 'optionBGu',
  C: 'optionCGu',
  D: 'optionDGu',
};
const OPTION_EN = {
  A: 'optionAEn',
  B: 'optionBEn',
  C: 'optionCEn',
  D: 'optionDEn',
};

const deriveAnswer = (row, map) => {
  if (!row?.correctOption) return null;
  const key = map[String(row.correctOption).toUpperCase()];
  return key ? row[key] ?? null : null;
};

const hasText = (value) => Boolean(value && String(value).trim());

const toListItem = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    que_id: row.queId,
    department_en: row.departmentEn ?? null,
    department_gu: row.departmentGu ?? null,
    question_en: row.questionEn ?? null,
    question_gu: row.questionGu ?? null,
    correct_option: row.correctOption ?? null,
    has_gujarati: hasText(row.questionGu) ? 1 : 0,
    has_english: hasText(row.questionEn) ? 1 : 0,
    source_set: null,
    source_q_no: null,
    scope: row.scope ?? null,
    district: row.district ?? null,
    caste_category: row.casteCategory ?? null,
    review_status: row.reviewStatus,
    reviewed_by_username: row.reviewedBy?.username ?? null,
    reviewed_at: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    last_edited_by_username: row.lastEditedBy?.username ?? null,
    last_edited_at: row.lastEditedAt ? row.lastEditedAt.toISOString() : null,
    assigned_to_id: row.assignment?.adminId ?? row.assignment?.admin?.id ?? null,
    assigned_to_username: row.assignment?.admin?.username ?? null,
    assignment_date: row.assignment?.assignmentDate
      ? ymdFromDate(row.assignment.assignmentDate)
      : null,
  };
};

const toComment = (c) => ({
  id: c.id,
  que_id: c.queId,
  user_id: c.userId,
  username: c.username,
  body: c.body,
  created_at: c.createdAt ? c.createdAt.toISOString() : null,
});

const toActivity = (a) => ({
  id: a.id,
  que_id: a.queId,
  user_id: a.userId,
  username: a.username,
  action: a.action,
  detail: a.detail ?? null,
  created_at: a.createdAt ? a.createdAt.toISOString() : null,
});

const toDetail = (row) => {
  if (!row) return null;
  return {
    ...toListItem(row),
    option_a_gu: row.optionAGu ?? null,
    option_b_gu: row.optionBGu ?? null,
    option_c_gu: row.optionCGu ?? null,
    option_d_gu: row.optionDGu ?? null,
    option_a_en: row.optionAEn ?? null,
    option_b_en: row.optionBEn ?? null,
    option_c_en: row.optionCEn ?? null,
    option_d_en: row.optionDEn ?? null,
    correct_answer_gu: deriveAnswer(row, OPTION_GU),
    correct_answer_en: deriveAnswer(row, OPTION_EN),
    comments: (row.comments || []).map(toComment),
    activities: (row.activities || []).map(toActivity),
  };
};

const auditInclude = {
  reviewedBy: { select: { username: true } },
  lastEditedBy: { select: { username: true } },
  assignment: {
    include: { admin: { select: { id: true, username: true } } },
  },
};

const detailInclude = {
  ...auditInclude,
  comments: { orderBy: { createdAt: 'desc' } },
  activities: { orderBy: { createdAt: 'desc' }, take: 50 },
};

/** Maps snake_case API fields → Prisma column names for PATCH. */
const UPDATE_FIELD_MAP = {
  department_gu: 'departmentGu',
  department_en: 'departmentEn',
  question_gu: 'questionGu',
  question_en: 'questionEn',
  option_a_gu: 'optionAGu',
  option_b_gu: 'optionBGu',
  option_c_gu: 'optionCGu',
  option_d_gu: 'optionDGu',
  option_a_en: 'optionAEn',
  option_b_en: 'optionBEn',
  option_c_en: 'optionCEn',
  option_d_en: 'optionDEn',
  correct_option: 'correctOption',
  scope: 'scope',
  district: 'district',
  caste_category: 'casteCategory',
};

export class BankQuestionModel {
  static toListItem = toListItem;
  static toDetail = toDetail;

  static async findByQueId(queId) {
    const row = await prisma.bankQuestion.findUnique({
      where: { queId },
      include: detailInclude,
    });
    return toDetail(row);
  }

  static async findRowByQueId(queId) {
    return prisma.bankQuestion.findUnique({ where: { queId } });
  }

  static async list({ where, page, pageSize }) {
    const [total, rows] = await Promise.all([
      prisma.bankQuestion.count({ where }),
      prisma.bankQuestion.findMany({
        where,
        include: auditInclude,
        orderBy: { id: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      page_size: pageSize,
      items: rows.map(toListItem),
    };
  }

  static async stats() {
    const [total, withGu, withEn, bilingual, reviewPending, reviewAccepted, reviewRejected] =
      await Promise.all([
        prisma.bankQuestion.count(),
        prisma.bankQuestion.count({ where: { questionGu: { not: null } } }),
        prisma.bankQuestion.count({ where: { questionEn: { not: null } } }),
        prisma.bankQuestion.count({
          where: {
            AND: [{ questionGu: { not: null } }, { questionEn: { not: null } }],
          },
        }),
        prisma.bankQuestion.count({ where: { reviewStatus: 'PENDING' } }),
        prisma.bankQuestion.count({ where: { reviewStatus: 'ACCEPTED' } }),
        prisma.bankQuestion.count({ where: { reviewStatus: 'REJECTED' } }),
      ]);

    return {
      total_questions: total,
      with_gujarati: withGu,
      with_english: withEn,
      bilingual,
      gu_only: Math.max(0, withGu - bilingual),
      en_only: Math.max(0, withEn - bilingual),
      review_pending: reviewPending,
      review_accepted: reviewAccepted,
      review_rejected: reviewRejected,
    };
  }

  static buildUpdateData(payload) {
    const data = {};
    for (const [apiKey, prismaKey] of Object.entries(UPDATE_FIELD_MAP)) {
      if (Object.prototype.hasOwnProperty.call(payload, apiKey)) {
        let value = payload[apiKey];
        if (typeof value === 'string') {
          value = value.trim();
          if (apiKey === 'correct_option') value = value.toUpperCase() || null;
          if (value === '') value = null;
        }
        data[prismaKey] = value ?? null;
      }
    }
    return data;
  }

  static async update(queId, payload, editor) {
    const data = {
      ...this.buildUpdateData(payload),
      lastEditedById: editor.id,
      lastEditedAt: new Date(),
    };

    await prisma.$transaction([
      prisma.bankQuestion.update({ where: { queId }, data }),
      prisma.bankQuestionActivity.create({
        data: {
          queId,
          userId: editor.id,
          username: editor.username,
          action: 'EDITED',
          detail: null,
        },
      }),
    ]);

    return this.findByQueId(queId);
  }

  static async review(queId, { action, note }, reviewer) {
    await prisma.$transaction([
      prisma.bankQuestion.update({
        where: { queId },
        data: {
          reviewStatus: action,
          reviewedById: reviewer.id,
          reviewedAt: new Date(),
        },
      }),
      prisma.bankQuestionActivity.create({
        data: {
          queId,
          userId: reviewer.id,
          username: reviewer.username,
          action,
          detail: note || null,
        },
      }),
    ]);

    return this.findByQueId(queId);
  }

  static async addComment(queId, body, admin) {
    await prisma.$transaction([
      prisma.bankQuestionComment.create({
        data: {
          queId,
          userId: admin.id,
          username: admin.username,
          body,
        },
      }),
      prisma.bankQuestionActivity.create({
        data: {
          queId,
          userId: admin.id,
          username: admin.username,
          action: 'COMMENTED',
          detail: body.slice(0, 200),
        },
      }),
    ]);

    return this.findByQueId(queId);
  }

  static async createMany(rows) {
    if (!rows.length) return { count: 0 };
    const result = await prisma.bankQuestion.createMany({
      data: rows,
      skipDuplicates: true,
    });
    return result;
  }
}
