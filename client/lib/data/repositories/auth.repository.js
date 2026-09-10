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
    const result = await getDataSource().verifyOtp({
      requestId,
      otp,
      role,
      credential,
    });
    if (result?.needsProfile) {
      return { needsProfile: true };
    }
    return { user: toUser(result.user), token: result.token, needsProfile: false };
  },

  async registerCitizen({ requestId, name, district, taluka, districtId, talukaId }) {
    const { user, token } = await getDataSource().registerCitizen({
      requestId,
      name,
      district,
      taluka,
      districtId,
      talukaId,
    });
    return { user: toUser(user), token };
  },

  async betaLogin({ firstName, lastName, district, taluka, districtId, talukaId, phone }) {
    const { user, token } = await getDataSource().betaLogin({
      firstName,
      lastName,
      district,
      taluka,
      districtId,
      talukaId,
      phone,
    });
    return { user: toUser(user), token };
  },
};
