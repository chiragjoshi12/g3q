/**
 * Canonical bank types (question_variants) + mapping from legacy QuestionType.
 */
export const QUESTION_TYPE = {
  SINGLE_CHOICE: 'single_choice',
  TRUE_FALSE: 'true_false',
  MATCH_FOLLOWING: 'match_following',
  IMAGE_CHOICE: 'image_choice',
  DRAG_DROP: 'drag_drop',
  DRAG_INTO_BLANKS: 'drag_into_blanks',
};

export const BANK_QUESTION_TYPE = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  FILL_BLANKS: 'fill_blanks',
  SEQUENCE: 'sequence',
  MATCH_PAIRS: 'match_pairs',
};

const LEGACY_TO_BANK = {
  [QUESTION_TYPE.SINGLE_CHOICE]: BANK_QUESTION_TYPE.MCQ,
  [QUESTION_TYPE.TRUE_FALSE]: BANK_QUESTION_TYPE.TRUE_FALSE,
  [QUESTION_TYPE.MATCH_FOLLOWING]: BANK_QUESTION_TYPE.MATCH_PAIRS,
  [QUESTION_TYPE.IMAGE_CHOICE]: BANK_QUESTION_TYPE.MCQ,
  [QUESTION_TYPE.DRAG_DROP]: BANK_QUESTION_TYPE.SEQUENCE,
  [QUESTION_TYPE.DRAG_INTO_BLANKS]: BANK_QUESTION_TYPE.FILL_BLANKS,
};

const BANK_TO_LEGACY = {
  [BANK_QUESTION_TYPE.MCQ]: QUESTION_TYPE.SINGLE_CHOICE,
  [BANK_QUESTION_TYPE.TRUE_FALSE]: QUESTION_TYPE.TRUE_FALSE,
  [BANK_QUESTION_TYPE.FILL_BLANKS]: QUESTION_TYPE.DRAG_INTO_BLANKS,
  [BANK_QUESTION_TYPE.SEQUENCE]: QUESTION_TYPE.DRAG_DROP,
  [BANK_QUESTION_TYPE.MATCH_PAIRS]: QUESTION_TYPE.MATCH_FOLLOWING,
};

export function legacyTypeToBankType(legacyType) {
  return LEGACY_TO_BANK[legacyType] || BANK_QUESTION_TYPE.MCQ;
}

export function bankTypeToLegacyType(bankType) {
  return BANK_TO_LEGACY[bankType] || QUESTION_TYPE.SINGLE_CHOICE;
}

/** Build multilingual JSON payload from a legacy bank_questions row (or API fields). */
export function buildVariantPayloadFromBankRow(row) {
  const bankType = legacyTypeToBankType(row.type);
  const prompt = {
    gu: row.questionGu ?? row.question_gu ?? null,
    en: row.questionEn ?? row.question_en ?? null,
    hi: row.questionHi ?? row.question_hi ?? null,
  };

  const base = {
    prompt,
    legacyType: row.type || null,
  };

  if (row.content != null) base.content = row.content;
  if (row.answer != null) base.answer = row.answer;

  if (bankType === BANK_QUESTION_TYPE.TRUE_FALSE) {
    const correctOption = String(row.correctOption ?? row.correct_option ?? '')
      .trim()
      .toUpperCase();
    return {
      ...base,
      correct:
        correctOption === 'A' || correctOption === 'TRUE' || correctOption === 'T'
          ? true
          : correctOption === 'B' || correctOption === 'FALSE' || correctOption === 'F'
            ? false
            : row.correct ?? null,
    };
  }

  if (
    bankType === BANK_QUESTION_TYPE.MCQ ||
    bankType === BANK_QUESTION_TYPE.MATCH_PAIRS ||
    bankType === BANK_QUESTION_TYPE.SEQUENCE ||
    bankType === BANK_QUESTION_TYPE.FILL_BLANKS
  ) {
    const options = [
      {
        key: 'A',
        text: {
          gu: row.optionAGu ?? row.option_a_gu ?? null,
          en: row.optionAEn ?? row.option_a_en ?? null,
          hi: null,
        },
      },
      {
        key: 'B',
        text: {
          gu: row.optionBGu ?? row.option_b_gu ?? null,
          en: row.optionBEn ?? row.option_b_en ?? null,
          hi: null,
        },
      },
      {
        key: 'C',
        text: {
          gu: row.optionCGu ?? row.option_c_gu ?? null,
          en: row.optionCEn ?? row.option_c_en ?? null,
          hi: null,
        },
      },
      {
        key: 'D',
        text: {
          gu: row.optionDGu ?? row.option_d_gu ?? null,
          en: row.optionDEn ?? row.option_d_en ?? null,
          hi: null,
        },
      },
    ];
    return {
      ...base,
      options,
      correct: row.correctOption ?? row.correct_option ?? null,
    };
  }

  return base;
}

/** Flatten variant payload back into legacy bank column fields for the serve mirror. */
export function flattenPayloadToBankFields(bankType, payload = {}) {
  const prompt = payload.prompt || {};
  const options = Array.isArray(payload.options) ? payload.options : [];
  const byKey = Object.fromEntries(
    options.filter((o) => o && o.key).map((o) => [String(o.key).toUpperCase(), o])
  );

  const textAt = (key, lang) => byKey[key]?.text?.[lang] ?? null;

  let correctOption = null;
  if (bankType === BANK_QUESTION_TYPE.TRUE_FALSE) {
    if (payload.correct === true) correctOption = 'A';
    else if (payload.correct === false) correctOption = 'B';
  } else if (typeof payload.correct === 'string') {
    correctOption = payload.correct.toUpperCase();
  }

  return {
    type: bankTypeToLegacyType(bankType),
    questionGu: prompt.gu ?? null,
    questionEn: prompt.en ?? null,
    optionAGu: textAt('A', 'gu'),
    optionBGu: textAt('B', 'gu'),
    optionCGu: textAt('C', 'gu'),
    optionDGu: textAt('D', 'gu'),
    optionAEn: textAt('A', 'en'),
    optionBEn: textAt('B', 'en'),
    optionCEn: textAt('C', 'en'),
    optionDEn: textAt('D', 'en'),
    correctOption,
    content: payload.content ?? null,
    answer: payload.answer ?? null,
  };
}
