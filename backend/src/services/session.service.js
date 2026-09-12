import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { QUESTION_TYPE } from '../config/question-types.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import {
  QuizSessionModel,
  toGradingQuestion,
  toQuestionReveal,
  toSessionMeta,
  toSessionPlayPayload,
  toSessionResult,
} from '../models/QuizSessionModel.js';
import { flattenVariantRow } from '../models/BankQuestionModel.js';
import { UserModel } from '../models/UserModel.js';
import { gradeQuestion } from './grading.service.js';

const normalizeChoiceAnswer = (value) => {
  if (value == null) return null;
  if (Array.isArray(value) && value.length) {
    return [String(value[0]).trim().toLowerCase()];
  }
  return [String(value).trim().toLowerCase()];
};

const normalizeMapAnswer = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, mapped]) => key && mapped != null && String(mapped).trim() !== '')
      .map(([key, mapped]) => [String(key), String(mapped).trim()])
  );
};

const normalizeOrderedAnswer = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
};

const normalizeSubmittedAnswer = (question, rawAnswer) => {
  switch (question?.type) {
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.TRUE_FALSE:
    case QUESTION_TYPE.IMAGE_CHOICE:
      return normalizeChoiceAnswer(rawAnswer);
    case QUESTION_TYPE.MATCH_FOLLOWING:
    case QUESTION_TYPE.DRAG_INTO_BLANKS:
      return normalizeMapAnswer(rawAnswer);
    case QUESTION_TYPE.DRAG_DROP:
      return normalizeOrderedAnswer(rawAnswer);
    default:
      return rawAnswer ?? null;
  }
};

const selectedOptionForStorage = (questionType, answer) => {
  if (
    questionType !== QUESTION_TYPE.SINGLE_CHOICE &&
    questionType !== QUESTION_TYPE.IMAGE_CHOICE
  ) {
    return null;
  }
  const selected = Array.isArray(answer) ? answer[0] : null;
  if (!selected) return null;
  return String(selected).trim().toUpperCase().slice(0, 1);
};

const stableAnswerKey = (value) => {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(value);
  }
};

const isRowLocked = (row) =>
  row?.selectedAnswer != null || row?.isCorrect != null || row?.selectedOption != null;

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const districtIdOf = (q) => (q.districtId != null ? Number(q.districtId) : null);

const casteOf = (q) => (q.casteCategory || '').trim().toUpperCase();

const isDistrictMatch = (q, districtId) =>
  districtId != null && districtIdOf(q) != null && Number(districtId) === districtIdOf(q);

const isCasteMatch = (q, caste) => {
  const qCaste = casteOf(q);
  return Boolean(
    caste && caste !== 'GENERAL' && qCaste && qCaste !== 'GENERAL' && qCaste === caste
  );
};

const isProfileMatch = (q, districtId, caste) =>
  isDistrictMatch(q, districtId) || isCasteMatch(q, caste);

const takeUnique = (pools, count) => {
  const picked = [];
  const seen = new Set();
  for (const pool of pools) {
    for (const item of pool) {
      if (picked.length >= count) return picked;
      if (seen.has(item.variantId)) continue;
      seen.add(item.variantId);
      picked.push(item);
    }
  }
  return picked;
};

function normalizeSessionLanguage(language) {
  return ['gu', 'en', 'hi'].includes(language) ? language : CONFIG.QUIZ.DEFAULT_LANGUAGE;
}

