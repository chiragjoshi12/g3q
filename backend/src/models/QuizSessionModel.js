import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { getActivePlatformWeek } from '../config/platformWeeks.js';
import { QUESTION_TYPE } from '../config/question-types.js';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];
const questionTextLanguage = (language) => (language === 'en' ? 'en' : 'gu');

const optionText = (row, letter, lang) => {
  const map =
    lang === 'en'
      ? { A: row.optionAEn, B: row.optionBEn, C: row.optionCEn, D: row.optionDEn }
      : { A: row.optionAGu, B: row.optionBGu, C: row.optionCGu, D: row.optionDGu };
  return map[letter] ?? null;
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

const questionTypeOf = (row) => row.type || QUESTION_TYPE.SINGLE_CHOICE;

const answerModeForType = (type) => {
  switch (type) {
    case QUESTION_TYPE.MATCH_FOLLOWING:
    case QUESTION_TYPE.DRAG_INTO_BLANKS:
      return 'map';
    case QUESTION_TYPE.DRAG_DROP:
      return 'sequence';
    case QUESTION_TYPE.SINGLE_CHOICE:
    case QUESTION_TYPE.TRUE_FALSE:
    case QUESTION_TYPE.IMAGE_CHOICE:
    default:
      return 'single';
  }
};

const questionContent = (row, language = 'gu') => {
  const lang = questionTextLanguage(language);
  const content = parseJson(row.content) || {};

  if (Array.isArray(content.options) && content.options.length) {
    return {
      options: content.options,
      left: content.left ?? null,
      right: content.right ?? null,
      items: content.items ?? null,
      segments: content.segments ?? null,
      bank: content.bank ?? null,
      backgroundImageUrl: content.backgroundImageUrl ?? null,
      backgroundStyle: content.backgroundStyle ?? null,
    };
  }

  return {
    options: OPTION_KEYS.map((letter) => ({
      id: letter.toLowerCase(),
      label:
        optionText(row, letter, lang) || optionText(row, letter, lang === 'en' ? 'gu' : 'en') || letter,
    })),
    left: content.left ?? null,
    right: content.right ?? null,
    items: content.items ?? null,
    segments: content.segments ?? null,
    bank: content.bank ?? null,
    backgroundImageUrl: content.backgroundImageUrl ?? null,
    backgroundStyle: content.backgroundStyle ?? null,
  };
};

const questionAnswer = (row) => {
  const type = questionTypeOf(row);
  const stored = parseJson(row.answer);
  if (stored != null) return stored;

  if (
    type === QUESTION_TYPE.SINGLE_CHOICE ||
    type === QUESTION_TYPE.TRUE_FALSE ||
    type === QUESTION_TYPE.IMAGE_CHOICE
  ) {
    return row.correctOption ? [String(row.correctOption).toLowerCase()] : [];
  }
  return null;
};

const optionListToMap = (options = []) =>
  Object.fromEntries(
    (options || []).map((option) => [
      option.id,
      option.image || option.imageUrl
        ? {
            label: option.label,
            imageUrl: option.image || option.imageUrl,
          }
        : option.label,
    ])
  );

const promptWithBlankTokens = (segments = []) =>
  (segments || [])
    .map((segment) =>
      segment?.type === 'blank' ? `{{${segment.id}}}` : String(segment?.value || '').trim()
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const compactTargets = (row, language = 'gu') => {
  const type = questionTypeOf(row);
  const content = questionContent(row, language);
  if (type === QUESTION_TYPE.MATCH_FOLLOWING) {
    return Object.fromEntries((content.left || []).map((item) => [item.id, item.label]));
  }
  return undefined;
};

const compactQuestionText = (row, language = 'gu') => {
  const type = questionTypeOf(row);
  const lang = questionTextLanguage(language);
  const prompt = lang === 'en' ? row.questionEn || row.questionGu : row.questionGu || row.questionEn;
  if (type !== QUESTION_TYPE.DRAG_INTO_BLANKS) return prompt || '';
  return promptWithBlankTokens(questionContent(row, lang).segments || []);
};

const compactOptions = (row, language = 'gu') => {
  const type = questionTypeOf(row);
  const content = questionContent(row, language);
  if (type === QUESTION_TYPE.MATCH_FOLLOWING) {
    return optionListToMap(content.right || []);
  }
  if (type === QUESTION_TYPE.DRAG_DROP) {
    return optionListToMap(content.items || []);
  }
  if (type === QUESTION_TYPE.DRAG_INTO_BLANKS) {
    return optionListToMap(content.bank || []);
  }
  const baseOptions = (content.options || []).filter((option) => option?.id && option?.label);
  if (type === QUESTION_TYPE.TRUE_FALSE) {
    return optionListToMap(baseOptions.slice(0, 2));
  }
  return optionListToMap(baseOptions);
};

const compactAnswer = (row) => {
  const type = questionTypeOf(row);
  const raw = questionAnswer(row);
  const mode = answerModeForType(type);
  return {
    mode,
    value: mode === 'single' ? raw?.[0] ?? null : raw,
  };
};

const choiceAnswerText = (row, language = 'gu') => {
  const answer = questionAnswer(row);
  const choiceId = Array.isArray(answer) ? answer[0] : null;
  if (!choiceId) return null;
  const content = questionContent(row, language);
  return (content.options || []).find((option) => option.id === choiceId)?.label || choiceId;
};

const explanationBody = (row, language = 'gu') => {
  const lang = questionTextLanguage(language);
  const type = questionTypeOf(row);
  const department =
    lang === 'en' ? row.departmentEn || row.departmentGu : row.departmentGu || row.departmentEn;
  const correctText =
    type === QUESTION_TYPE.MATCH_FOLLOWING
      ? lang === 'en'
        ? 'Match the correct pairs.'
        : 'યોગ્ય જોડકાં જોડો.'
      : type === QUESTION_TYPE.DRAG_DROP
        ? lang === 'en'
          ? 'Arrange the items in the right order.'
          : 'વસ્તુઓને સાચા ક્રમમાં ગોઠવો.'
        : type === QUESTION_TYPE.DRAG_INTO_BLANKS
          ? lang === 'en'
            ? 'Fill the blanks with the correct words.'
            : 'ખાલી જગ્યા માટે યોગ્ય શબ્દો ગોઠવો.'
          : choiceAnswerText(row, lang);

  if (lang === 'en') {
    return [
      department ? `This question belongs to ${department}.` : 'This question is from the current quiz set.',
      correctText ? `The correct answer is ${correctText}.` : 'Review the correct response carefully.',
      'Read the options carefully and connect the answer to the key fact in the question.',
    ].join(' ');
  }

  return [
    department ? `આ પ્રશ્ન ${department} વિષય સાથે સંબંધિત છે.` : 'આ પ્રશ્ન વર્તમાન ક્વિઝ સેટમાંથી લેવામાં આવ્યો છે.',
    correctText ? `સાચો જવાબ ${correctText} છે.` : 'યોગ્ય જવાબ ફરી ધ્યાનથી જુઓ.',
    'પ્રશ્નના મુખ્ય તથ્ય સાથે વિકલ્પોને જોડીને જવાબ યાદ રાખો.',
  ].join(' ');
};

export const toPlayExplanation = (row, language = 'gu') => {
  const lang = questionTextLanguage(language);
  const storedExplanation = parseJson(row.content)?.explanation;
  if (storedExplanation?.body) {
    return {
      questionId: row.bankQueId,
      model: storedExplanation.model || 'G3Q',
      summary: storedExplanation.summary ?? '',
      body: storedExplanation.body,
      keyPoints: Array.isArray(storedExplanation.keyPoints) ? storedExplanation.keyPoints : [],
    };
  }
  const correctText = choiceAnswerText(row, lang);
  return {
    questionId: row.bankQueId,
    model: 'G3Q',
    summary:
      lang === 'en'
        ? correctText
          ? `Correct answer: ${correctText}`
          : 'Review the correct response'
        : correctText
          ? `સાચો જવાબ: ${correctText}`
          : 'યોગ્ય જવાબ ફરી જુઓ',
    body: explanationBody(row, lang),
    keyPoints:
      lang === 'en'
        ? ['Review the core fact in the prompt.', correctText ? `Remember: ${correctText}` : 'Focus on the correct response pattern.']
        : ['પ્રશ્નનો મુખ્ય તથ્ય ફરી વાંચો.', correctText ? `યાદ રાખો: ${correctText}` : 'યોગ્ય જવાબના પેટર્ન પર ધ્યાન આપો.'],
  };
};

/** Client-facing question — never includes correctOption. */
export const toPlayQuestion = (row, language = 'gu') => {
  const lang = questionTextLanguage(language);
  const type = questionTypeOf(row);
  const explanation = toPlayExplanation(row, lang);
  const targets = compactTargets(row, lang);
  return {
    id: row.bankQueId,
    order: row.order,
    type,
    points: row.points,
    question: compactQuestionText(row, lang),
    department: lang === 'en' ? row.departmentEn || row.departmentGu : row.departmentGu || row.departmentEn,
    bg: questionContent(row, lang).backgroundImageUrl ?? null,
    options: compactOptions(row, lang),
    ...(targets ? { targets } : {}),
    answer: compactAnswer(row),
    explanation: explanation?.body || '',
  };
};

export const toGradingQuestion = (row, language = 'gu') => ({
  ...toPlayQuestion(row, language),
  answer: questionAnswer(row),
});

export const toSessionMeta = (session) => {
  if (!session) return null;
  const weekMeta = getActivePlatformWeek(session.completedAt || session.startedAt || new Date());
  return {
    sessionId: session.id,
    status: session.status,
    questionCount: session.questionCount,
    language: session.language,
    startedAt: session.startedAt.getTime(),
    completedAt: session.completedAt ? session.completedAt.getTime() : null,
    correctCount: session.correctCount ?? null,
    wrongCount: session.wrongCount ?? null,
    totalTimeMs: session.totalTimeMs ?? null,
    percentage: session.percentage ?? null,
    week: weekMeta.id,
    weekMeta,
  };
};

export const toSessionSummary = (session) => toSessionMeta(session);

const toSessionHistoryEntry = (session) => {
  if (!session) return null;
  const weekMeta = getActivePlatformWeek(session.completedAt || session.startedAt || new Date());
  return {
    sessionId: session.id,
    questionCount: session.questionCount,
    completedAt: session.completedAt ? session.completedAt.getTime() : null,
    correctCount: session.correctCount ?? 0,
    wrongCount: session.wrongCount ?? 0,
    percentage: session.percentage ?? 0,
    totalTimeMs: session.totalTimeMs ?? 0,
    week: weekMeta.id,
    weekMeta,
  };
};

export const toSessionPlayPayload = (session) => ({
  ...toSessionMeta(session),
  questions: (session.questions || [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => toPlayQuestion(q, session.language)),
});

export const toSessionResult = (session) => {
  const questions = (session.questions || []).slice().sort((a, b) => a.order - b.order);
  return {
    ...toSessionSummary(session),
    breakdown: questions.map((q) => ({
      questionId: q.bankQueId,
      order: q.order,
      type: questionTypeOf(q),
      correct: Boolean(q.isCorrect),
      earnedPoints: q.isCorrect ? q.points : 0,
      maxPoints: q.points,
      answer:
        parseJson(q.selectedAnswer) ??
        (q.selectedOption ? [q.selectedOption.toLowerCase()] : null),
      correctAnswer: questionAnswer(q),
      timeSpentMs: q.timeSpentMs ?? 0,
      prompt: session.language === 'en' ? q.questionEn || q.questionGu : q.questionGu || q.questionEn,
    })),
  };
};

const buildExposureUpsert = (rows, completedAt) => {
  if (!rows.length) return null;

  const valuesSql = rows
    .map(() => '(?, ?, ?, ?, 1, ?, ?, ?)')
    .join(', ');
  const params = [];
  for (const row of rows) {
    params.push(
      row.userId,
      row.bankQueId,
      completedAt,
      completedAt,
      row.isCorrect ? 1 : 0,
      row.isCorrect ? 0 : 1,
      row.timeSpentMs
    );
  }

  return {
    sql: `
      INSERT INTO user_question_exposures (
        user_id,
        bank_que_id,
        first_seen_at,
        last_seen_at,
        times_seen,
        times_correct,
        times_wrong,
        total_time_ms
      )
      VALUES ${valuesSql}
      ON DUPLICATE KEY UPDATE
        last_seen_at = VALUES(last_seen_at),
        times_seen = times_seen + 1,
        times_correct = times_correct + VALUES(times_correct),
        times_wrong = times_wrong + VALUES(times_wrong),
        total_time_ms = total_time_ms + VALUES(total_time_ms)
    `,
    params,
  };
};

const buildLeaderboardAggregateUpsert = ({
  week,
  role,
  taluka,
  district,
  userId,
  totals,
  completedAt,
}) => ({
  sql: `
    INSERT INTO leaderboard_aggregates (
      week,
      role,
      taluka,
      district,
      user_id,
      best_percentage,
      total_correct,
      total_wrong,
      total_time_ms,
      sessions_completed,
      last_completed_at,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      district = COALESCE(VALUES(district), district),
      best_percentage = GREATEST(best_percentage, VALUES(best_percentage)),
      total_correct = total_correct + VALUES(total_correct),
      total_wrong = total_wrong + VALUES(total_wrong),
      total_time_ms = total_time_ms + VALUES(total_time_ms),
      sessions_completed = sessions_completed + 1,
      last_completed_at = VALUES(last_completed_at),
      updated_at = VALUES(updated_at)
  `,
  params: [
    week,
    role,
    taluka,
    district,
    userId,
    totals.percentage,
    totals.correctCount,
    totals.wrongCount,
    totals.totalTimeMs,
    completedAt,
    completedAt,
    completedAt,
  ],
});

export class QuizSessionModel {
  static async findById(id) {
    return prisma.quizSession.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  static async findInProgressForUser(userId) {
    return prisma.quizSession.findFirst({
      where: { userId, status: 'in_progress' },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findInProgressMetaForUser(userId, tx = prisma) {
    return tx.quizSession.findFirst({
      where: { userId, status: 'in_progress' },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listForUser(userId) {
    const where = { userId, status: 'submitted' };
    const rows = await prisma.quizSession.findMany({
      where,
      orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const seenWeeks = new Set();
    const items = [];

    for (const session of rows) {
      const weekMeta = getActivePlatformWeek(session.completedAt || session.startedAt || new Date());
      if (seenWeeks.has(weekMeta.id)) continue;
      seenWeeks.add(weekMeta.id);
      items.push(toSessionHistoryEntry(session));
    }

    return {
      participatedWeeks: items.map((item) => item.week),
      currentWeek: CONFIG.QUIZ.CURRENT_WEEK,
      quizSessions: items,
    };
  }

  static async findCurrentWeekForUser(userId) {
    const rows = await prisma.quizSession.findMany({
      where: {
        userId,
        status: { in: ['in_progress', 'submitted', 'abandoned'] },
      },
      orderBy: [{ createdAt: 'desc' }, { completedAt: 'desc' }],
    });

    return (
      rows.find(
        (session) =>
          getActivePlatformWeek(session.completedAt || session.startedAt || new Date()).id ===
          CONFIG.QUIZ.CURRENT_WEEK
      ) || null
    );
  }

  static questionCreateManyRows(sessionId, bankRows) {
    return bankRows.map((q, index) => ({
      sessionId,
      order: index + 1,
      type: q.type || QUESTION_TYPE.SINGLE_CHOICE,
      bankQueId: q.queId,
      points: 1,
      departmentGu: q.departmentGu,
      departmentEn: q.departmentEn,
      questionGu: q.questionGu,
      questionEn: q.questionEn,
      optionAGu: q.optionAGu,
      optionBGu: q.optionBGu,
      optionCGu: q.optionCGu,
      optionDGu: q.optionDGu,
      optionAEn: q.optionAEn,
      optionBEn: q.optionBEn,
      optionCEn: q.optionCEn,
      optionDEn: q.optionDEn,
      correctOption: q.correctOption ? String(q.correctOption).toUpperCase() : 'A',
      content: parseJson(q.content) ?? null,
      answer: parseJson(q.answer) ?? null,
    }));
  }

  /** Session row only (no questions). Caller bulk-inserts questions after commit. */
  static async createSessionShell({ userId, language, questionCount, tx = prisma }) {
    return tx.quizSession.create({
      data: {
        userId,
        language,
        questionCount,
        startedAt: new Date(),
        status: 'in_progress',
      },
    });
  }

  static async insertQuestions(sessionId, bankRows, tx = prisma) {
    if (!bankRows.length) return;
    await tx.quizSessionQuestion.createMany({
      data: QuizSessionModel.questionCreateManyRows(sessionId, bankRows),
    });
  }

  /** One session INSERT + one createMany. No include re-read. */
  static async createWithQuestions({ userId, language, bankRows, tx = prisma }) {
    const session = await QuizSessionModel.createSessionShell({
      userId,
      language,
      questionCount: bankRows.length,
      tx,
    });
    await QuizSessionModel.insertQuestions(session.id, bankRows, tx);
    return session;
  }

  static async submit(sessionId, gradedRows, totals, leaderboardContext = null) {
    return prisma.$transaction(async (tx) => {
      const completedAt = new Date();
      const finalStatus = totals.abandoned ? 'abandoned' : 'submitted';
      const claimed = await tx.quizSession.updateMany({
        where: { id: sessionId, status: 'in_progress' },
        data: {
          status: finalStatus,
          completedAt,
          correctCount: totals.correctCount,
          wrongCount: totals.wrongCount,
          totalTimeMs: totals.totalTimeMs,
          wallClockMs: totals.wallClockMs,
          averageTimeMs: totals.averageTimeMs,
          percentage: totals.percentage,
        },
      });

      if (!claimed.count) {
        return tx.quizSession.findUnique({
          where: { id: sessionId },
          include: { questions: { orderBy: { order: 'asc' } } },
        });
      }

      await Promise.all(
        gradedRows.map((row) =>
          tx.quizSessionQuestion.update({
            where: { id: row.id },
            data: {
              selectedOption: row.selectedOption ?? null,
              selectedAnswer: row.selectedAnswer ?? null,
              isCorrect: row.isCorrect,
              timeSpentMs: row.timeSpentMs,
            },
          })
        )
      );

      const attemptedRows = gradedRows.filter((row) => row.attempted);
      const exposureUpsert = buildExposureUpsert(attemptedRows, completedAt);
      if (exposureUpsert) {
        await tx.$executeRawUnsafe(exposureUpsert.sql, ...exposureUpsert.params);
      }

      if (
        finalStatus === 'submitted' &&
        leaderboardContext?.userId &&
        leaderboardContext?.taluka &&
        leaderboardContext?.role
      ) {
        const week = getActivePlatformWeek(completedAt).id;
        const aggregateUpsert = buildLeaderboardAggregateUpsert({
          week,
          role: leaderboardContext.role,
          taluka: leaderboardContext.taluka,
          district: leaderboardContext.district || null,
          userId: leaderboardContext.userId,
          totals,
          completedAt,
        });
        await tx.$executeRawUnsafe(aggregateUpsert.sql, ...aggregateUpsert.params);

        await tx.leaderboardTalukaStat.upsert({
          where: {
            week_taluka: {
              week,
              taluka: leaderboardContext.taluka,
            },
          },
          update: {
            district: leaderboardContext.district || undefined,
            submittedSessions: { increment: 1 },
          },
          create: {
            week,
            taluka: leaderboardContext.taluka,
            district: leaderboardContext.district || null,
            submittedSessions: 1,
          },
        });
      }

      return tx.quizSession.findUnique({
        where: { id: sessionId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  static async userStats(userId) {
    const [sessions, exposureAgg] = await Promise.all([
      prisma.quizSession.aggregate({
        where: { userId, status: 'submitted' },
        _count: { _all: true },
        _sum: {
          correctCount: true,
          wrongCount: true,
          totalTimeMs: true,
        },
        _avg: { percentage: true },
      }),
      prisma.userQuestionExposure.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: {
          timesCorrect: true,
          timesWrong: true,
          totalTimeMs: true,
        },
      }),
    ]);

    return {
      sessionsCompleted: sessions._count._all,
      correctCount: sessions._sum.correctCount ?? 0,
      wrongCount: sessions._sum.wrongCount ?? 0,
      totalTimeMs: sessions._sum.totalTimeMs ?? 0,
      averagePercentage: sessions._avg.percentage != null ? Math.round(sessions._avg.percentage) : 0,
      uniqueQuestionsSeen: exposureAgg._count._all,
      exposureCorrect: exposureAgg._sum.timesCorrect ?? 0,
      exposureWrong: exposureAgg._sum.timesWrong ?? 0,
    };
  }
}
