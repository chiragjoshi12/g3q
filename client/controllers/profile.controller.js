import { attemptRepository } from "@/lib/data/repositories/attempt.repository";

export const profileController = {
  async loadOverview(userId) {
    const [attempts, stats] = await Promise.all([
      attemptRepository.list(userId),
      attemptRepository.stats(userId),
    ]);
    return { attempts, stats };
  },

  async clearHistory(userId) {
    await attemptRepository.clear(userId);
    return attemptRepository.stats(userId);
  },
};
