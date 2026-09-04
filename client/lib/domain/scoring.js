import { gradeQuestion } from "@/lib/domain/grading";

/** A question counts as attempted only after Submit — timings are written then. */
function wasAttempted(timings, questionId) {
  return Object.prototype.hasOwnProperty.call(timings ?? {}, questionId);
}

/** Builds a complete, self-contained attempt result from raw answers + timings. */
export function buildAttemptResult({
  attemptId,
  quiz,
  questions,
  answers,
  timings,
  startedAt,
  completedAt,
  abandoned = false,
}) {
  const attemptedIds = new Set(
    questions.filter((question) => wasAttempted(timings, question.id)).map((question) => question.id)
  );
  const leftEarly = Boolean(abandoned) || attemptedIds.size < questions.length;

  const breakdown = questions.map((question) => {
    const attempted = attemptedIds.has(question.id);
    if (!attempted) {
      return {
        ...gradeQuestion(question, answers[question.id], 0),
        correct: false,
        earnedPoints: 0,
        attempted: false,
      };
    }
    return {
      ...gradeQuestion(question, answers[question.id], timings[question.id] ?? 0),
      attempted: true,
    };
  });

  const attemptedRows = breakdown.filter((row) => row.attempted);
  const correctCount = attemptedRows.filter((row) => row.correct).length;
  const earnedPoints = breakdown.reduce((sum, row) => sum + row.earnedPoints, 0);
  const maxPoints = breakdown.reduce((sum, row) => sum + row.maxPoints, 0);
  const totalTimeMs = attemptedRows.reduce((sum, row) => sum + row.timeSpentMs, 0);
  const totalQuestions = questions.length;

  return {
    attemptId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    startedAt,
    completedAt,
    totalQuestions,
    attemptedCount: attemptedIds.size,
    abandoned: leftEarly,
    correctCount,
    wrongCount: attemptedRows.length - correctCount,
    earnedPoints,
    maxPoints,
    percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
    // Active answering time (sum of per-question timers, which pause on submit).
    totalTimeMs,
    // Wall-clock time from first question to submission, including review pauses.
    wallClockMs: Math.max(0, (completedAt ?? 0) - (startedAt ?? 0)),
    averageTimeMs: attemptedRows.length > 0 ? Math.round(totalTimeMs / attemptedRows.length) : 0,
    breakdown,
  };
}

/**
 * Result-card headline above the percentage.
 * 80%+ Great Job, 60%+ Well Done, otherwise Keep Trying.
 */
export function scorePraise(percentage) {
  if (percentage >= 80) return "Great Job !";
  if (percentage >= 60) return "Well Done !";
  return "Keep Trying !";
}

/** Gujarati verdict bands used on the result screen. */
export function gradeBand(percentage) {
  if (percentage >= 85) return { id: "excellent", label: "ઉત્તમ!", tone: "success" };
  if (percentage >= 60) return { id: "good", label: "સરસ પ્રયાસ", tone: "primary" };
  if (percentage >= 40) return { id: "average", label: "સુધારાની જરૂર", tone: "warning" };
  return { id: "poor", label: "વધુ મહેનત કરો", tone: "error" };
}
