import { nanoid } from 'nanoid';
import { QuizModel } from '../models/QuizModel.js';
import { AttemptModel } from '../models/AttemptModel.js';
import { buildAttemptResult } from './grading.service.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';

export const attemptService = {
  /**
   * Grades the session server-side (the client-submitted answers/timings are
   * the only thing trusted from the request — correctness is always
   * recomputed here) and persists the attempt + per-question breakdown.
   */
  async finalizeAttempt(userId, quizId, { attemptId, answers, timings, startedAt }) {
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) throw new AppError(ERROR_CODE.NOT_FOUND, 'ક્વિઝ મળી નથી.');

    if (attemptId && (await AttemptModel.exists(attemptId))) {
      const existing = await AttemptModel.findById(attemptId);
      if (existing.userId !== userId) {
        throw new AppError(ERROR_CODE.INVALID_REQUEST, 'આ attempt id પહેલેથી વપરાયેલ છે.');
      }
      return existing; // idempotent resubmission (e.g. a retried request)
    }

    const questions = await QuizModel.getQuestionsForGrading(quizId);
    if (questions.length === 0) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'પ્રશ્નો મળ્યા નથી.');
    }

    const completedAt = Date.now();
    const result = buildAttemptResult({
      attemptId: attemptId || `att_${quizId}_${Date.now()}_${nanoid(6)}`,
      quiz,
      questions,
      answers: answers ?? {},
      timings: timings ?? {},
      startedAt: Number(startedAt) || completedAt,
      completedAt,
    });

    return AttemptModel.create({ ...result, userId });
  },

  async getAttempt(attemptId, userId) {
    const attempt = await AttemptModel.findById(attemptId);
    // Hide existence of another user's attempt rather than 403 — no
    // enumeration signal either way.
    if (!attempt || attempt.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Attempt મળ્યો નથી.');
    }
    return attempt;
  },

  async listMine(userId) {
    return AttemptModel.listByUser(userId);
  },

  async statsMine(userId) {
    return AttemptModel.statsByUser(userId);
  },

  async clearMine(userId) {
    await AttemptModel.clearByUser(userId);
    return AttemptModel.statsByUser(userId);
  },
};
