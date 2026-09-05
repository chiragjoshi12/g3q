import { appConfig } from "@/config/app.config";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";

/**
 * REST implementation of the same DataSource contract as jsonSource.
 *
 * Nothing imports this directly — `getDataSource()` selects it when
 * appConfig.dataSource is "rest". The endpoints below are the contract the
 * backend needs to satisfy; no other file in the app changes.
 */

async function request(path, { method = "GET", body, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.api.timeoutMs);

  try {
    const response = await fetch(`${appConfig.api.baseUrl}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: signal ?? controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new AppError(
        payload?.code || (response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.UNKNOWN),
        payload?.message || ERROR_MESSAGE[ERROR_CODE.UNKNOWN],
        payload
      );
    }
    return payload;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(ERROR_CODE.NETWORK, ERROR_MESSAGE[ERROR_CODE.NETWORK], error);
  } finally {
    clearTimeout(timeout);
  }
}

export const httpSource = {
  name: "rest",

  lookupIdentity: ({ role, credential }) =>
    request("/auth/identity/lookup", { method: "POST", body: { role, credential } }),

  requestOtp: ({ role, credential, phone }) =>
    request("/auth/otp/request", { method: "POST", body: { role, credential, phone } }),

  verifyOtp: ({ requestId, otp, role, credential }) =>
    request("/auth/otp/verify", {
      method: "POST",
      body: { requestId, otp, role, credential },
    }),

  registerCitizen: ({ requestId, name, district, taluka }) =>
    request("/auth/citizen/register", {
      method: "POST",
      body: { requestId, name, district, taluka },
    }),

  listQuizzes: () => request("/quizzes"),

  getQuizById: (quizId) => request(`/quizzes/${quizId}`),

  getQuestionsByQuizId: (quizId) => request(`/quizzes/${quizId}/questions`),

  getExplanationsByQuizId: (quizId) => request(`/quizzes/${quizId}/explanations`),
};
