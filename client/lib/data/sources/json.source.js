import { appConfig } from "@/config/app.config";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import { ROLE } from "@/lib/domain/roles";

import usersJson from "@/data/users.json";
import quizzesJson from "@/data/quizzes.json";
import questionsJson from "@/data/questions.json";
import explanationsJson from "@/data/explanations.json";

/**
 * Local JSON implementation of the DataSource contract.
 *
 * Every method is async and artificially delayed so callers are forced to deal
 * with pending/error states exactly as they will with a real API.
 */

const delay = (ms = appConfig.json.simulatedLatencyMs) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Deep clone so callers can never mutate the imported JSON modules. */
const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

const otpRequests = new Map();
let otpSeq = 0;
const extraCitizens = [];
const extraStudents = [];

function digits(value) {
  return String(value || "").replace(/\D/g, "").slice(-10);
}

function credentialFieldFor(role) {
  return role === ROLE.COLLEGE ? "apparId" : "ctsId";
}

function poolFor(role) {
  if (role === ROLE.COLLEGE) return usersJson.colleges;
  if (role === ROLE.CITIZEN) return [...(usersJson.citizens || []), ...extraCitizens];
  return [...(usersJson.students || []), ...extraStudents];
}

function findUser(role, credential) {
  const field = credentialFieldFor(role);
  const normalized = String(credential || "").trim();
  return poolFor(role).find((user) => user[field] === normalized) || null;
}

function findCitizenByMobile(mobile) {
  const normalized = digits(mobile);
  if (!normalized) return null;
  return poolFor(ROLE.CITIZEN).find((user) => digits(user.mobile) === normalized) || null;
}

