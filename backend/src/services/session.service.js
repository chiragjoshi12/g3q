import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import {
  QuizSessionModel,
  toSessionPlayPayload,
  toSessionResult,
  toSessionSummary,
} from '../models/QuizSessionModel.js';
import { UserModel } from '../models/UserModel.js';

const normalizeOption = (value) => {
  if (value == null) return null;
  if (Array.isArray(value) && value.length) {
    return String(value[0]).trim().toUpperCase().slice(0, 1);
  }
  return String(value).trim().toUpperCase().slice(0, 1);
};

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Pick `count` ACCEPTED bank questions the user has never seen.
 * Prefers district / caste-targeted rows when the user profile has those fields.
 */
async function allocateBankQuestions(user, count) {
  const seen = await prisma.userQuestionExposure.findMany({
    where: { userId: user.id },
    select: { bankQueId: true },
  });
  const seenIds = seen.map((r) => r.bankQueId);

  const baseWhere = {
    reviewStatus: 'ACCEPTED',
    correctOption: { not: null },
    ...(seenIds.length ? { queId: { notIn: seenIds } } : {}),
  };

  const candidates = await prisma.bankQuestion.findMany({
    where: baseWhere,
    take: Math.max(count * 5, 100),
  });

  if (!candidates.length) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      'No new approved questions available for this user.'
    );
  }

  const district = (user.district || '').trim().toLowerCase();
  const caste = (user.socialCategory || '').trim().toUpperCase();

  const preferred = [];
  const general = [];

  for (const q of candidates) {
    const qDistrict = (q.district || '').trim().toLowerCase();
    const qCaste = (q.casteCategory || '').trim().toUpperCase();
    const isLocal = district && qDistrict && qDistrict === district;
    const isCaste =
      caste &&
      caste !== 'GENERAL' &&
      q.scope === 'TARGETED' &&
      qCaste === caste;

    if (isLocal || isCaste) preferred.push(q);
    else general.push(q);
  }

  const picked = [...shuffle(preferred), ...shuffle(general)].slice(0, count);

  if (picked.length < count) {
    throw new AppError(
      ERROR_CODE.INVALID_REQUEST,
      `Only ${picked.length} unseen approved questions left (need ${count}).`
    );
  }

  return picked;
}

export const sessionService = {
  async start({ userId, count, language }) {
    const user = await UserModel.findById(userId);
    if (!user) throw new AppError(ERROR_CODE.UNAUTHORIZED);

    const existing = await QuizSessionModel.findInProgressForUser(userId);
    if (existing) {
      if (existing.expiresAt && existing.expiresAt.getTime() < Date.now()) {
        await QuizSessionModel.markExpired(existing.id);
      } else {
        return toSessionPlayPayload(existing);
      }
    }

    const questionCount = count || CONFIG.QUIZ.QUESTION_COUNT;
    const lang = language || CONFIG.QUIZ.DEFAULT_LANGUAGE;
    const bankRows = await allocateBankQuestions(user, questionCount);
    const expiresAt = new Date(
      Date.now() + CONFIG.QUIZ.EXPIRY_MINUTES * 60 * 1000
    );

    const session = await QuizSessionModel.createWithQuestions({
      userId,
      language: lang,
      expiresAt,
      bankRows,
    });

    return toSessionPlayPayload(session);
  },

  async get({ userId, sessionId }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }

    if (
      session.status === 'in_progress' &&
      session.expiresAt &&
      session.expiresAt.getTime() < Date.now()
    ) {
      await QuizSessionModel.markExpired(session.id);
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session has expired.');
    }

    if (session.status === 'submitted') {
      return toSessionResult(session);
    }

    return toSessionPlayPayload(session);
  },

  async submit({ userId, sessionId, answers, timings, startedAt }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }

    if (session.status === 'submitted') {
      return toSessionResult(session);
    }

    if (session.status !== 'in_progress') {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session is not active.');
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      await QuizSessionModel.markExpired(session.id);
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session has expired.');
    }

    const startedMs = Number(startedAt) || session.startedAt.getTime();
    const completedMs = Date.now();
    if (startedMs > completedMs || completedMs - startedMs > 24 * 60 * 60 * 1000) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Invalid startedAt.');
    }

    const answerMap = answers || {};
    const timingMap = timings || {};

    const gradedRows = session.questions.map((q) => {
      const selected = normalizeOption(answerMap[q.bankQueId]);
      const isCorrect = Boolean(selected && selected === q.correctOption);
      const timeSpentMs = Math.max(0, Math.round(Number(timingMap[q.bankQueId]) || 0));
      return {
        id: q.id,
        userId,
        bankQueId: q.bankQueId,
        selectedOption: selected,
        isCorrect,
        timeSpentMs,
        points: q.points,
      };
    });

    const correctCount = gradedRows.filter((r) => r.isCorrect).length;
    const totalTimeMs = gradedRows.reduce((sum, r) => sum + r.timeSpentMs, 0);
    const maxPoints = gradedRows.reduce((sum, r) => sum + r.points, 0);
    const earnedPoints = gradedRows.reduce(
      (sum, r) => sum + (r.isCorrect ? r.points : 0),
      0
    );

    const updated = await QuizSessionModel.submit(sessionId, gradedRows, {
      correctCount,
      wrongCount: gradedRows.length - correctCount,
      totalTimeMs,
      wallClockMs: completedMs - startedMs,
      averageTimeMs:
        gradedRows.length > 0 ? Math.round(totalTimeMs / gradedRows.length) : 0,
      percentage: maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0,
    });

    return toSessionResult(updated);
  },

  async listMine({ userId, page, pageSize }) {
    return QuizSessionModel.listForUser(userId, { page, pageSize });
  },

  async stats(userId) {
    return QuizSessionModel.userStats(userId);
  },

  async getResult({ userId, sessionId }) {
    const session = await QuizSessionModel.findById(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Session not found.');
    }
    if (session.status !== 'submitted') {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Session is not submitted yet.');
    }
    return toSessionResult(session);
  },
};
