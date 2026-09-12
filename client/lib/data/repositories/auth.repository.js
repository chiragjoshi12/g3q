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

  async verifyOtp({ id, otp, role, credential }) {
    const result = await getDataSource().verifyOtp({
      id,
      otp,
      role,
      credential,
    });
    if (result?.needsSignup || result?.needsProfile) {
      return {
        needsSignup: Boolean(result.needsSignup || result.needsProfile),
        needsProfile: Boolean(result.needsProfile),
        id: result.id ?? id,
        phone: result.phone || null,
      };
    }
    return {
      user: toUser(result.user),
      token: result.token,
      existing: Boolean(result.existing),
      needsSignup: false,
      needsProfile: false,
    };
  },

  async registerCitizen({ id, name, district, taluka, districtId, talukaId }) {
    const { user, token } = await getDataSource().registerCitizen({
      id,
      name,
      district,
      taluka,
      districtId,
      talukaId,
    });
    return { user: toUser(user), token };
  },

  async linkRoster({ id, role, credential }) {
    const { user, token } = await getDataSource().linkRoster({
      id,
      role,
      credential,
    });
    return { user: toUser(user), token };
  },
};
