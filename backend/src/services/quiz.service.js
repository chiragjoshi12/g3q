import { QuizModel } from '../models/QuizModel.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

export const quizService = {
  async listQuizzes() {
    return QuizModel.list();
  },

  async getQuizById(quizId) {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) throw new AppError(ERROR_CODE.NOT_FOUND, 'ક્વિઝ મળી નથી.');
    return quiz;
  },

  async getQuestions(quizId) {
    if (!(await QuizModel.exists(quizId))) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'પ્રશ્નો મળ્યા નથી.');
    }
    return QuizModel.getQuestions(quizId);
  },

  async getExplanations(quizId) {
    if (!(await QuizModel.exists(quizId))) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'ક્વિઝ મળી નથી.');
    }
    return QuizModel.getExplanations(quizId);
  },
};
