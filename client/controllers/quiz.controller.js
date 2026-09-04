import { quizRepository } from "@/lib/data/repositories/quiz.repository";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { buildAttemptResult } from "@/lib/domain/scoring";

/** Stable-ish id without pulling in a uuid dependency. */
export function createAttemptId(quizId) {
  const random = Math.random().toString(36).slice(2, 8);
  return `att_${quizId}_${Date.now()}_${random}`;
}

/**
 * Quiz use cases: fetching everything an attempt needs, and turning a finished
 * session into a persisted, graded result.
 */
export const quizController = {
  async loadFeatured() {
    return quizRepository.getFeaturedQuiz();
  },

  async listQuizzes() {
    return quizRepository.listQuizzes();
  },

  async loadBundle(quizId) {
    return quizRepository.getQuizBundle(quizId);
  },

  /** Grades the session, persists the attempt, and returns the result. */
  async finalizeAttempt({
    attemptId,
    quiz,
    questions,
    answers,
    timings,
    startedAt,
    user,
    abandoned = false,
  }) {
    const completedAt = Date.now();
    const result = buildAttemptResult({
      attemptId,
      quiz,
      questions,
      answers,
      timings,
      startedAt,
      completedAt,
      abandoned,
    });

    const attempt = {
      ...result,
      userId: user?.id ?? null,
      userName: user?.name ?? "",
      userRole: user?.role ?? null,
      institute: user?.institute ?? "",
      district: user?.district ?? "",
      taluka: user?.taluka ?? "",
      credential: user?.credential ?? "",
      week: quiz?.week ?? null,
    };

    await attemptRepository.save(attempt);
    return attempt;
  },

  async getAttempt(attemptId) {
    return attemptRepository.getById(attemptId);
  },
};
