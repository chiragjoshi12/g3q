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
