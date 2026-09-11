import { prisma } from '../config/prisma.client.js';
import { ymdFromDate } from '../utils/istDate.js';
import { resolveDepartment } from '../config/departments.js';
import {
  bankTypeToLegacyType,
  buildVariantPayloadFromBankRow,
  flattenPayloadToBankFields,
  legacyTypeToBankType,
} from '../config/question-types.js';

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

const deriveAnswer = (flat, map) => {
  if (!flat?.correctOption) return null;
  const key = map[String(flat.correctOption).toUpperCase()];
  return key ? flat[key] ?? null : null;
};

const hasText = (value) => Boolean(value && String(value).trim());

const reviewerLabel = (variant) => {
  if (variant.reviewedBy) return variant.reviewedBy.fullName || variant.reviewedBy.username;
  const act = (variant.activities || []).find(
    (a) => a.action === 'ACCEPTED' || a.action === 'REJECTED'
  );
  if (!act) return null;
  return act.admin?.fullName || act.username || null;
};

/** Flatten root + variant into the legacy admin/session row shape. */
export function flattenVariantRow(variant) {
  if (!variant) return null;
  const root = variant.root || {};
  const flat = flattenPayloadToBankFields(variant.type, variant.payload || {});
  return {
    id: variant.id,
    variantId: variant.id,
    rootId: variant.rootId ?? root.id ?? null,
    queId: variant.legacyQueId,
    type: flat.type || bankTypeToLegacyType(variant.type),
    departmentId: root.departmentId ?? null,
    departmentGu: root.departmentRef?.nameGu ?? null,
    departmentEn: root.departmentRef?.nameEn ?? null,
    departmentRef: root.departmentRef ?? null,
    questionGu: flat.questionGu,
    questionEn: flat.questionEn,
    optionAGu: flat.optionAGu,
    optionBGu: flat.optionBGu,
    optionCGu: flat.optionCGu,
    optionDGu: flat.optionDGu,
    optionAEn: flat.optionAEn,
    optionBEn: flat.optionBEn,
    optionCEn: flat.optionCEn,
    optionDEn: flat.optionDEn,
    correctOption: flat.correctOption,
    content: flat.content,
    answer: flat.answer,
    scope: root.scope ?? 'GENERAL',
    districtId: root.districtId ?? null,
    casteCategory: root.casteCategory ?? 'GENERAL',
    reviewStatus: variant.reviewStatus,
    reviewedById: variant.reviewedById,
    reviewedAt: variant.reviewedAt,
    reviewedBy: variant.reviewedBy ?? null,
    lastEditedById: variant.lastEditedById,
    lastEditedAt: variant.lastEditedAt,
    lastEditedBy: variant.lastEditedBy ?? null,
    assignment: variant.assignment ?? null,
    comments: variant.comments ?? [],
    activities: variant.activities ?? [],
    createdAt: variant.createdAt,
    updatedAt: variant.updatedAt,
  };
}

const toListItem = (variant) => {
  const row = flattenVariantRow(variant);
  if (!row) return null;
  return {
    id: row.variantId,
    que_id: row.queId,
    department_id: row.departmentId ?? null,
    type: row.type ?? 'single_choice',
    department_en: row.departmentRef?.nameEn ?? row.departmentEn ?? null,
    department_gu: row.departmentRef?.nameGu ?? row.departmentGu ?? null,
    question_en: row.questionEn ?? null,
    question_gu: row.questionGu ?? null,
    correct_option: row.correctOption ?? null,
    has_gujarati: hasText(row.questionGu) ? 1 : 0,
    has_english: hasText(row.questionEn) ? 1 : 0,
    source_set: null,
    source_q_no: null,
    scope: row.scope ?? null,
    district: row.districtId ?? null,
    district_id: row.districtId ?? null,
    caste_category: row.casteCategory ?? null,
    review_status: row.reviewStatus,
    reviewed_by_username: reviewerLabel(variant),
    reviewed_at: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    last_edited_by_username: row.lastEditedBy
      ? row.lastEditedBy.fullName || row.lastEditedBy.username
      : null,
    last_edited_at: row.lastEditedAt ? row.lastEditedAt.toISOString() : null,
    assigned_to_id: row.assignment?.adminId ?? row.assignment?.admin?.id ?? null,
    assigned_to_username: row.assignment?.admin
      ? row.assignment.admin.fullName || row.assignment.admin.username
      : null,
    assignment_date: row.assignment?.assignmentDate
      ? ymdFromDate(row.assignment.assignmentDate)
      : null,
  };
};

