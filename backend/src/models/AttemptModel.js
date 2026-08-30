import { prisma } from '../config/prisma.client.js';

/**
 * Serializes to the exact shape buildAttemptResult() produces in
 * gujarat-gov-quiz/lib/domain/scoring.js — startedAt/completedAt are epoch
 * milliseconds there (Date.now()), not ISO strings.
 */
const toRaw = (attempt) => {
  if (!attempt) return null;
  return {
    attemptId: attempt.id,
    quizId: attempt.quizId,
    quizTitle: attempt.quizTitle,
    startedAt: attempt.startedAt.getTime(),
    completedAt: attempt.completedAt.getTime(),
    totalQuestions: attempt.totalQuestions,
    correctCount: attempt.correctCount,
    wrongCount: attempt.wrongCount,
    earnedPoints: attempt.earnedPoints,
    maxPoints: attempt.maxPoints,
    percentage: attempt.percentage,
    totalTimeMs: attempt.totalTimeMs,
    wallClockMs: attempt.wallClockMs,
    averageTimeMs: attempt.averageTimeMs,
    breakdown: (attempt.breakdown ?? []).map((row) => ({
      questionId: row.questionId,
      type: row.type,
      correct: row.correct,
      earnedPoints: row.earnedPoints,
      maxPoints: row.maxPoints,
      answer: row.answer,
      correctAnswer: row.correctAnswer,
      timeSpentMs: row.timeSpentMs,
    })),
    userId: attempt.userId,
    userName: attempt.user?.name ?? '',
  };
};

const WITH_RELATIONS = { breakdown: true, user: true };

export class AttemptModel {
  static async create(result) {
    const attempt = await prisma.attempt.create({
      data: {
        id: result.attemptId,
        userId: result.userId,
        quizId: result.quizId,
        quizTitle: result.quizTitle,
        startedAt: new Date(result.startedAt),
        completedAt: new Date(result.completedAt),
        totalQuestions: result.totalQuestions,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        earnedPoints: result.earnedPoints,
        maxPoints: result.maxPoints,
        percentage: result.percentage,
        totalTimeMs: result.totalTimeMs,
        wallClockMs: result.wallClockMs,
        averageTimeMs: result.averageTimeMs,
        breakdown: {
          create: result.breakdown.map((row) => ({
            questionId: row.questionId,
            type: row.type,
            correct: row.correct,
            earnedPoints: row.earnedPoints,
            maxPoints: row.maxPoints,
            answer: row.answer,
            correctAnswer: row.correctAnswer,
            timeSpentMs: row.timeSpentMs,
          })),
        },
      },
      include: WITH_RELATIONS,
    });
    return toRaw(attempt);
  }

  static async findById(attemptId) {
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      include: WITH_RELATIONS,
    });
    return toRaw(attempt);
  }

  static async exists(attemptId) {
    const count = await prisma.attempt.count({ where: { id: attemptId } });
    return count > 0;
  }

  static async listByUser(userId) {
    const attempts = await prisma.attempt.findMany({
      where: { userId },
      include: WITH_RELATIONS,
      orderBy: { completedAt: 'desc' },
    });
    return attempts.map(toRaw);
  }

  /** Aggregates used by the profile screen. */
  static async statsByUser(userId) {
    const attempts = await prisma.attempt.findMany({ where: { userId } });
    if (attempts.length === 0) {
      return { attempts: 0, bestPercentage: 0, averagePercentage: 0, totalTimeMs: 0 };
    }
    const total = attempts.reduce((sum, a) => sum + a.percentage, 0);
    return {
      attempts: attempts.length,
      bestPercentage: Math.max(...attempts.map((a) => a.percentage)),
      averagePercentage: Math.round(total / attempts.length),
      totalTimeMs: attempts.reduce((sum, a) => sum + a.totalTimeMs, 0),
    };
  }

  static async clearByUser(userId) {
    await prisma.attempt.deleteMany({ where: { userId } });
  }
}
