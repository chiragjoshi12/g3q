import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { createTtlCache } from '../utils/ttlCache.js';

const MS_IN_DAY = 24 * 60 * 60 * 1000;
const landingSummaryCache = createTtlCache({ ttlMs: 45_000 });

export const landingService = {
  async summary() {
    const cached = landingSummaryCache.get();
    if (cached) return cached;

    const since = new Date(Date.now() - 7 * MS_IN_DAY);
    const [totalPlays, weeklyPlays] = await Promise.all([
      prisma.quizSession.count({ where: { status: 'submitted' } }),
      prisma.quizSession.count({
        where: {
          status: 'submitted',
          completedAt: { gte: since },
        },
      }),
    ]);

    const payload = {
      totalPlays,
      weeklyPlays,
      week: CONFIG.QUIZ.CURRENT_WEEK,
      weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
      weeks: CONFIG.QUIZ.WEEKS,
      featuredQuizId: 'practice',
      playTitle: 'G3Q Quiz',
      playSubtitle: `વિદ્યાર્થી પ્રોફાઇલ મુજબ ${CONFIG.QUIZ.QUESTION_COUNT} પ્રશ્નો`,
      playQuestionCount: CONFIG.QUIZ.QUESTION_COUNT,
    };

    return landingSummaryCache.set(payload);
  },
};
