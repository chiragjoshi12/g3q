import { prisma } from '../config/prisma.client.js';

const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const optionText = (row, letter, lang) => {
  const map =
    lang === 'en'
      ? { A: row.optionAEn, B: row.optionBEn, C: row.optionCEn, D: row.optionDEn }
      : { A: row.optionAGu, B: row.optionBGu, C: row.optionCGu, D: row.optionDGu };
  return map[letter] ?? null;
};

/** Client-facing question — never includes correctOption. */
export const toPlayQuestion = (row, language = 'gu') => {
  const lang = language === 'en' ? 'en' : 'gu';
  const prompt = lang === 'en' ? row.questionEn || row.questionGu : row.questionGu || row.questionEn;
  return {
    id: row.bankQueId,
    order: row.order,
    type: 'single_choice',
    points: row.points,
    prompt: prompt || '',
    department: lang === 'en' ? row.departmentEn || row.departmentGu : row.departmentGu || row.departmentEn,
    options: OPTION_KEYS.map((letter) => ({
      id: letter.toLowerCase(),
      label: optionText(row, letter, lang) || optionText(row, letter, lang === 'en' ? 'gu' : 'en') || letter,
    })),
  };
};

export const toSessionSummary = (session) => {
  if (!session) return null;
  return {
    sessionId: session.id,
    status: session.status,
    questionCount: session.questionCount,
    language: session.language,
    startedAt: session.startedAt.getTime(),
    expiresAt: session.expiresAt ? session.expiresAt.getTime() : null,
    completedAt: session.completedAt ? session.completedAt.getTime() : null,
    correctCount: session.correctCount ?? null,
    wrongCount: session.wrongCount ?? null,
    totalTimeMs: session.totalTimeMs ?? null,
    wallClockMs: session.wallClockMs ?? null,
    averageTimeMs: session.averageTimeMs ?? null,
    percentage: session.percentage ?? null,
  };
};

export const toSessionPlayPayload = (session) => ({
  ...toSessionSummary(session),
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
      type: 'single_choice',
      correct: Boolean(q.isCorrect),
      earnedPoints: q.isCorrect ? q.points : 0,
      maxPoints: q.points,
      answer: q.selectedOption ? [q.selectedOption.toLowerCase()] : null,
      correctAnswer: [q.correctOption.toLowerCase()],
      timeSpentMs: q.timeSpentMs ?? 0,
      prompt: session.language === 'en' ? q.questionEn || q.questionGu : q.questionGu || q.questionEn,
    })),
  };
};

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

  static async listForUser(userId, { page = 1, pageSize = 20 } = {}) {
    const where = { userId, status: 'submitted' };
    const [total, rows] = await Promise.all([
      prisma.quizSession.count({ where }),
      prisma.quizSession.findMany({
        where,
        orderBy: { completedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      total,
      page,
      page_size: pageSize,
      items: rows.map(toSessionSummary),
    };
  }

  static async createWithQuestions({ userId, language, expiresAt, bankRows }) {
    const startedAt = new Date();
    return prisma.quizSession.create({
      data: {
        userId,
        language,
        questionCount: bankRows.length,
        startedAt,
        expiresAt,
        status: 'in_progress',
        questions: {
          create: bankRows.map((q, index) => ({
            order: index + 1,
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
            correctOption: String(q.correctOption).toUpperCase(),
          })),
        },
      },
      include: { questions: { orderBy: { order: 'asc' } } },
    });
  }

  static async submit(sessionId, gradedRows, totals) {
    return prisma.$transaction(async (tx) => {
      for (const row of gradedRows) {
        await tx.quizSessionQuestion.update({
          where: { id: row.id },
          data: {
            selectedOption: row.selectedOption,
            isCorrect: row.isCorrect,
            timeSpentMs: row.timeSpentMs,
          },
        });

        if (!row.attempted) continue;

        const existing = await tx.userQuestionExposure.findUnique({
          where: {
            userId_bankQueId: { userId: row.userId, bankQueId: row.bankQueId },
          },
        });

        if (existing) {
          await tx.userQuestionExposure.update({
            where: {
              userId_bankQueId: { userId: row.userId, bankQueId: row.bankQueId },
            },
            data: {
              lastSeenAt: new Date(),
              timesSeen: existing.timesSeen + 1,
              timesCorrect: existing.timesCorrect + (row.isCorrect ? 1 : 0),
              timesWrong: existing.timesWrong + (row.isCorrect ? 0 : 1),
              totalTimeMs: existing.totalTimeMs + row.timeSpentMs,
            },
          });
        } else {
          await tx.userQuestionExposure.create({
            data: {
              userId: row.userId,
              bankQueId: row.bankQueId,
              firstSeenAt: new Date(),
              lastSeenAt: new Date(),
              timesSeen: 1,
              timesCorrect: row.isCorrect ? 1 : 0,
              timesWrong: row.isCorrect ? 0 : 1,
              totalTimeMs: row.timeSpentMs,
            },
          });
        }
      }

      return tx.quizSession.update({
        where: { id: sessionId },
        data: {
          status: 'submitted',
          completedAt: new Date(),
          correctCount: totals.correctCount,
          wrongCount: totals.wrongCount,
          totalTimeMs: totals.totalTimeMs,
          wallClockMs: totals.wallClockMs,
          averageTimeMs: totals.averageTimeMs,
          percentage: totals.percentage,
        },
        include: { questions: { orderBy: { order: 'asc' } } },
      });
    });
  }

  static async markExpired(sessionId) {
    return prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: 'expired' },
      include: { questions: { orderBy: { order: 'asc' } } },
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
