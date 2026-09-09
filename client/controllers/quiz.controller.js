import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { getDataSource } from "@/lib/data/sources";
import { quizRepository } from "@/lib/data/repositories/quiz.repository";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { toExplanation, toQuestion } from "@/lib/domain/models";
import { buildAttemptResult } from "@/lib/domain/scoring";

/** Stable-ish id without pulling in a uuid dependency. */
export function createAttemptId(quizId) {
  const random = Math.random().toString(36).slice(2, 8);
  return `att_${quizId}_${Date.now()}_${random}`;
}

function extractQuestionExplanations(rawQuestions = []) {
  return Object.fromEntries(
    (rawQuestions ?? [])
      .map((rawQuestion) => {
        const explanation = toExplanation(rawQuestion?.explanation);
        if (!explanation || !rawQuestion?.id) return null;
        return [rawQuestion.id, { ...explanation, questionId: rawQuestion.id }];
      })
      .filter(Boolean)
  );
}

function normalizeLiveSession(session) {
  if (!session) return null;
  const rawQuestions = session.questions ?? [];
  const questions = (session.questions ?? []).map(toQuestion).filter(Boolean);
  const questionLevelExplanations = extractQuestionExplanations(rawQuestions);
  const apiExplanations = Object.fromEntries(
    Object.entries(session.explanations ?? {})
      .map(([id, value]) => {
        const explanation = toExplanation(value);
        if (!explanation) return null;
        return [id, { ...explanation, questionId: id }];
      })
      .filter(Boolean)
  );
  return {
    ...session,
    questions,
    explanations: { ...apiExplanations, ...questionLevelExplanations },
  };
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

  async loadPracticeBundle({ quizId, language } = {}) {
    return quizRepository.getPracticeBundle({ quizId, language });
  },

  async startSession({ count, language } = {}) {
    if (appConfig.dataSource !== DATA_SOURCE.REST) return null;
    return getDataSource().startSession({ count, language });
  },

  async loadSession(sessionId) {
    if (appConfig.dataSource !== DATA_SOURCE.REST) return null;
    return normalizeLiveSession(await getDataSource().getSession(sessionId));
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
    practice = false,
  }) {
    if (appConfig.dataSource === DATA_SOURCE.REST && !practice) {
      const result = await getDataSource().submitSession({
        sessionId: attemptId,
        answers,
        timings,
        startedAt,
        abandoned,
      });
      return {
        attemptId: result.sessionId,
        quizId: result.sessionId,
        quizTitle: "G3Q Quiz",
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        totalQuestions: Number(result.questionCount ?? questions.length ?? 0),
        attemptedCount: Number(result.correctCount ?? 0) + Number(result.wrongCount ?? 0),
        abandoned: result.status === "abandoned",
        correctCount: Number(result.correctCount ?? 0),
        wrongCount: Number(result.wrongCount ?? 0),
        earnedPoints: Number(result.correctCount ?? 0),
        maxPoints: Number(result.questionCount ?? questions.length ?? 0),
        percentage: Number(result.percentage ?? 0),
        totalTimeMs: Number(result.totalTimeMs ?? 0),
        breakdown: result.breakdown ?? [],
        userId: user?.id ?? null,
        userName: user?.name ?? "",
        userRole: user?.role ?? null,
        institute: user?.institute ?? "",
        district: user?.district ?? "",
        taluka: user?.taluka ?? "",
        credential: user?.credential ?? "",
        week: quiz?.week ?? null,
      };
    }

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

  async getAttempt(attemptId, options) {
    return attemptRepository.getById(attemptId, options);
  },
};
