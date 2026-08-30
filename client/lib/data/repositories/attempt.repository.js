import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

/**
 * Completed quiz attempts.
 *
 * Backed by LocalStorage for the MVP. When attempts move server-side, only the
 * bodies here change — callers already treat every method as async.
 */

const MAX_ATTEMPTS = 50;

function readAll() {
  const attempts = storage.get(STORAGE_KEYS.attempts, []);
  return Array.isArray(attempts) ? attempts : [];
}

export const attemptRepository = {
  async list(userId) {
    const all = readAll();
    return userId ? all.filter((a) => a.userId === userId) : all;
  },

  async getById(attemptId) {
    return readAll().find((a) => a.attemptId === attemptId) ?? null;
  },

  async save(attempt) {
    const next = [attempt, ...readAll().filter((a) => a.attemptId !== attempt.attemptId)];
    storage.set(STORAGE_KEYS.attempts, next.slice(0, MAX_ATTEMPTS));
    return attempt;
  },

  async clear(userId) {
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