const toComment = (c, queId) => ({
  id: c.id,
  que_id: queId,
  user_id: c.userId,
  username: c.username,
  body: c.body,
  created_at: c.createdAt ? c.createdAt.toISOString() : null,
});

const toActivity = (a, queId) => ({
  id: a.id,
  que_id: queId,
  user_id: a.userId,
  username: a.username,
  action: a.action,
  detail: a.detail ?? null,
  created_at: a.createdAt ? a.createdAt.toISOString() : null,
});

const toDetail = (variant) => {
  if (!variant) return null;
  const row = flattenVariantRow(variant);
  return {
    ...toListItem(variant),
    option_a_gu: row.optionAGu ?? null,
    option_b_gu: row.optionBGu ?? null,
    option_c_gu: row.optionCGu ?? null,
    option_d_gu: row.optionDGu ?? null,
    option_a_en: row.optionAEn ?? null,
    option_b_en: row.optionBEn ?? null,
    option_c_en: row.optionCEn ?? null,
    option_d_en: row.optionDEn ?? null,
    content: row.content ?? null,
    answer: row.answer ?? null,
    correct_answer_gu: deriveAnswer(row, OPTION_GU),
    correct_answer_en: deriveAnswer(row, OPTION_EN),
    comments: (variant.comments || []).map((c) => toComment(c, row.queId)),
    activities: (variant.activities || []).map((a) => toActivity(a, row.queId)),
  };
};

const auditInclude = {
  root: {
    include: {
      departmentRef: { select: { id: true, nameEn: true, nameGu: true } },
    },
  },
  reviewedBy: { select: { username: true, fullName: true } },
  lastEditedBy: { select: { username: true, fullName: true } },
  assignment: {
    include: { admin: { select: { id: true, username: true, fullName: true } } },
  },
  activities: {
    where: { action: { in: ['ACCEPTED', 'REJECTED'] } },
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: { admin: { select: { username: true, fullName: true } } },
  },
};

const detailInclude = {
  root: {
    include: {
      departmentRef: { select: { id: true, nameEn: true, nameGu: true } },
    },
  },
  reviewedBy: { select: { username: true, fullName: true } },
  lastEditedBy: { select: { username: true, fullName: true } },
  assignment: {
    include: { admin: { select: { id: true, username: true, fullName: true } } },
  },
  comments: { orderBy: { createdAt: 'desc' } },
  activities: { orderBy: { createdAt: 'desc' }, take: 50 },
};

const ROOT_FIELD_MAP = {
  department_id: 'departmentId',
  scope: 'scope',
  district: 'districtId',
  district_id: 'districtId',
  caste_category: 'casteCategory',
};

function buildRootUpdateData(payload) {
  const data = {};
  for (const [apiKey, prismaKey] of Object.entries(ROOT_FIELD_MAP)) {
    if (Object.prototype.hasOwnProperty.call(payload, apiKey)) {
      let value = payload[apiKey];
      if (typeof value === 'string') {
        value = value.trim();
        if (value === '') value = null;
      }
      if (prismaKey === 'departmentId' && value != null) {
        value = Number(value);
        if (!Number.isFinite(value)) value = null;
      }
      data[prismaKey] = value ?? null;
    }
  }

  // Legacy admin fields: resolve department_gu / department_en → departmentId
  if (
    data.departmentId == null &&
    (Object.prototype.hasOwnProperty.call(payload, 'department_gu') ||
      Object.prototype.hasOwnProperty.call(payload, 'department_en') ||
      Object.prototype.hasOwnProperty.call(payload, 'department'))
  ) {
    const raw =
      payload.department_en || payload.department_gu || payload.department || null;
    if (raw != null && String(raw).trim() !== '') {
      const resolved = resolveDepartment(String(raw).trim());
      if (resolved) data.departmentId = resolved.id;
    }
  }

  return data;
}

