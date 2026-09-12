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

  async requestOtp({ mobile }) {
    return getDataSource().requestOtp({ mobile });
  },

  async verifyOtp({ otp_token, otp }) {
    const result = await getDataSource().verifyOtp({
      otp_token,
      otp,
    });
    if (result?.needsSignup || result?.needsProfile) {
      return {
        needsSignup: Boolean(result.needsSignup || result.needsProfile),
        needsProfile: Boolean(result.needsProfile),
        otp_token: result.otp_token ?? otp_token,
        mobile: result.mobile || null,
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

  async registerCitizen({
    otp_token,
    name,
    surname,
    districtId,
    talukaId,
    consentAccepted,
    consentVersion,
  }) {
    const { user, token } = await getDataSource().registerCitizen({
      otp_token,
      name,
      surname,
      districtId,
      talukaId,
      consentAccepted,
      consentVersion,
    });
    return { user: toUser(user), token };
  },

  async linkRoster({ otp_token, role, credential }) {
    const { user, token } = await getDataSource().linkRoster({
      otp_token,
      role,
      credential,
    });
    return { user: toUser(user), token };
  },
};
