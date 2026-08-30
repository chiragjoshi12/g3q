import { getDataSource } from "@/lib/data/sources";
import { toExplanation, toQuestion, toQuiz } from "@/lib/domain/models";

export const quizRepository = {
  async listQuizzes() {
    const raw = await getDataSource().listQuizzes();
    return raw.map(toQuiz);
  },

  async getFeaturedQuiz() {
    const quizzes = await this.listQuizzes();
    return quizzes.find((quiz) => quiz.featured) ?? quizzes[0] ?? null;
  },

  async getQuizById(quizId) {
    return toQuiz(await getDataSource().getQuizById(quizId));
  },

  async getQuestions(quizId) {
    const raw = await getDataSource().getQuestionsByQuizId(quizId);
    return raw.map(toQuestion).sort((a, b) => a.order - b.order);
  },

  async getExplanations(quizId) {
    const raw = await getDataSource().getExplanationsByQuizId(quizId);
    return Object.fromEntries(
      Object.entries(raw).map(([id, value]) => [id, toExplanation(value)])
    );
  },

  /** One round trip for everything the quiz engine needs to start. */
  async getQuizBundle(quizId) {
    const [quiz, questions, explanations] = await Promise.all([
      this.getQuizById(quizId),
      this.getQuestions(quizId),
      this.getExplanations(quizId),
    ]);
    return { quiz, questions, explanations };
  },
};
