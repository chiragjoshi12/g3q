import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { getDataSource } from "@/lib/data/sources";
import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

/**
 * Completed quiz attempts.
 *
 * Backed by LocalStorage for the MVP. When attempts move server-side, only the
 * bodies here change — callers already treat every method as async.
 */

const MAX_ATTEMPTS = 50;
const SESSION_TITLE = "G3Q Quiz";

function readAll() {
  const attempts = storage.get(STORAGE_KEYS.attempts, []);
  return Array.isArray(attempts) ? attempts : [];
}

function mapSessionSummaryToAttempt(raw) {
  if (!raw) return null;
  const attemptedCount =
    Number(raw.correctCount ?? 0) + Number(raw.wrongCount ?? 0);
  return {
    attemptId: raw.sessionId,
    quizId: raw.sessionId,
    quizTitle: raw.quizTitle || SESSION_TITLE,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
    totalQuestions: Number(raw.questionCount ?? 0),
    attemptedCount,
    abandoned:
      Number(raw.questionCount ?? 0) > 0 && attemptedCount < Number(raw.questionCount ?? 0),
    correctCount: Number(raw.correctCount ?? 0),
    wrongCount: Number(raw.wrongCount ?? 0),
    earnedPoints: Number(raw.correctCount ?? 0),
    maxPoints: Number(raw.questionCount ?? 0),
    percentage: Number(raw.percentage ?? 0),
    totalTimeMs: Number(raw.totalTimeMs ?? 0),
    wallClockMs: Number(raw.wallClockMs ?? 0),
    averageTimeMs: Number(raw.averageTimeMs ?? 0),
    breakdown: raw.breakdown ?? [],
    week: raw.week ?? null,
    status: raw.status ?? null,
  };
}

async function listRemote() {
  const payload = await getDataSource().listMySessions();
  return (payload?.items ?? []).map(mapSessionSummaryToAttempt).filter(Boolean);
}

export const attemptRepository = {
  async list(userId) {
    if (appConfig.dataSource === DATA_SOURCE.REST) {
      return listRemote();
    }
    const all = readAll();
    return userId ? all.filter((a) => a.userId === userId) : all;
  },

  async getById(attemptId) {
    if (appConfig.dataSource === DATA_SOURCE.REST) {
      const payload = await getDataSource().getSessionResult(attemptId);
      return mapSessionSummaryToAttempt(payload);
    }
    return readAll().find((a) => a.attemptId === attemptId) ?? null;
  },

  async save(attempt) {
    const next = [attempt, ...readAll().filter((a) => a.attemptId !== attempt.attemptId)];
    storage.set(STORAGE_KEYS.attempts, next.slice(0, MAX_ATTEMPTS));
    return attempt;
  },

  async clear(userId) {
    if (appConfig.dataSource === DATA_SOURCE.REST) {
      return getDataSource().clearMyAttempts();
    }
    if (!userId) {
      storage.set(STORAGE_KEYS.attempts, []);
      return;
    }
    storage.set(
      STORAGE_KEYS.attempts,
      readAll().filter((a) => a.userId !== userId)
    );
  },

  /** Aggregates used by the profile screen. */
  async stats(userId) {
    if (appConfig.dataSource === DATA_SOURCE.REST) {
      return getDataSource().getMySessionStats();
    }
    const attempts = await this.list(userId);
    if (attempts.length === 0) {
      return { attempts: 0, bestPercentage: 0, averagePercentage: 0, totalTimeMs: 0 };
    }
    const total = attempts.reduce((sum, a) => sum + a.percentage, 0);
    return {
      attempts: attempts.length,
      bestPercentage: Math.max(...attempts.map((a) => a.percentage)),
      averagePercentage: Math.round(total / attempts.length),
      totalTimeMs: attempts.reduce((sum, a) => sum + a.totalTimeMs, 0),
    };
  },
};