async function fetchCandidateLight({
  userId,
  limit,
  districtId,
  casteRaw,
  personalized,
}) {
  const params = [userId];
  const districtExpr = 'qr.district_id';
  const casteExpr = "UPPER(COALESCE(qr.caste_category, 'GENERAL'))";
  // Serve ACCEPTED bank variants the user has never seen.
  // Scope is informational (GENERAL / TARGETED); beta product mode is gone.
  const filters = [
    "qv.review_status = 'ACCEPTED'",
    `(
      JSON_EXTRACT(qv.payload, '$.correct') IS NOT NULL
      OR JSON_EXTRACT(qv.payload, '$.answer') IS NOT NULL
      OR qv.type IN ('mcq', 'true_false', 'match_pairs', 'sequence', 'fill_blanks')
    )`,
    'uqe.variant_id IS NULL',
  ];

  const casteNorm =
    casteRaw && String(casteRaw).trim().toUpperCase() !== 'GENERAL'
      ? String(casteRaw).trim().toUpperCase()
      : null;
  const hasDistrict = districtId != null;
  const hasCaste = Boolean(casteNorm);

  if (personalized) {
    const personal = [];
    if (hasDistrict) {
      personal.push(`${districtExpr} = ?`);
      params.push(Number(districtId));
    }
    if (hasCaste) {
      personal.push(`${casteExpr} = ?`);
      params.push(casteNorm);
    }
    if (!personal.length) return [];
    filters.push(`(${personal.join(' OR ')})`);
  } else {
    const exclusions = [];
    if (hasDistrict) {
      exclusions.push(`(${districtExpr} IS NULL OR ${districtExpr} <> ?)`);
      params.push(Number(districtId));
    }
    if (hasCaste) {
      exclusions.push(`(${casteExpr} = 'GENERAL' OR ${casteExpr} <> ?)`);
      params.push(casteNorm);
    }
    if (exclusions.length) {
      filters.push(exclusions.join(' AND '));
    }
  }

  let orderBy = '';
  if (personalized && hasDistrict && hasCaste) {
    orderBy = `ORDER BY CASE WHEN ${districtExpr} = ? AND ${casteExpr} = ? THEN 0 ELSE 1 END, RAND()`;
    params.push(Number(districtId), casteNorm);
  } else if (personalized) {
    orderBy = 'ORDER BY RAND()';
  }

  params.push(limit);
  const sql = `
    SELECT
      qv.id AS variantId,
      qv.root_id AS rootId,
      qv.legacy_que_id AS queId,
      CASE qv.type
        WHEN 'mcq' THEN 'single_choice'
        WHEN 'true_false' THEN 'true_false'
        WHEN 'fill_blanks' THEN 'drag_into_blanks'
        WHEN 'sequence' THEN 'drag_drop'
        WHEN 'match_pairs' THEN 'match_following'
        ELSE 'single_choice'
      END AS type,
      qr.department_id AS departmentId,
      d.name_gu AS departmentGu,
      d.name_en AS departmentEn,
      ${districtExpr} AS districtId,
      qr.caste_category AS casteCategory
    FROM question_variants qv
    INNER JOIN question_roots qr ON qr.id = qv.root_id
    LEFT JOIN departments d ON d.id = qr.department_id
    LEFT JOIN user_question_exposures uqe
      ON uqe.user_id = ? AND uqe.variant_id = qv.id
    WHERE ${filters.join(' AND ')}
    ${orderBy}
    LIMIT ?
  `;
  return prisma.$queryRawUnsafe(sql, ...params);
}

async function hydrateVariants(variantIds) {
  if (!variantIds.length) return [];
  const variants = await prisma.questionVariant.findMany({
    where: { id: { in: variantIds } },
    include: {
      root: { include: { departmentRef: true } },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, flattenVariantRow(v)]));
  return variantIds.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * Pick `count` ACCEPTED variants the user has never seen.
 * Fills the session in this order (no cap on personalised rows):
 *   1. district AND caste matches
 *   2. district OR caste matches
 *   3. general pool
 * Shortfalls fall back to later pools so the session can still start.
 */
async function allocateBankQuestions(user, count) {
  const districtId = user.districtId != null ? Number(user.districtId) : null;
  const caste = (user.socialCategory || '').trim().toUpperCase();
  const casteRaw = (user.socialCategory || '').trim();
  const needPersonalized = Boolean(districtId != null || (casteRaw && caste !== 'GENERAL'));
  const poolLimit = Math.max(count * 20, 200);

  const [tagged, generalPool] = await Promise.all([
    needPersonalized
      ? fetchCandidateLight({
          userId: user.id,
          limit: poolLimit,
          districtId,
          casteRaw,
          personalized: true,
        })
      : Promise.resolve([]),
    fetchCandidateLight({
      userId: user.id,
      limit: poolLimit,
      districtId,
      casteRaw,
      personalized: false,
    }),
  ]);

  const preferredById = new Map();
  for (const q of tagged) {
    if (isProfileMatch(q, districtId, caste)) preferredById.set(q.variantId, q);
  }
  const general = [];
  for (const q of generalPool) {
    if (isProfileMatch(q, districtId, caste)) preferredById.set(q.variantId, q);
    else general.push(q);
  }

  const dual = [];
  const single = [];
  for (const q of preferredById.values()) {
    if (isDistrictMatch(q, districtId) && isCasteMatch(q, caste)) dual.push(q);
    else single.push(q);
  }

  if (!dual.length && !single.length && !general.length) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      'No new approved questions available for this user.'
    );
  }

  const picked = takeUnique(
    [shuffle(dual), shuffle(single), shuffle(general)],
    count
  );

  if (picked.length < count) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      `Only ${picked.length} unseen approved questions left (need ${count}).`
    );
  }

  return hydrateVariants(picked.map((q) => q.variantId));
}