function buildPayloadUpdate(existingVariant, payload) {
  const flat = flattenPayloadToBankFields(
    existingVariant.type,
    existingVariant.payload || {}
  );
  const merged = {
    type: flat.type,
    questionGu: flat.questionGu,
    questionEn: flat.questionEn,
    optionAGu: flat.optionAGu,
    optionBGu: flat.optionBGu,
    optionCGu: flat.optionCGu,
    optionDGu: flat.optionDGu,
    optionAEn: flat.optionAEn,
    optionBEn: flat.optionBEn,
    optionCEn: flat.optionCEn,
    optionDEn: flat.optionDEn,
    correctOption: flat.correctOption,
    content: flat.content,
    answer: flat.answer,
  };

  const apiToFlat = {
    type: 'type',
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
    content: 'content',
    answer: 'answer',
  };

  let touched = false;
  for (const [apiKey, flatKey] of Object.entries(apiToFlat)) {
    if (!Object.prototype.hasOwnProperty.call(payload, apiKey)) continue;
    let value = payload[apiKey];
    if (typeof value === 'string') {
      value = value.trim();
      if (apiKey === 'correct_option') value = value.toUpperCase() || null;
      if (value === '') value = null;
    }
    merged[flatKey] = value ?? null;
    touched = true;
  }

  if (!touched) return null;

  const bankType = legacyTypeToBankType(
    merged.type || bankTypeToLegacyType(existingVariant.type)
  );
  return {
    type: bankType,
    payload: buildVariantPayloadFromBankRow({
      type: merged.type,
      questionGu: merged.questionGu,
      questionEn: merged.questionEn,
      optionAGu: merged.optionAGu,
      optionBGu: merged.optionBGu,
      optionCGu: merged.optionCGu,
      optionDGu: merged.optionDGu,
      optionAEn: merged.optionAEn,
      optionBEn: merged.optionBEn,
      optionCEn: merged.optionCEn,
      optionDEn: merged.optionDEn,
      correctOption: merged.correctOption,
      content: merged.content,
      answer: merged.answer,
    }),
  };
}

async function idsMatchingLanguage(language) {
  if (!language || language === 'all') return null;
  let sql;
  if (language === 'both') {
    sql = `
      SELECT id FROM question_variants
      WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu')) IS NOT NULL
        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu'))) <> ''
        AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en')) IS NOT NULL
        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en'))) <> ''
    `;
  } else if (language === 'gu_only') {
    sql = `
      SELECT id FROM question_variants
      WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu')) IS NOT NULL
        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu'))) <> ''
        AND (
          JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en')) IS NULL
          OR TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en'))) = ''
        )
    `;
  } else if (language === 'en_only') {
    sql = `
      SELECT id FROM question_variants
      WHERE JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en')) IS NOT NULL
        AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en'))) <> ''
        AND (
          JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu')) IS NULL
          OR TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu'))) = ''
        )
    `;
  } else {
    return null;
  }
  const rows = await prisma.$queryRawUnsafe(sql);
  return rows.map((r) => r.id);
}

async function idsMatchingSearch(q) {
  const like = `%${q}%`;
  const rows = await prisma.$queryRaw`
    SELECT v.id
    FROM question_variants v
    INNER JOIN question_roots r ON r.id = v.root_id
    LEFT JOIN departments d ON d.id = r.department_id
    WHERE v.legacy_que_id LIKE ${like}
       OR d.name_gu LIKE ${like}
       OR d.name_en LIKE ${like}
       OR JSON_UNQUOTE(JSON_EXTRACT(v.payload, '$.prompt.gu')) LIKE ${like}
       OR JSON_UNQUOTE(JSON_EXTRACT(v.payload, '$.prompt.en')) LIKE ${like}
  `;
  return rows.map((r) => r.id);
}

export class BankQuestionModel {
  static toListItem = toListItem;
  static toDetail = toDetail;
  static flattenVariantRow = flattenVariantRow;

