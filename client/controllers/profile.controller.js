import { appConfig, DATA_SOURCE } from "@/config/app.config";
import { getDataSource } from "@/lib/data/sources";
import { clearHttpGetCache } from "@/lib/data/sources/http.source";
import { attemptRepository } from "@/lib/data/repositories/attempt.repository";
import { toUser } from "@/lib/domain/models";
import { rememberProfilePhoto } from "@/lib/profile-photo";

export const profileController = {
  async loadMe() {
    if (appConfig.dataSource !== DATA_SOURCE.REST) return null;
    const raw = await getDataSource().getMe();
    const user = toUser(raw);
    if (user?.id && user.profilePhoto) {
      rememberProfilePhoto(user.id, user.profilePhoto);
    }
    return user;
  },

  async uploadPhoto({ imageBase64, contentType }) {
    const source = getDataSource();
    if (typeof source.uploadProfilePhoto !== "function") {
      throw new Error("Profile photo upload is not available.");
    }
    const raw = await source.uploadProfilePhoto({ imageBase64, contentType });
    clearHttpGetCache("/users/me");
    const user = toUser(raw);
    if (user?.id && user.profilePhoto) {
      rememberProfilePhoto(user.id, user.profilePhoto);
    }
    return user;
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
