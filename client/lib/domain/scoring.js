import { gradeQuestion } from "@/lib/domain/grading";

/** Builds a complete, self-contained attempt result from raw answers + timings. */
export function buildAttemptResult({
  attemptId,
  quiz,
  questions,
  answers,
  timings,
  startedAt,
  completedAt,
}) {
  const breakdown = questions.map((question) =>
    gradeQuestion(question, answers[question.id], timings[question.id] ?? 0)
  );

  const correctCount = breakdown.filter((row) => row.correct).length;
  const earnedPoints = breakdown.reduce((sum, row) => sum + row.earnedPoints, 0);
  const maxPoints = breakdown.reduce((sum, row) => sum + row.maxPoints, 0);
  const totalTimeMs = breakdown.reduce((sum, row) => sum + row.timeSpentMs, 0);

  return {
    attemptId,
    quizId: quiz.id,
    quizTitle: quiz.title,
    startedAt,
    completedAt,
    totalQuestions: questions.length,
    correctCount,
    wrongCount: questions.length - correctCount,
    earnedPoints,
    maxPoints,
    percentage: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
    // Active answering time (sum of per-question timers, which pause on submit).
    totalTimeMs,
    // Wall-clock time from first question to submission, including review pauses.
    wallClockMs: Math.max(0, (completedAt ?? 0) - (startedAt ?? 0)),
    averageTimeMs:
      questions.length > 0 ? Math.round(totalTimeMs / questions.length) : 0,
    breakdown,
  };
}

/** Gujarati verdict bands used on the result screen. */
export function gradeBand(percentage) {
  if (percentage >= 85) return { id: "excellent", label: "ઉત્તમ!", tone: "success" };
  if (percentage >= 60) return { id: "good", label: "સરસ પ્રયાસ", tone: "primary" };
  if (percentage >= 40) return { id: "average", label: "સુધારાની જરૂર", tone: "warning" };
  return { id: "poor", label: "વધુ મહેનત કરો", tone: "error" };
}
