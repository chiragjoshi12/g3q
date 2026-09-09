import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { getActivePlatformWeek } from '../config/platformWeeks.js';
import { QUESTION_TYPE } from '../config/question-types.js';

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

const toSessionHistoryEntry = (session) => {
  if (!session) return null;
  const weekMeta = getActivePlatformWeek(session.completedAt || session.startedAt || new Date());
  return {
    sessionId: session.id,
    status: session.status,
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

const buildBetaExposureUpsert = (rows, completedAt) => {
  if (!rows.length) return null;

  const valuesSql = rows.map(() => '(?, ?, ?, ?, 1, ?, ?, ?)').join(', ');
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
      INSERT INTO beta_user_question_exposures (
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

/**
 * Same behaviour as QuizSessionModel, but persists into beta_* tables and
 * never writes production leaderboard aggregates.
 */
export class BetaQuizSessionModel {
  static async findById(id) {
    return prisma.betaQuizSession.findUnique({
      where: { id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  static async findInProgressForUser(userId) {
    return prisma.betaQuizSession.findFirst({
      where: { userId, status: 'in_progress' },
      include: { questions: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findInProgressMetaForUser(userId, tx = prisma) {
    return tx.betaQuizSession.findFirst({
      where: { userId, status: 'in_progress' },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async listForUser(userId) {
    // Prefer beta_* rows; also include legacy quiz_sessions from before the split
    // so certificates / quiz-attempts pages are not blank for existing beta users.
    const finished = { in: ['submitted', 'abandoned'] };
    const [betaRows, legacyRows] = await Promise.all([
      prisma.betaQuizSession.findMany({
        where: { userId, status: finished },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.quizSession.findMany({
        where: { userId, status: finished },
        orderBy: [{ completedAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const items = [...betaRows, ...legacyRows]
      .map((session) => toSessionHistoryEntry(session))
      .filter(Boolean)
      .sort((a, b) => Number(b.completedAt || 0) - Number(a.completedAt || 0));

    return {
      participatedWeeks: [...new Set(items.map((item) => item.week))],
      currentWeek: CONFIG.QUIZ.CURRENT_WEEK,
      quizSessions: items,
    };
  }

  static async findCurrentWeekForUser(userId) {
    // Only an active in-progress session should block/resume play.
    // Finished sessions must not lock the user out of playing again.
    const [betaInProgress, legacyInProgress] = await Promise.all([
      prisma.betaQuizSession.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quizSession.findFirst({
        where: { userId, status: 'in_progress' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return betaInProgress || legacyInProgress || null;
  }

  static async createWithQuestions({ userId, language, bankRows, tx = prisma }) {
    const startedAt = new Date();
    return tx.betaQuizSession.create({
      data: {
        userId,
        language,
        questionCount: bankRows.length,
        startedAt,
        status: 'in_progress',
        questions: {
          create: bankRows.map((q, index) => ({
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
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  static async updateLanguage(sessionId, language, tx = prisma) {
    return tx.betaQuizSession.update({
      where: { id: sessionId },
      data: { language },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  static async submit(sessionId, gradedRows, totals) {
    return prisma.$transaction(async (tx) => {
      const completedAt = new Date();
      const finalStatus = totals.abandoned ? 'abandoned' : 'submitted';
      const claimed = await tx.betaQuizSession.updateMany({
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
        return tx.betaQuizSession.findUnique({
          where: { id: sessionId },
          include: { questions: { orderBy: { order: 'asc' } } },
        });
      }

      await Promise.all(
        gradedRows.map((row) =>
          tx.betaQuizSessionQuestion.update({
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
      const exposureUpsert = buildBetaExposureUpsert(attemptedRows, completedAt);
      if (exposureUpsert) {
        await tx.$executeRawUnsafe(exposureUpsert.sql, ...exposureUpsert.params);
      }

      return tx.betaQuizSession.findUnique({
        where: { id: sessionId },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  static async userStats(userId) {
    const [betaSessions, legacySessions, betaExposure, legacyExposure] = await Promise.all([
      prisma.betaQuizSession.aggregate({
        where: { userId, status: 'submitted' },
        _count: { _all: true },
        _sum: {
          correctCount: true,
          wrongCount: true,
          totalTimeMs: true,
        },
        _avg: { percentage: true },
      }),
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
      prisma.betaUserQuestionExposure.aggregate({
        where: { userId },
        _count: { _all: true },
        _sum: {
          timesCorrect: true,
          timesWrong: true,
          totalTimeMs: true,
        },
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

    const sessionsCompleted = betaSessions._count._all + legacySessions._count._all;
    const percentageSum =
      (betaSessions._avg.percentage ?? 0) * betaSessions._count._all +
      (legacySessions._avg.percentage ?? 0) * legacySessions._count._all;

    return {
      sessionsCompleted,
      correctCount: (betaSessions._sum.correctCount ?? 0) + (legacySessions._sum.correctCount ?? 0),
      wrongCount: (betaSessions._sum.wrongCount ?? 0) + (legacySessions._sum.wrongCount ?? 0),
      totalTimeMs: (betaSessions._sum.totalTimeMs ?? 0) + (legacySessions._sum.totalTimeMs ?? 0),
      averagePercentage: sessionsCompleted > 0 ? Math.round(percentageSum / sessionsCompleted) : 0,
      uniqueQuestionsSeen: betaExposure._count._all + legacyExposure._count._all,
      exposureCorrect: (betaExposure._sum.timesCorrect ?? 0) + (legacyExposure._sum.timesCorrect ?? 0),
      exposureWrong: (betaExposure._sum.timesWrong ?? 0) + (legacyExposure._sum.timesWrong ?? 0),
    };
  }
}