export const sessionService = {
  async start({ userId, count, language }) {
    const user = await UserModel.findByIdForSession(userId);
    if (!user) throw new AppError(ERROR_CODE.UNAUTHORIZED);
    const requestedLanguage = normalizeSessionLanguage(language);

    const existingMeta = await QuizSessionModel.findInProgressMetaForUser(userId);
    if (existingMeta) {
      let existing = await prisma.quizSession.findUnique({ where: { id: existingMeta.id } });
      if (existing && existing.language !== requestedLanguage) {
        existing = await prisma.quizSession.update({
          where: { id: existing.id },
          data: { language: requestedLanguage },
        });
      }
      return toSessionMeta(existing);
    }

    const questionCount = count || CONFIG.QUIZ.QUESTION_COUNT;
    const lang = requestedLanguage;
    const bankRows = await allocateBankQuestions(user, questionCount);

    let rowsForSession = bankRows;

    // Short lock: claim the "no in-progress session" slot and insert the shell only.
    const claim = await prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe('SELECT id FROM users WHERE id = ? FOR UPDATE', userId);
      const latestMeta = await QuizSessionModel.findInProgressMetaForUser(userId, tx);
      if (latestMeta) {
        return { kind: 'existing', id: latestMeta.id };
      }
      const session = await QuizSessionModel.createSessionShell({
        userId,
        language: lang,
        questionCount: rowsForSession.length,
        tx,
      });
      return { kind: 'created', session };
    });

    if (claim.kind === 'existing') {
      let existing = await prisma.quizSession.findUnique({ where: { id: claim.id } });
      if (existing && existing.language !== lang) {
        existing = await prisma.quizSession.update({
          where: { id: existing.id },
          data: { language: lang },
        });
      }
      return toSessionMeta(existing);
    }

    try {
      await QuizSessionModel.insertQuestions(claim.session.id, rowsForSession);
    } catch (error) {
      await prisma.quizSession
        .delete({ where: { id: claim.session.id } })
        .catch(() => {});
      throw error;
    }

    return toSessionMeta(claim.session);
  },

  async get({ userId, sessionId }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }

    if (session.status === 'submitted' || session.status === 'abandoned') {
      return toSessionResult(session);
    }

    return toSessionPlayPayload(session);
  },

  /**
   * Lock one answer mid-quiz and return the reveal for review UX.
   * Ranked play never ships answers in the initial payload.
   */
  async lockQuestion({ userId, sessionId, queId, answer, timeSpentMs }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }
    if (session.status !== 'in_progress') {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session is not active.');
    }

    const row = (session.questions || []).find((q) => q.queId === String(queId));
    if (!row) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Question not found in this session.');
    }

    const gradingQuestion = toGradingQuestion(row, session.language);
    const selectedAnswer = normalizeSubmittedAnswer(gradingQuestion, answer);
    const elapsed = Math.max(0, Math.round(Number(timeSpentMs) || 0));

    if (isRowLocked(row)) {
      if (stableAnswerKey(row.selectedAnswer) !== stableAnswerKey(selectedAnswer)) {
        throw new AppError(
          ERROR_CODE.INVALID_REQUEST,
          'This answer is already locked and cannot be changed.'
        );
      }
      return toQuestionReveal(row, session.language);
    }

    const grade = gradeQuestion(gradingQuestion, selectedAnswer, elapsed);
    const locked = await QuizSessionModel.lockQuestionRow(row, {
      selectedOption: selectedOptionForStorage(gradingQuestion.type, selectedAnswer),
      selectedAnswer: selectedAnswer ?? null,
      isCorrect: Boolean(grade.correct),
      timeSpentMs: elapsed,
    });

    return toQuestionReveal(locked, session.language);
  },

  async submit({ userId, sessionId, answers, timings, startedAt, abandoned = false }) {
    const [session, user] = await Promise.all([
      QuizSessionModel.findById(sessionId),
      UserModel.findByIdForLeaderboard(userId),
    ]);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }
    if (!user) throw new AppError(ERROR_CODE.UNAUTHORIZED);

    if (session.status === 'submitted' || session.status === 'abandoned') {
      return toSessionResult(session);
    }

    if (session.status !== 'in_progress') {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session is not active.');
    }

    const startedMs = Number(startedAt) || session.startedAt.getTime();
    const completedMs = Date.now();
    if (startedMs > completedMs || completedMs - startedMs > 24 * 60 * 60 * 1000) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Invalid startedAt.');
    }

    const answerMap = answers || {};
    const timingMap = timings || {};

    const rootRows = await prisma.questionVariant.findMany({
      where: { id: { in: session.questions.map((q) => q.variantId) } },
      select: { id: true, rootId: true },
    });
    const rootByVariant = new Map(rootRows.map((row) => [row.id, row.rootId]));

    const gradedRows = session.questions.map((q) => {
      const gradingQuestion = toGradingQuestion(q, session.language);
      const locked = isRowLocked(q);

      if (locked) {
        return {
          id: q.id,
          userId,
          queId: q.queId,
          variantId: q.variantId,
          rootId: rootByVariant.get(q.variantId),
          selectedOption: q.selectedOption ?? selectedOptionForStorage(gradingQuestion.type, q.selectedAnswer),
          selectedAnswer: q.selectedAnswer ?? null,
          isCorrect: Boolean(q.isCorrect),
          attempted: true,
          timeSpentMs: Math.max(0, Math.round(Number(q.timeSpentMs) || 0)),
          points: q.points,
        };
      }

      // Completed (non-abandoned) submits only trust server-locked answers.
      // Abandoned mid-quiz may still accept client payload for unlocked rows.
      if (!abandoned) {
        return {
          id: q.id,
          userId,
          queId: q.queId,
          variantId: q.variantId,
          rootId: rootByVariant.get(q.variantId),
          selectedOption: null,
          selectedAnswer: null,
          isCorrect: false,
          attempted: false,
          timeSpentMs: 0,
          points: q.points,
        };
      }

      const selectedAnswer = normalizeSubmittedAnswer(gradingQuestion, answerMap[q.queId]);
      const attempted = Object.prototype.hasOwnProperty.call(timingMap, q.queId);
      const timeSpentMs = attempted
        ? Math.max(0, Math.round(Number(timingMap[q.queId]) || 0))
        : 0;
      const grade = attempted
        ? gradeQuestion(gradingQuestion, selectedAnswer, timeSpentMs)
        : gradeQuestion(gradingQuestion, selectedAnswer, 0);
      return {
        id: q.id,
        userId,
        queId: q.queId,
        variantId: q.variantId,
        rootId: rootByVariant.get(q.variantId),
        selectedOption: selectedOptionForStorage(gradingQuestion.type, selectedAnswer),
        selectedAnswer: selectedAnswer ?? null,
        isCorrect: Boolean(attempted && grade.correct),
        attempted,
        timeSpentMs,
        points: q.points,
      };
    });

    const attemptedRows = gradedRows.filter((r) => r.attempted);
    const correctCount = attemptedRows.filter((r) => r.isCorrect).length;
    const totalTimeMs = attemptedRows.reduce((sum, r) => sum + r.timeSpentMs, 0);
    const totalQuestions = gradedRows.length;

    const updated = await QuizSessionModel.submit(
      session,
      gradedRows,
      {
        correctCount,
        wrongCount: attemptedRows.length - correctCount,
        totalTimeMs,
        percentage:
          totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        abandoned: Boolean(abandoned),
      },
      {
        userId,
        role: user.role,
        districtId: user.districtId || null,
        talukaId: user.talukaId || null,
      }
    );

    return toSessionResult(updated);
  },

  async listMine({ userId }) {
    return QuizSessionModel.listForUser(userId);
  },

  async currentMine({ userId }) {
    const session = await QuizSessionModel.findCurrentWeekForUser(userId);
    const sessionMeta = session ? toSessionMeta(session) : null;
    return {
      currentWeek: CONFIG.QUIZ.CURRENT_WEEK,
      weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
      session: sessionMeta
        ? {
            sessionId: sessionMeta.sessionId,
            status: sessionMeta.status,
            questionCount: sessionMeta.questionCount,
            language: sessionMeta.language,
            startedAt: sessionMeta.startedAt,
            completedAt: sessionMeta.completedAt,
            correctCount: sessionMeta.correctCount,
            wrongCount: sessionMeta.wrongCount,
            totalTimeMs: sessionMeta.totalTimeMs,
            percentage: sessionMeta.percentage,
          }
        : null,
    };
  },

  async stats(userId) {
    return QuizSessionModel.userStats(userId);
  },

  async clearMine(userId) {
    await prisma.$transaction([
      prisma.quizSession.deleteMany({ where: { userId } }),
      prisma.userQuestionExposure.deleteMany({ where: { userId } }),
      prisma.leaderboardAggregate.deleteMany({ where: { userId } }),
    ]);
    return QuizSessionModel.userStats(userId);
  },

  async getResult({ userId, sessionId }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }
    if (!['submitted', 'abandoned'].includes(session.status)) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session is not finished yet.');
    }
    return toSessionResult(session);
  },
};
