import { prisma } from '../config/prisma.client.js';

const toRawQuiz = (quiz) => {
  if (!quiz) return null;
  return {
    id: quiz.id,
    title: quiz.title,
    subtitle: quiz.subtitle ?? '',
    description: quiz.description ?? '',
    banner: quiz.banner ?? null,
    category: quiz.category ?? '',
    level: quiz.level ?? '',
    totalQuestions: quiz.totalQuestions,
    durationMinutes: quiz.durationMinutes,
    totalPoints: quiz.totalPoints,
    featured: quiz.featured,
    tags: quiz.tags ?? [],
  };
};

const toRawQuestion = (question) => ({
  id: question.id,
  order: question.order,
  type: question.type,
  points: question.points,
  prompt: question.prompt,
  placeholder: question.placeholder ?? '',
  options: question.options ?? null,
  left: question.left ?? null,
  right: question.right ?? null,
  items: question.items ?? null,
  segments: question.segments ?? null,
  bank: question.bank ?? null,
  answer: question.answer,
  acceptable: question.acceptable ?? null,
});

const toRawExplanation = (explanation) => {
  if (!explanation) return null;
  return {
    questionId: explanation.questionId,
    model: explanation.model,
    summary: explanation.summary ?? '',
    body: explanation.body ?? '',
    keyPoints: explanation.keyPoints ?? [],
  };
};

export class QuizModel {
  static async list() {
    const quizzes = await prisma.quiz.findMany({ orderBy: { createdAt: 'asc' } });
    return quizzes.map(toRawQuiz);
  }

  static async findById(quizId) {
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    return toRawQuiz(quiz);
  }

  static async exists(quizId) {
    const count = await prisma.quiz.count({ where: { id: quizId } });
    return count > 0;
  }

  static async getQuestions(quizId) {
    const questions = await prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
    });
    return questions.map(toRawQuestion);
  }

  /** Same rows as getQuestions, but keeps the Prisma `points`/`answer` fields
   *  intact for server-side grading (not sent to clients as-is). */
  static async getQuestionsForGrading(quizId) {
    return prisma.question.findMany({ where: { quizId }, orderBy: { order: 'asc' } });
  }

  static async getExplanations(quizId) {
    const explanations = await prisma.explanation.findMany({
      where: { question: { quizId } },
    });
    return Object.fromEntries(
      explanations.map((explanation) => [explanation.questionId, toRawExplanation(explanation)])
    );
  }
}
