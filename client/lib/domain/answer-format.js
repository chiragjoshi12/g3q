import { QUESTION_TYPE } from "@/config/question-types";

/**
 * Turns a raw answer value into readable Gujarati for the review screen.
 * Kept separate from grading so display changes never touch scoring logic.
 */

const labelOf = (collection, id) =>
  (collection ?? []).find((item) => item.id === id)?.label ?? "—";

const FORMATTERS = {
  [QUESTION_TYPE.SINGLE_CHOICE]: (q, value) =>
    (value ?? []).map((id) => labelOf(q.options, id)),

  [QUESTION_TYPE.IMAGE_CHOICE]: (q, value) =>
    (value ?? []).map((id) => labelOf(q.options, id)),

  [QUESTION_TYPE.MATCH_FOLLOWING]: (q, value) =>
    (q.left ?? []).map(
      (left) => `${left.label} → ${labelOf(q.right, (value ?? {})[left.id])}`
    ),

  [QUESTION_TYPE.DRAG_DROP]: (q, value) =>
    (value ?? []).map(
      (id, index) => `${index + 1}. ${labelOf(q.items, id)}`
    ),

  [QUESTION_TYPE.DRAG_INTO_BLANKS]: (q, value) => {
    const blanks = (q.segments ?? []).filter((s) => s.type === "blank");
    return blanks.map(
      (blank, index) =>
        `ખાલી જગ્યા ${index + 1}: ${labelOf(q.bank, (value ?? {})[blank.id])}`
    );
  },
};

/** Always returns an array of display lines, empty when nothing was answered. */
export function describeAnswer(question, value) {
  if (!question) return [];
  const formatter = FORMATTERS[question.type];
  if (!formatter) return [];
  return formatter(question, value).filter(Boolean);
}

export function describeCorrectAnswer(question) {
  return describeAnswer(question, question?.answer);
}
