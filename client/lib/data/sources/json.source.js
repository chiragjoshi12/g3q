import { appConfig } from "@/config/app.config";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";

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

function credentialFieldFor(role) {
  return role === "college" ? "abcId" : "udiseCode";
}

function poolFor(role) {
  return role === "college" ? usersJson.colleges : usersJson.students;
}

function findUser(role, credential) {
  const field = credentialFieldFor(role);
  const normalized = String(credential || "").trim();
  return poolFor(role).find((user) => user[field] === normalized) || null;
}

export const jsonSource = {
  name: "json",

  /** Resolves the code to a user so the UI can show a name before asking for a phone. */
  async lookupIdentity({ role, credential }) {
    await delay();
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
    const user = findUser(role, credential);
    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    const requestId = `otp_${user.id}_${Date.now()}`;
    otpRequests.set(requestId, { userId: user.id, role, phone });
    return {
      requestId,
      maskedPhone: String(phone).replace(/\d(?=\d{4})/g, "•"),
      resendSeconds: appConfig.auth.resendSeconds,
    };
  },

  async verifyOtp({ requestId, otp, role, credential }) {
    await delay();
    if (String(otp) !== appConfig.auth.staticOtp) {
      throw new AppError(
        ERROR_CODE.INVALID_OTP,
        ERROR_MESSAGE[ERROR_CODE.INVALID_OTP]
      );
    }
    // Fall back to the credential when the in-memory request map was lost
    // (e.g. a full page reload between the two steps).
    const pending = otpRequests.get(requestId);
    const user = pending
      ? poolFor(pending.role).find((u) => u.id === pending.userId)
      : findUser(role, credential);

    if (!user) {
      throw new AppError(
        ERROR_CODE.INVALID_CREDENTIAL,
        ERROR_MESSAGE[ERROR_CODE.INVALID_CREDENTIAL]
      );
    }
    otpRequests.delete(requestId);
    return { user: clone(user), token: `static.${user.id}.token` };
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
