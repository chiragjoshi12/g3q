import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { flattenVariantRow } from '../models/BankQuestionModel.js';
import { toPlayQuestion } from '../models/QuizSessionModel.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

const PRACTICE_QUESTION_IDS = [
  'BETA_Q_001',
  'BETA_Q_001_V_TF',
  'BETA_Q_001_V_MAT',
  'BETA_Q_001_V_ORD',
  'BETA_Q_001_V_FIB',
];

function toPracticeSessionRow(row, order) {
  return {
    ...row,
    queId: row.queId,
    order,
    points: 1,
  };
}

export const quizService = {
  async getPracticeBundle({ quizId = 'practice', language = CONFIG.QUIZ.DEFAULT_LANGUAGE } = {}) {
    const variants = await prisma.questionVariant.findMany({
      where: {
        legacyQueId: { in: PRACTICE_QUESTION_IDS },
        reviewStatus: 'ACCEPTED',
      },
      include: { root: { include: { departmentRef: true } } },
    });

    const rows = variants.map(flattenVariantRow);
    const orderedRows = PRACTICE_QUESTION_IDS.map((queId) =>
      rows.find((row) => row.queId === queId)
    ).filter(Boolean);

    if (orderedRows.length !== PRACTICE_QUESTION_IDS.length) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        'Practice question bundle is incomplete in the database.'
      );
    }

    const questions = orderedRows.map((row, index) => toPracticeSessionRow(row, index + 1));

    return {
      quiz: {
        id: quizId,
        title: 'G3Q Practice',
        subtitle: 'Database-backed practice set',
        description: 'Five fixed practice questions pulled from the reviewed question bank.',
        banner: null,
        category: 'practice',
        level: 'mixed',
        totalQuestions: questions.length,
        durationMinutes: 0,
        totalPoints: questions.length,
        featured: true,
        tags: ['practice', 'database'],
        week: CONFIG.QUIZ.CURRENT_WEEK,
      },
      questions: questions.map((row) =>
        toPlayQuestion(row, language, { includeAnswer: true })
      ),
    };
  },
};
