import { CONFIG } from '../config/index.js';
import { QUESTION_TYPE } from '../config/question-types.js';
import { requestMetaChatCompletion } from './metaModelApi.service.js';

/**
 * Meta AI reframing of allocated bank questions for one play session.
 * Controlled by CONFIG.AI.ENABLED — when false, callers skip this entirely.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/
 * Model: gemini-3.5-flash-lite (cost/latency friendly Flash-Lite).
 */

const pickPrompt = (row, language) => {
  if (language === 'en') return row.questionEn || row.questionGu || '';
  return row.questionGu || row.questionEn || '';
};

const pickOption = (row, letter, language) => {
  const gu = {
    A: row.optionAGu,
    B: row.optionBGu,
    C: row.optionCGu,
    D: row.optionDGu,
  };
  const en = {
    A: row.optionAEn,
    B: row.optionBEn,
    C: row.optionCEn,
    D: row.optionDEn,
  };
  if (language === 'en') return en[letter] || gu[letter] || letter;
  return gu[letter] || en[letter] || letter;
};

const profileForPrompt = (user) => ({
  name: [user.name, user.surname].filter(Boolean).join(' ').trim() || user.name || 'Student',
  role: user.role || null,
  grade: user.grade || null,
  institute: user.institute || null,
  schoolId: user.schoolId || null,
  district: user.district || null,
  taluka: user.taluka || null,
  village: user.village || null,
  socialCategory: user.socialCategory || null,
});

const AI_SUPPORTED_TYPES = new Set([
  QUESTION_TYPE.SINGLE_CHOICE,
  QUESTION_TYPE.TRUE_FALSE,
  QUESTION_TYPE.IMAGE_CHOICE,
]);

const isAiEligible = (row) =>
  AI_SUPPORTED_TYPES.has(row?.type || QUESTION_TYPE.SINGLE_CHOICE) && Boolean(row?.correctOption);

const buildInputPayload = (user, bankRows, language) => ({
  language: language === 'en' ? 'en' : 'gu',
  student: profileForPrompt(user),
  questions: bankRows.filter(isAiEligible).map((row) => ({
    queId: row.queId,
    department:
      language === 'en'
        ? row.departmentEn || row.departmentGu
        : row.departmentGu || row.departmentEn,
    question: pickPrompt(row, language),
    optionA: pickOption(row, 'A', language),
    optionB: pickOption(row, 'B', language),
    optionC: pickOption(row, 'C', language),
    optionD: pickOption(row, 'D', language),
    // Correct letter is for the model to preserve meaning — never change letter.
    correctOption: String(row.correctOption || '').toUpperCase(),
  })),
});

const SYSTEM_INSTRUCTION = `You personalise Gujarat Knowledge Quiz (G3Q) MCQs for one student.

Rules:
1. Return exactly one reframed question per input queId. Same count and same queIds.
2. Keep option letters A/B/C/D mapped to the SAME factual answers. Never swap which letter is correct. You may rephrase option wording but the correctOption letter must stay valid for the same fact.
3. Do NOT invent new facts, years, places, or answers. Preserve the original meaning.
4. Personalise lightly: use the student's first name where natural, and optionally nod to district/school/grade in a short warm lead-in or phrasing — keep each question still clearly a quiz MCQ (not a long story).
5. Output language must match the requested language ("gu" = Gujarati script, "en" = English).
6. Keep each question concise and readable for school students.
7. Never reveal or hint which option is correct beyond normal question wording.`;

const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'PersonalizedQuestionSet',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              queId: { type: 'string' },
              question: { type: 'string' },
              optionA: { type: 'string' },
              optionB: { type: 'string' },
              optionC: { type: 'string' },
              optionD: { type: 'string' },
            },
            required: ['queId', 'question', 'optionA', 'optionB', 'optionC', 'optionD'],
          },
        },
      },
      required: ['questions'],
    },
  },
};

const parseJsonText = (text) => {
  if (!text) throw new Error('Empty Meta AI response');
  const trimmed = String(text).trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
};

const applyEnhancements = (bankRows, enhancedList, language) => {
  const byId = new Map(
    (enhancedList || [])
      .filter((q) => q && q.queId)
      .map((q) => [String(q.queId), q])
  );

  return bankRows.map((row) => {
    const enhanced = byId.get(row.queId);
    if (!enhanced?.question) return row;

    const next = { ...row };
    if (language === 'en') {
      next.questionEn = enhanced.question;
      next.optionAEn = enhanced.optionA || row.optionAEn;
      next.optionBEn = enhanced.optionB || row.optionBEn;
      next.optionCEn = enhanced.optionC || row.optionCEn;
      next.optionDEn = enhanced.optionD || row.optionDEn;
    } else {
      next.questionGu = enhanced.question;
      next.optionAGu = enhanced.optionA || row.optionAGu;
      next.optionBGu = enhanced.optionB || row.optionBGu;
      next.optionCGu = enhanced.optionC || row.optionCGu;
      next.optionDGu = enhanced.optionD || row.optionDGu;
    }
    return next;
  });
};

export const aiEnhancementService = {
  isEnabled() {
    return Boolean(CONFIG.AI.ENABLED);
  },

  /**
   * Reframe allocated bank rows for this student. On failure returns originals
   * so session start still succeeds.
   */
  async enhanceSessionQuestions({ user, bankRows, language }) {
    if (!this.isEnabled()) {
      return { bankRows, aiEnhanced: false, aiEnhancementMs: 0, error: null };
    }

    const started = Date.now();
    const lang = language === 'en' ? 'en' : 'gu';
    const eligibleRows = bankRows.filter(isAiEligible);

    if (!eligibleRows.length) {
      return { bankRows, aiEnhanced: false, aiEnhancementMs: 0, error: null };
    }

    try {
      const payload = buildInputPayload(user, eligibleRows, lang);
      const response = await requestMetaChatCompletion({
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          {
            role: 'user',
            content: `Personalise these quiz questions for the student.\n\n${JSON.stringify(payload)}`,
          },
        ],
        responseFormat: RESPONSE_FORMAT,
        maxCompletionTokens: 2400,
      });

      const parsed = parseJsonText(response?.choices?.[0]?.message?.content);
      if (!Array.isArray(parsed?.questions) || !parsed.questions.length) {
        throw new Error('Meta AI returned no questions array');
      }

      const merged = applyEnhancements(bankRows, parsed.questions, lang);
      return {
        bankRows: merged,
        aiEnhanced: true,
        aiEnhancementMs: Date.now() - started,
        error: null,
      };
    } catch (error) {
      console.error('[aiEnhancement] falling back to original questions:', error?.message || error);
      return {
        bankRows,
        aiEnhanced: false,
        aiEnhancementMs: Date.now() - started,
        error: error?.message || 'AI enhancement failed',
      };
    }
  },
};
