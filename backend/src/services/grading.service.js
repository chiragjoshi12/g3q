import { QUESTION_TYPE } from '../config/question-types.js';

/**
 * Pure grading logic, ported 1:1 from gujarat-gov-quiz/lib/domain/grading.js
 * so a submitted attempt scores identically whichever side computes it.
 * This is the source of truth now — the client-side copy is not trusted.
 */

const sameSet = (a, b) => {
  const left = [...(a ?? [])].sort();
  const right = [...(b ?? [])].sort();
  return left.length === right.length && left.every((v, i) => v === right[i]);
};

const sameOrder = (a, b) => {
  const left = a ?? [];
  const right = b ?? [];
  return left.length === right.length && left.every((v, i) => v === right[i]);
};

const sameMap = (a, b) => {
  const left = a ?? {};
  const right = b ?? {};
  const keys = Object.keys(right);
  return keys.length === Object.keys(left).length && keys.every((key) => left[key] === right[key]);
};

const GRADERS = {
  [QUESTION_TYPE.SINGLE_CHOICE]: (q, a) => sameSet(a, q.answer),
  [QUESTION_TYPE.TRUE_FALSE]: (q, a) => sameSet(a, q.answer),
  [QUESTION_TYPE.IMAGE_CHOICE]: (q, a) => sameSet(a, q.answer),
  [QUESTION_TYPE.MATCH_FOLLOWING]: (q, a) => sameMap(a, q.answer),
  [QUESTION_TYPE.DRAG_DROP]: (q, a) => sameOrder(a, q.answer),
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: (q, a) => sameMap(a, q.answer),
};

export function isCorrect(question, answer) {
  const grader = GRADERS[question?.type];
  return grader ? Boolean(grader(question, answer)) : false;
}

/** Grades one question into the shape the result screen consumes. */
export function gradeQuestion(question, answer, timeSpentMs = 0) {
  const correct = isCorrect(question, answer);
  return {
    questionId: question.id,
    type: question.type,
    correct,
    earnedPoints: correct ? question.points : 0,
    maxPoints: question.points,
    answer: answer ?? null,
    correctAnswer: question.answer,
    timeSpentMs,
  };
}

function wasAttempted(timings, questionId) {
  return Object.prototype.hasOwnProperty.call(timings ?? {}, questionId);
}

/** Builds a complete attempt result from raw answers + timings — ported from
 *  client/lib/domain/scoring.js's buildAttemptResult(). */
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
    totalTimeMs,
    wallClockMs: Math.max(0, (completedAt ?? 0) - (startedAt ?? 0)),
    averageTimeMs: attemptedRows.length > 0 ? Math.round(totalTimeMs / attemptedRows.length) : 0,
    breakdown,
  };
}
