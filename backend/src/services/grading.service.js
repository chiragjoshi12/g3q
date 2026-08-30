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

/** Builds a complete attempt result from raw answers + timings — ported from
 *  gujarat-gov-quiz/lib/domain/scoring.js's buildAttemptResult(). */
export function buildAttemptResult({ attemptId, quiz, questions, answers, timings, startedAt, completedAt }) {
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
    totalTimeMs,
    wallClockMs: Math.max(0, (completedAt ?? 0) - (startedAt ?? 0)),
    averageTimeMs: questions.length > 0 ? Math.round(totalTimeMs / questions.length) : 0,
    breakdown,
  };
}
