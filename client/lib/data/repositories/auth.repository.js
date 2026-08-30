import { getDataSource } from "@/lib/data/sources";
import { toUser } from "@/lib/domain/models";

/**
 * Auth data access. Returns domain models, never raw source payloads.
 * Swapping appConfig.dataSource to "rest" changes nothing in this file.
 */
export const authRepository = {
  async lookupIdentity({ role, credential }) {
    const user = await getDataSource().lookupIdentity({ role, credential });
    return toUser(user);
  },

  async requestOtp({ role, credential, phone }) {
    return getDataSource().requestOtp({ role, credential, phone });
  },

  async verifyOtp({ requestId, otp, role, credential }) {
    const { user, token } = await getDataSource().verifyOtp({
      requestId,
      otp,
      role,
      credential,
    });
    return { user: toUser(user), token };
  },
};
