import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { QUESTION_TYPE } from '../config/question-types.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import {
  QuizSessionModel,
  toGradingQuestion,
  toSessionMeta,
  toSessionPlayPayload,
  toSessionResult,
} from '../models/QuizSessionModel.js';
import { UserModel } from '../models/UserModel.js';
import { gradeQuestion } from './grading.service.js';
import { resolveAzureBlobUrl } from '../utils/azureStorage.js';

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

const parseJson = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

const pickRandom = (items) => {
  if (!Array.isArray(items) || !items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
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

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const isProfileMatch = (q, district, caste) => {
  const qDistrict = (q.district || '').trim().toLowerCase();
  const qCaste = (q.casteCategory || '').trim().toUpperCase();
  const isLocal = Boolean(district && qDistrict && qDistrict === district);
  const isCaste = Boolean(
    caste && caste !== 'GENERAL' && qCaste && qCaste !== 'GENERAL' && qCaste === caste
  );
  return isLocal || isCaste;
};

const personalizedTargetCount = () => {
  const min = Math.max(0, CONFIG.QUIZ.PERSONALIZED_MIN);
  const max = Math.max(min, CONFIG.QUIZ.PERSONALIZED_MAX);
  if (max === min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
};

function isBetaUser(user) {
  return String(user?.institute || '').trim().toLowerCase() === 'beta user';
}

function normalizeSessionLanguage(language) {
  return ['gu', 'en', 'hi'].includes(language) ? language : CONFIG.QUIZ.DEFAULT_LANGUAGE;
}

function betaRootCode(queId) {
  const match = String(queId || '').match(/^BETA_Q_\d{3}/);
  return match ? match[0] : String(queId || '');
}

function betaVariantKind(row) {
  return betaRootCode(row?.queId) === String(row?.queId) ? 'original' : 'enhanced';
}

function pickBestBetaCandidate(candidates, usedDepartments, usedTypes, usedKinds) {
  const ranked = candidates
    .map((candidate) => {
      const department = String(candidate.departmentGu || candidate.departmentEn || '').trim();
      let score = Math.random();
      if (department && !usedDepartments.has(department)) score += 4;
      if (candidate.type && !usedTypes.has(candidate.type)) score += 3;
      const kind = betaVariantKind(candidate);
      if (!usedKinds.has(kind)) score += 2;
      return { candidate, score };
    })
    .sort((left, right) => right.score - left.score);
  return ranked[0]?.candidate ?? null;
}

function mixBetaQuestions(pool, count) {
  const grouped = new Map();
  for (const row of shuffle(pool)) {
    const rootCode = betaRootCode(row.queId);
    if (!grouped.has(rootCode)) grouped.set(rootCode, []);
    grouped.get(rootCode).push(row);
  }

  const roots = shuffle([...grouped.keys()]);
  const usedDepartments = new Set();
  const usedTypes = new Set();
  const usedKinds = new Set();
  const picked = [];

  for (const rootCode of roots) {
    if (picked.length >= count) break;
    const candidate = pickBestBetaCandidate(
      grouped.get(rootCode) || [],
      usedDepartments,
      usedTypes,
      usedKinds
    );
    if (!candidate) continue;
    picked.push(candidate);
    const department = String(candidate.departmentGu || candidate.departmentEn || '').trim();
    if (department) usedDepartments.add(department);
    if (candidate.type) usedTypes.add(candidate.type);
    usedKinds.add(betaVariantKind(candidate));
  }

  if (picked.length < count) {
    const leftovers = shuffle(
      pool.filter((row) => !picked.some((selected) => selected.queId === row.queId))
    );
    for (const row of leftovers) {
      if (picked.length >= count) break;
      picked.push(row);
    }
  }

  return picked.slice(0, count);
}

async function attachBetaQuestionBackgrounds(bankRows) {
  const betaRows = bankRows.filter((row) => Number.isFinite(Number(row.betaDepartmentId)));
  if (!betaRows.length) {
    return { bankRows, backgroundStyle: null };
  }

  const departmentIds = [...new Set(betaRows.map((row) => Number(row.betaDepartmentId)))];
  const imageRows = await prisma.betaDepartmentQuizImage.findMany({
    where: {
      betaDepartmentId: { in: departmentIds },
      isActive: true,
    },
    select: {
      betaDepartmentId: true,
      imageUrl: true,
    },
  });

  if (!imageRows.length) {
    return { bankRows, backgroundStyle: null };
  }

  const byDepartment = new Map();

  for (const row of imageRows) {
    if (!byDepartment.has(row.betaDepartmentId)) byDepartment.set(row.betaDepartmentId, []);
    byDepartment.get(row.betaDepartmentId).push(row);
  }

  return {
    backgroundStyle: null,
    bankRows: bankRows.map((row) => {
      const departmentId = Number(row.betaDepartmentId);
      if (!Number.isFinite(departmentId)) return row;
      const fallback = byDepartment.get(departmentId) || [];
      const chosenImage = pickRandom(fallback);
      const content = parseJson(row.content) || {};
      return {
        ...row,
        content: {
          ...content,
          backgroundImageUrl: resolveAzureBlobUrl(chosenImage?.imageUrl),
          backgroundStyle: null,
        },
      };
    }),
  };
}

async function fetchCandidateLight({
  userId,
  limit,
  districtRaw,
  casteRaw,
  personalized,
  betaOnly,
}) {
  const params = [userId];
  const filters = [
    "bq.review_status = 'ACCEPTED'",
    `(
      (bq.correct_option IS NOT NULL AND bq.type IN ('single_choice', 'true_false', 'image_choice'))
      OR bq.answer IS NOT NULL
    )`,
    betaOnly
      ? "UPPER(COALESCE(bq.scope, '')) = 'BETA'"
      : "UPPER(COALESCE(bq.scope, 'GENERAL')) <> 'BETA'",
    'uqe.bank_que_id IS NULL',
  ];

  if (personalized) {
    const personal = [];
    if (districtRaw) {
      personal.push('bq.district = ?');
      params.push(districtRaw);
    }
    if (casteRaw && casteRaw !== 'GENERAL') {
      personal.push('bq.caste_category = ?');
      params.push(casteRaw);
    }
    if (!personal.length) return [];
    filters.push(`(${personal.join(' OR ')})`);
  } else {
    const exclusions = [];
    if (districtRaw) {
      exclusions.push('(bq.district IS NULL OR bq.district <> ?)');
      params.push(districtRaw);
    }
    if (casteRaw && casteRaw !== 'GENERAL') {
      exclusions.push('(bq.caste_category IS NULL OR bq.caste_category <> ?)');
      params.push(casteRaw);
    }
    if (exclusions.length) {
      filters.push(exclusions.join(' AND '));
    }
  }

  params.push(limit);
  const sql = `
    SELECT
      bq.que_id AS queId,
      bq.beta_department_id AS betaDepartmentId,
      bq.department_gu AS departmentGu,
      bq.department_en AS departmentEn,
      bq.type AS type,
      bq.district AS district,
      bq.caste_category AS casteCategory
    FROM bank_questions bq
    LEFT JOIN user_question_exposures uqe
      ON uqe.user_id = ? AND uqe.bank_que_id = bq.que_id
    WHERE ${filters.join(' AND ')}
    LIMIT ?
  `;
  return prisma.$queryRawUnsafe(sql, ...params);
}

async function hydrateBankQuestions(queIds) {
  if (!queIds.length) return [];
  const placeholders = queIds.map(() => '?').join(',');
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT
        bq.que_id AS queId,
        bq.beta_department_id AS betaDepartmentId,
        bq.department_gu AS departmentGu,
        bq.department_en AS departmentEn,
        bq.question_gu AS questionGu,
        bq.question_en AS questionEn,
        bq.type AS type,
        bq.option_a_gu AS optionAGu,
        bq.option_b_gu AS optionBGu,
        bq.option_c_gu AS optionCGu,
        bq.option_d_gu AS optionDGu,
        bq.option_a_en AS optionAEn,
        bq.option_b_en AS optionBEn,
        bq.option_c_en AS optionCEn,
        bq.option_d_en AS optionDEn,
        bq.correct_option AS correctOption,
        bq.content AS content,
        bq.answer AS answer,
        bq.district AS district,
        bq.caste_category AS casteCategory
      FROM bank_questions bq
      WHERE bq.que_id IN (${placeholders})
    `,
    ...queIds
  );
  const byId = new Map(rows.map((row) => [row.queId, row]));
  return queIds.map((id) => byId.get(id)).filter(Boolean);
}

/**
 * Pick `count` ACCEPTED bank questions the user has never seen.
 * Tries to include PERSONALIZED_MIN..MAX profile-tagged rows (district / caste);
 * fills the rest from the general pool. Shortfalls fall back to whichever pool
 * still has unseen questions so the session can still start.
 */
async function allocateBankQuestions(user, count) {
  if (isBetaUser(user)) {
    const betaPool = await fetchCandidateLight({
      userId: user.id,
      limit: Math.max(count * 20, 500),
      districtRaw: null,
      casteRaw: null,
      personalized: false,
      betaOnly: true,
    });

    if (betaPool.length < count) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        `Only ${betaPool.length} unseen beta questions left (need ${count}).`
      );
    }

    const pickedLight = mixBetaQuestions(betaPool, count);
    return hydrateBankQuestions(pickedLight.map((q) => q.queId));
  }

  const district = (user.district || '').trim().toLowerCase();
  const caste = (user.socialCategory || '').trim().toUpperCase();
  const districtRaw = (user.district || '').trim();
  const casteRaw = (user.socialCategory || '').trim();
  const needPersonalized = Boolean(districtRaw || (casteRaw && caste !== 'GENERAL'));

  const [tagged, generalPool] = await Promise.all([
    needPersonalized
      ? fetchCandidateLight({
          userId: user.id,
          limit: Math.max(CONFIG.QUIZ.PERSONALIZED_MAX * 20, 60),
          districtRaw,
          casteRaw,
          personalized: true,
          betaOnly: false,
        })
      : Promise.resolve([]),
    fetchCandidateLight({
      userId: user.id,
      limit: Math.max(count * 8, 120),
      districtRaw,
      casteRaw,
      personalized: false,
      betaOnly: false,
    }),
  ]);

  let preferred = tagged.filter((q) => isProfileMatch(q, district, caste));
  const preferredById = new Map(preferred.map((q) => [q.queId, q]));
  const general = [];
  for (const q of generalPool) {
    if (isProfileMatch(q, district, caste)) preferredById.set(q.queId, q);
    else general.push(q);
  }
  preferred = [...preferredById.values()];

  if (!preferred.length && !general.length) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      'No new approved questions available for this user.'
    );
  }

  const targetPersonal = Math.min(personalizedTargetCount(), count);
  const preferredShuffled = shuffle(preferred);
  const generalShuffled = shuffle(general);

  const personalPick = preferredShuffled.slice(
    0,
    Math.min(targetPersonal, preferredShuffled.length)
  );
  let remaining = count - personalPick.length;
  let generalPick = generalShuffled.slice(0, remaining);
  remaining = count - personalPick.length - generalPick.length;

  if (remaining > 0) {
    const leftoverPersonal = preferredShuffled.slice(personalPick.length);
    generalPick = [...generalPick, ...leftoverPersonal.slice(0, remaining)];
  }

  const picked = shuffle([...personalPick, ...generalPick]);

  if (picked.length < count) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      `Only ${picked.length} unseen approved questions left (need ${count}).`
    );
  }

  return hydrateBankQuestions(picked.map((q) => q.queId));
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
    if (isBetaUser(user)) {
      const betaBackgrounds = await attachBetaQuestionBackgrounds(rowsForSession);
      rowsForSession = betaBackgrounds.bankRows;
    }

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

  async submit({ userId, sessionId, answers, timings, startedAt, abandoned = false }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }
    const user = await UserModel.findById(userId);
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

    const gradedRows = session.questions.map((q) => {
      const gradingQuestion = toGradingQuestion(q, session.language);
      const selectedAnswer = normalizeSubmittedAnswer(gradingQuestion, answerMap[q.bankQueId]);
      const attempted = Object.prototype.hasOwnProperty.call(timingMap, q.bankQueId);
      const timeSpentMs = attempted
        ? Math.max(0, Math.round(Number(timingMap[q.bankQueId]) || 0))
        : 0;
      const grade = attempted
        ? gradeQuestion(gradingQuestion, selectedAnswer, timeSpentMs)
        : gradeQuestion(gradingQuestion, selectedAnswer, 0);
      return {
        id: q.id,
        userId,
        bankQueId: q.bankQueId,
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
      sessionId,
      gradedRows,
      {
        correctCount,
        wrongCount: attemptedRows.length - correctCount,
        totalTimeMs,
        wallClockMs: completedMs - startedMs,
        averageTimeMs:
          attemptedRows.length > 0 ? Math.round(totalTimeMs / attemptedRows.length) : 0,
        percentage:
          totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
        abandoned: Boolean(abandoned),
      },
      {
        userId,
        role: user.role,
        district: user.district || null,
        taluka: user.taluka || null,
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