  static async findByQueId(queId) {
    const variant = await prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
      include: detailInclude,
    });
    return toDetail(variant);
  }

  static async findRowByQueId(queId) {
    return prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
      include: { root: true },
    });
  }

  static async list({ where, page, pageSize, language, q }) {
    const prismaWhere = { ...(where || {}) };
    delete prismaWhere.AND;
    delete prismaWhere.OR;

    const idFilters = [];

    const langIds = await idsMatchingLanguage(language);
    if (langIds) idFilters.push(langIds);

    if (q) {
      idFilters.push(await idsMatchingSearch(q));
    }

    if (idFilters.length) {
      let intersect = idFilters[0];
      for (let i = 1; i < idFilters.length; i += 1) {
        const set = new Set(idFilters[i]);
        intersect = intersect.filter((id) => set.has(id));
      }
      prismaWhere.id = { in: intersect.length ? intersect : [-1] };
    }

    const [total, rows] = await Promise.all([
      prisma.questionVariant.count({ where: prismaWhere }),
      prisma.questionVariant.findMany({
        where: prismaWhere,
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
    const [total, reviewPending, reviewAccepted, reviewRejected, withLang] =
      await Promise.all([
        prisma.questionVariant.count(),
        prisma.questionVariant.count({ where: { reviewStatus: 'PENDING' } }),
        prisma.questionVariant.count({ where: { reviewStatus: 'ACCEPTED' } }),
        prisma.questionVariant.count({ where: { reviewStatus: 'REJECTED' } }),
        prisma.$queryRaw`
          SELECT
            SUM(
              CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu')) IS NOT NULL
                AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu'))) <> '' THEN 1 ELSE 0 END
            ) AS with_gu,
            SUM(
              CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en')) IS NOT NULL
                AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en'))) <> '' THEN 1 ELSE 0 END
            ) AS with_en,
            SUM(
              CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu')) IS NOT NULL
                AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.gu'))) <> ''
                AND JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en')) IS NOT NULL
                AND TRIM(JSON_UNQUOTE(JSON_EXTRACT(payload, '$.prompt.en'))) <> '' THEN 1 ELSE 0 END
            ) AS bilingual
          FROM question_variants
        `,
      ]);

    const withGu = Number(withLang[0]?.with_gu || 0);
    const withEn = Number(withLang[0]?.with_en || 0);
    const bilingual = Number(withLang[0]?.bilingual || 0);

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

  static async update(queId, payload, editor) {
    const existing = await prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
      include: { root: true },
    });
    if (!existing) return null;

    const rootData = buildRootUpdateData(payload);
    const variantPatch = buildPayloadUpdate(existing, payload);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      if (Object.keys(rootData).length) {
        await tx.questionRoot.update({
          where: { id: existing.rootId },
          data: {
            ...rootData,
            lastEditedById: editor.id,
            lastEditedAt: now,
          },
        });
      }

      await tx.questionVariant.update({
        where: { id: existing.id },
        data: {
          ...(variantPatch || {}),
          lastEditedById: editor.id,
          lastEditedAt: now,
        },
      });

      await tx.questionVariantActivity.create({
        data: {
          variantId: existing.id,
          userId: editor.id,
          username: editor.username,
          action: 'EDITED',
          detail: null,
        },
      });
    });

    return this.findByQueId(queId);
  }

  static async review(queId, { action, note }, reviewer) {
    const existing = await prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
    });
    if (!existing) return null;

    const reviewedAt = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.questionVariant.update({
        where: { id: existing.id },
        data: {
          reviewStatus: action,
          reviewedById: reviewer.id,
          reviewedAt,
        },
      });
      await tx.questionVariantActivity.create({
        data: {
          variantId: existing.id,
          userId: reviewer.id,
          username: reviewer.username,
          action,
          detail: note || null,
        },
      });
    });

    return this.findByQueId(queId);
  }

  static async addComment(queId, body, admin) {
    const existing = await prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
    });
    if (!existing) return null;

    await prisma.$transaction([
      prisma.questionVariantComment.create({
        data: {
          variantId: existing.id,
          userId: admin.id,
          username: admin.username,
          body,
        },
      }),
      prisma.questionVariantActivity.create({
        data: {
          variantId: existing.id,
          userId: admin.id,
          username: admin.username,
          action: 'COMMENTED',
          detail: body.slice(0, 200),
        },
      }),
    ]);

    return this.findByQueId(queId);
  }

  static async findComment(queId, commentId) {
    const existing = await prisma.questionVariant.findUnique({
      where: { legacyQueId: queId },
      select: { id: true },
    });
    if (!existing) return null;
    return prisma.questionVariantComment.findFirst({
      where: { id: commentId, variantId: existing.id },
    });
  }

  static async deleteComment(queId, commentId) {
    const comment = await this.findComment(queId, commentId);
    if (!comment) return this.findByQueId(queId);
    await prisma.questionVariantComment.delete({ where: { id: comment.id } });
    return this.findByQueId(queId);
  }
}
