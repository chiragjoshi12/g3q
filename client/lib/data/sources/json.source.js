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
  return role === ROLE.COLLEGE ? "abcId" : "udiseCode";
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

function findCitizenByPhone(phone) {
  const normalized = digits(phone);
  if (!normalized) return null;
  return poolFor(ROLE.CITIZEN).find((user) => digits(user.phone) === normalized) || null;
}

function hasCitizenProfile(user) {
  return Boolean(
    user &&
      String(user.name || "").trim() &&
      String(user.district || "").trim() &&
      String(user.taluka || "").trim()
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const jsonSource = {
  name: "json",

  /** Resolves the code to a user so the UI can show a name before asking for a phone. */
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

  /** OTP goes to the phone number the user just entered, not the one on file. */
  async requestOtp({ role, credential, phone }) {
    await delay();
    if (role === ROLE.CITIZEN) {
      const trimmedPhone = String(phone || credential || "").trim();
      const existing = findCitizenByPhone(trimmedPhone);
      const id = ++otpSeq;
      otpRequests.set(id, {
        role,
        phone: trimmedPhone,
        userId: existing?.id ?? null,
        verified: false,
      });
      return {
        id,
        maskedPhone: trimmedPhone.replace(/\d(?=\d{4})/g, "•"),
        resendSeconds: appConfig.auth.resendSeconds,
      };
    }

    const user = findUser(role, credential);
    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    const id = ++otpSeq;
    otpRequests.set(id, { userId: user.id, role, phone });
    return {
      id,
      maskedPhone: String(phone).replace(/\d(?=\d{4})/g, "•"),
      resendSeconds: appConfig.auth.resendSeconds,
    };
  },

  async verifyOtp({ id, otp, role, credential }) {
    await delay();
    if (String(otp) !== appConfig.auth.staticOtp) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]
      );
    }

    const pending = otpRequests.get(Number(id));

    if (role === ROLE.CITIZEN || pending?.role === ROLE.CITIZEN || !credential) {
      const phone = pending?.phone || credential;
      const user =
        (pending?.userId
          ? [...(usersJson.students || []), ...(usersJson.colleges || []), ...poolFor(ROLE.CITIZEN)].find(
              (item) => item.id === pending.userId
            )
          : null) ||
        findCitizenByPhone(phone) ||
        [...(usersJson.students || []), ...(usersJson.colleges || [])].find(
          (item) => digits(item.phone) === digits(phone)
        );

      if (user && (user.role !== ROLE.CITIZEN || hasCitizenProfile(user))) {
        otpRequests.delete(Number(id));
        return {
          user: clone(user),
          token: `static.${user.id}.token`,
          existing: true,
          needsProfile: false,
          needsSignup: false,
        };
      }

      otpRequests.set(Number(id), {
        role: ROLE.CITIZEN,
        phone,
        userId: user?.id ?? pending?.userId ?? null,
        verified: true,
      });
      return {
        needsSignup: true,
        needsProfile: Boolean(user && user.role === ROLE.CITIZEN && !hasCitizenProfile(user)),
        id: Number(id),
        phone,
      };
    }

    const user = pending
      ? poolFor(pending.role).find((item) => item.id === pending.userId)
      : findUser(role, credential);

    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    otpRequests.delete(Number(id));
    return { user: clone(user), token: `static.${user.id}.token` };
  },

  async registerCitizen({ id, name, district, taluka, districtId, talukaId }) {
    await delay();
    const pending = otpRequests.get(Number(id));
    if (!pending?.verified || pending.role !== ROLE.CITIZEN) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]
      );
    }

    const existing = pending.userId
      ? poolFor(ROLE.CITIZEN).find((item) => item.id === pending.userId)
      : findCitizenByPhone(pending.phone);

    let user = existing;
    if (user) {
      user.name = name;
      user.district = district;
      user.taluka = taluka;
      user.districtId = districtId ?? null;
      user.talukaId = talukaId ?? null;
      user.institute = "નાગરિક સહભાગી";
      user.phone = digits(pending.phone);
    } else {
      user = {
        id: `cit_${Date.now()}`,
        role: ROLE.CITIZEN,
        name,
        district,
        taluka,
        districtId: districtId ?? null,
        talukaId: talukaId ?? null,
        phone: digits(pending.phone),
        institute: "નાગરિક સહભાગી",
        grade: "",
      };
      extraCitizens.push(user);
    }

    otpRequests.delete(Number(id));
    return { user: clone(user), token: `static.${user.id}.token` };
  },

  async linkRoster({ id, role, credential }) {
    await delay();
    const pending = otpRequests.get(Number(id));
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
    user.phone = digits(pending.phone);
    otpRequests.delete(Number(id));
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
