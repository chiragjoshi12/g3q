import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { QuizModel } from '../models/QuizModel.js';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const landingService = {
  async summary() {
    const since = new Date(Date.now() - 7 * MS_IN_DAY);
    const [totalPlays, weeklyPlays, featuredQuiz] = await Promise.all([
      prisma.quizSession.count({ where: { status: 'submitted' } }),
      prisma.quizSession.count({
        where: {
          status: 'submitted',
          completedAt: { gte: since },
        },
      }),
      QuizModel.findFeatured(),
    ]);

    return {
      totalPlays,
      weeklyPlays,
      week: CONFIG.QUIZ.CURRENT_WEEK,
      featuredQuizId: featuredQuiz?.id ?? null,
      playTitle: 'G3Q Quiz',
      playSubtitle: `વિદ્યાર્થી પ્રોફાઇલ મુજબ ${CONFIG.QUIZ.QUESTION_COUNT} પ્રશ્નો`,
      playQuestionCount: CONFIG.QUIZ.QUESTION_COUNT,
    };
  },
};
