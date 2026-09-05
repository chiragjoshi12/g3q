/**
 * Mirrors gujarat-gov-quiz/config/question-types.js. Keep in sync with the
 * `QuestionType` enum in src/prisma/schema.prisma.
 */
export const QUESTION_TYPE = {
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false',
  MATCH_FOLLOWING: 'match_following',
  IMAGE_CHOICE: 'image_choice',
  DRAG_DROP: 'drag_drop',
  DRAG_INTO_BLANKS: 'drag_into_blanks',
};
