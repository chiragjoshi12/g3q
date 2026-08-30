import { QUESTION_TYPE } from "@/config/question-types";

/**
 * Pure grading logic — no React, no storage, no I/O.
 *
 * Adding a question type means adding one entry to each of the three maps below.
 * Everything is deliberately side-effect free so it stays trivially testable and
 * can move to a server-side scoring endpoint unchanged.
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
  return (
    keys.length === Object.keys(left).length &&
    keys.every((key) => left[key] === right[key])
  );
};

/** The value an unanswered question starts from, per type. */
const EMPTY_ANSWER = {
  [QUESTION_TYPE.SINGLE_CHOICE]: () => [],
  [QUESTION_TYPE.IMAGE_CHOICE]: () => [],
  [QUESTION_TYPE.MATCH_FOLLOWING]: () => ({}),
  [QUESTION_TYPE.DRAG_DROP]: (question) =>
    (question.items ?? []).map((item) => item.id),
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: () => ({}),
};

/** Whether the user has supplied enough input for Submit to appear. */
const IS_ANSWERED = {
  [QUESTION_TYPE.SINGLE_CHOICE]: (_q, a) => (a ?? []).length === 1,
  [QUESTION_TYPE.IMAGE_CHOICE]: (_q, a) => (a ?? []).length === 1,
  [QUESTION_TYPE.MATCH_FOLLOWING]: (q, a) =>
    Object.keys(a ?? {}).length === (q.left ?? []).length,
  // Ordering starts pre-filled, so any complete ordering counts as answered.
  [QUESTION_TYPE.DRAG_DROP]: (q, a) => (a ?? []).length === (q.items ?? []).length,
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: (q, a) => {
    const blanks = (q.segments ?? []).filter((s) => s.type === "blank");
    const filled = Object.values(a ?? {}).filter(Boolean);
    return filled.length === blanks.length;
  },
};

const GRADERS = {
  [QUESTION_TYPE.SINGLE_CHOICE]: (q, a) => sameSet(a, q.answer),
  [QUESTION_TYPE.IMAGE_CHOICE]: (q, a) => sameSet(a, q.answer),
  [QUESTION_TYPE.MATCH_FOLLOWING]: (q, a) => sameMap(a, q.answer),
  [QUESTION_TYPE.DRAG_DROP]: (q, a) => sameOrder(a, q.answer),
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: (q, a) => sameMap(a, q.answer),
};

export function emptyAnswerFor(question) {
  const factory = EMPTY_ANSWER[question?.type];
  return factory ? factory(question) : null;
}

export function isAnswered(question, answer) {
  if (!question) return false;
  const check = IS_ANSWERED[question.type];
  return check ? Boolean(check(question, answer)) : false;
}

export function isCorrect(question, answer) {
  if (!question) return false;
  const grader = GRADERS[question.type];
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
    answer,
    correctAnswer: question.answer,
    timeSpentMs,
  };
}
