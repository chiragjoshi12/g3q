import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { getDataSource } from "@/lib/data/sources";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { toUser } from "@/lib/domain/models";

export const profileController = {
  async loadMe() {
    if (appConfig.dataSource !== DATA_SOURCE.REST) return null;
    const raw = await getDataSource().getMe();
    return toUser(raw);
  },

  async loadOverview(userId) {
    const [attempts, stats] = await Promise.all([
      attemptRepository.list(userId),
      attemptRepository.stats(userId),
    ]);
    return { attempts, stats };
  },

  async loadAttempts(userId) {
    return attemptRepository.list(userId);
  },

  async loadStats(userId) {
    return attemptRepository.stats(userId);
  },

  async clearHistory(userId) {
    await attemptRepository.clear(userId);
    return attemptRepository.stats(userId);
  },
};