function hasCitizenProfile(user) {
  return Boolean(
    user &&
      String(user.name || "").trim() &&
      String(user.surname || "").trim() &&
      (user.districtId != null || String(user.district || "").trim()) &&
      (user.talukaId != null || String(user.taluka || "").trim())
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const jsonSource = {
  name: "json",

  /** Resolves the code to a user so the UI can show a name before asking for a mobile. */
  async lookupIdentity({ role, credential }) {
    await delay();
    if (role === ROLE.CITIZEN) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, "અમાન્ય પ્રકાર.");
    }
    const user = findUser(role, credential);
    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    return clone(user);
  },

  /** Mobile-only OTP request (login vs signup inferred from stored users). */
  async requestOtp({ mobile }) {
    await delay();
    const trimmedMobile = String(mobile || "").trim();
    const existing =
      findCitizenByMobile(trimmedMobile) ||
      [...(usersJson.students || []), ...(usersJson.colleges || [])].find(
        (item) => digits(item.mobile) === digits(trimmedMobile)
      );
    const otp_token = (++otpSeq).toString(16).padStart(10, "0");
    otpRequests.set(otp_token, {
      role: existing?.role || ROLE.CITIZEN,
      mobile: trimmedMobile,
      userId: existing?.id ?? null,
      verified: false,
    });
    return {
      message: "OTP Sended successfully.",
      otp_token,
      maskedMobile: trimmedMobile.replace(/\d(?=\d{4})/g, "•"),
      resendSeconds: appConfig.auth.resendSeconds,
      case: existing ? "login" : "signup",
    };
  },

  async verifyOtp({ otp_token, otp }) {
    await delay();
    if (String(otp) !== appConfig.auth.staticOtp) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]
      );
    }

    const pending = otpRequests.get(String(otp_token || ""));
    if (!pending) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }

    const mobile = pending.mobile;
    const user =
      (pending.userId
        ? [...(usersJson.students || []), ...(usersJson.colleges || []), ...poolFor(ROLE.CITIZEN)].find(
            (item) => item.id === pending.userId
          )
        : null) ||
      findCitizenByMobile(mobile) ||
      [...(usersJson.students || []), ...(usersJson.colleges || [])].find(
        (item) => digits(item.mobile) === digits(mobile)
      );

    if (user && (user.role !== ROLE.CITIZEN || hasCitizenProfile(user))) {
      otpRequests.delete(String(otp_token));
      return {
        user: clone(user),
        token: `static.${user.id}.token`,
        existing: true,
        needsProfile: false,
        needsSignup: false,
      };
    }

    otpRequests.set(String(otp_token), {
      role: ROLE.CITIZEN,
      mobile,
      userId: user?.id ?? pending.userId ?? null,
      verified: true,
    });
    return {
      needsSignup: true,
      needsProfile: Boolean(user && user.role === ROLE.CITIZEN && !hasCitizenProfile(user)),
      otp_token: String(otp_token),
      mobile,
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
    await delay();
    if (consentAccepted !== true) {
      throw new AppError(ERROR_CODE.INVALID_CREDENTIAL, "Consent is required.");
    }
    const pending = otpRequests.get(String(otp_token || ""));
    if (!pending?.verified || pending.role !== ROLE.CITIZEN) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]
      );
    }

    const existing = pending.userId
      ? poolFor(ROLE.CITIZEN).find((item) => item.id === pending.userId)
      : findCitizenByMobile(pending.mobile);

    const first = String(name || "").trim();
    const last = String(surname || "").trim();
    let user = existing;
    if (user) {
      user.name = first;
      user.surname = last || null;
      user.districtId = districtId ?? null;
      user.talukaId = talukaId ?? null;
      user.institute = null;
      user.mobile = digits(pending.mobile);
      user.consentVersion = consentVersion;
    } else {
      user = {
        id: `cit_${Date.now()}`,
        role: ROLE.CITIZEN,
        name: first,
        surname: last || null,
        districtId: districtId ?? null,
        talukaId: talukaId ?? null,
        mobile: digits(pending.mobile),
        institute: null,
        grade: "",
        consentVersion,
      };
      extraCitizens.push(user);
    }

    otpRequests.delete(String(otp_token));
    return {
      user: clone({
        ...user,
        name: [first, last].filter(Boolean).join(" "),
      }),
      token: `static.${user.id}.token`,
    };
  },

  async linkRoster({ otp_token, role, credential }) {
    await delay();
    const pending = otpRequests.get(String(otp_token || ""));
    if (!pending?.verified) {
      throw new AppError(ERROR_CODE.INVALID_OTP, ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]);
    }
    const user = findUser(role, credential);
    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    user.mobile = digits(pending.mobile);
    otpRequests.delete(String(otp_token));
    return { user: clone(user), token: `static.${user.id}.token` };
  },

  async getMe() {
    await delay();
    throw new AppError(ERROR_CODE.UNAUTHORIZED, "Login required.");
  },

  async uploadProfilePhoto() {
    await delay();
    throw new AppError(ERROR_CODE.UNKNOWN, "Profile photo upload requires REST mode.");
  },

  async listQuizzes() {
    return clone(quizzesJson);
  },

  async getQuizById(quizId) {
    const quiz = quizzesJson.find((item) => item.id === quizId);
    if (!quiz) {
      throw new AppError(ERROR_CODE.NOT_FOUND, "ક્વિઝ મળી નથી.");
    }
    return clone(quiz);
  },

  async getPracticeBundle({ quizId } = {}) {
    await delay();
    const practiceQuizId = quizId || quizzesJson[0]?.id;
    const quiz = clone(quizzesJson.find((item) => item.id === practiceQuizId) || quizzesJson[0] || null);
    const questions = clone((questionsJson[practiceQuizId] || []).slice(0, 5));
    const explanations = {};
    questions.forEach((question) => {
      if (explanationsJson[question.id]) {
        explanations[question.id] = clone(explanationsJson[question.id]);
      }
    });
    return {
      quiz: quiz
        ? {
            ...quiz,
            id: quizId || quiz.id,
            totalQuestions: questions.length,
            totalPoints: questions.length,
          }
        : null,
      questions,
      explanations,
    };
  },

  async getQuestionsByQuizId(quizId) {
    const questions = questionsJson[quizId];
    if (!questions) {
      throw new AppError(ERROR_CODE.NOT_FOUND, "પ્રશ્નો મળ્યા નથી.");
    }
    return clone(questions);
  },

  async getExplanationsByQuizId(quizId) {
    const questions = questionsJson[quizId] || [];
    const map = {};
    questions.forEach((question) => {
      if (explanationsJson[question.id]) {
        map[question.id] = clone(explanationsJson[question.id]);
      }
    });
    return map;
  },
};
