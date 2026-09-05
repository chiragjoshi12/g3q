/**
 * Every question type the engine understands. Adding a type means adding an
 * entry here, a grader in lib/domain/grading.js, and a renderer in
 * components/quiz/questions/ — nothing else in the app needs to change.
 */
export const QUESTION_TYPE = {
  SINGLE_CHOICE: "single_choice",
  TRUE_FALSE: "true_false",
  MATCH_FOLLOWING: "match_following",
  IMAGE_CHOICE: "image_choice",
  DRAG_DROP: "drag_drop",
  DRAG_INTO_BLANKS: "drag_into_blanks",
};

export const QUESTION_TYPE_LABEL = {
  [QUESTION_TYPE.SINGLE_CHOICE]: "એક વિકલ્પ",
  [QUESTION_TYPE.TRUE_FALSE]: "સાચું / ખોટું",
  [QUESTION_TYPE.MATCH_FOLLOWING]: "જોડકાં જોડો",
  [QUESTION_TYPE.IMAGE_CHOICE]: "ચિત્ર આધારિત",
  [QUESTION_TYPE.DRAG_DROP]: "ક્રમમાં ગોઠવો",
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: "ખેંચીને ગોઠવો",
};
