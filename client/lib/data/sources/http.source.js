import { appConfig } from "@/config/app.config";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

const inflightGetRequests = new Map();
const recentGetResponses = new Map();
const GET_RESPONSE_TTL_MS = 800;

function cacheTtlMsForPath(path) {
  if (path.startsWith("/landing/summary")) return 30_000;
  if (path.startsWith("/leaderboard")) return 15_000;
  if (path.startsWith("/users/me")) return 30_000;
  if (path === "/sessions") return 10_000;
  if (path === "/sessions/current") return 10_000;
  if (path.startsWith("/sessions/stats")) return 10_000;
  return GET_RESPONSE_TTL_MS;
}

/**
 * REST implementation of the same DataSource contract as jsonSource.
 *
 * Nothing imports this directly — `getDataSource()` selects it when
 * appConfig.dataSource is "rest". The endpoints below are the contract the
 * backend needs to satisfy; no other file in the app changes.
 */

function authHeaders() {
  const session = storage.get(STORAGE_KEYS.session, null);
  const token = session?.state?.token || session?.token || null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, signal } = {}) {
  const upperMethod = String(method || "GET").toUpperCase();
  const headers = {
    "Content-Type": "application/json",
    ...authHeaders(),
  };
  const requestKey =
    upperMethod === "GET"
      ? JSON.stringify({
          method: upperMethod,
          path,
          auth: headers.Authorization ?? null,
        })
      : null;
  const now = Date.now();

  if (requestKey) {
    const cached = recentGetResponses.get(requestKey);
    if (cached && now - cached.at < cached.ttlMs) {
      return cached.payload;
    }
    const inflight = inflightGetRequests.get(requestKey);
    if (inflight) {
      return inflight;
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), appConfig.api.timeoutMs);

  const runner = (async () => {
    try {
      const response = await fetch(`${appConfig.api.baseUrl}${path}`, {
        method: upperMethod,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: signal ?? controller.signal,
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new AppError(
          payload?.code || (response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.UNKNOWN),
          payload?.message || (typeof ERROR_MESSAGE[ERROR_CODE.UNKNOWN] === "function"
            ? ERROR_MESSAGE[ERROR_CODE.UNKNOWN]()
            : ERROR_MESSAGE[ERROR_CODE.UNKNOWN]),
          payload
        );
      }
      if (requestKey) {
        recentGetResponses.set(requestKey, {
          at: Date.now(),
          ttlMs: cacheTtlMsForPath(path),
          payload,
        });
      }
      return payload;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        ERROR_CODE.NETWORK,
        typeof ERROR_MESSAGE[ERROR_CODE.NETWORK] === "function"
          ? ERROR_MESSAGE[ERROR_CODE.NETWORK]()
          : ERROR_MESSAGE[ERROR_CODE.NETWORK],
        error
      );
    } finally {
      clearTimeout(timeout);
      if (requestKey) {
        inflightGetRequests.delete(requestKey);
      }
    }
  })();

  if (requestKey) {
    inflightGetRequests.set(requestKey, runner);
  }

  return runner;
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

  getLandingSummary: () => request("/landing/summary"),

  getMe: () => request("/users/me"),

  listQuizzes: () => request("/quizzes"),

  getQuizById: (quizId) => request(`/quizzes/${quizId}`),

  getPracticeBundle: ({ quizId, language } = {}) => {
    const params = new URLSearchParams();
    if (quizId) params.set("quiz_id", quizId);
    if (language) params.set("language", language);
    const qs = params.toString();
    return request(`/quizzes/practice/bundle${qs ? `?${qs}` : ""}`);
  },

  getQuestionsByQuizId: (quizId) => request(`/quizzes/${quizId}/questions`),

  getExplanationsByQuizId: (quizId) => request(`/quizzes/${quizId}/explanations`),

  startSession: ({ count, language } = {}) =>
    request("/sessions", {
      method: "POST",
      body: {
        ...(count ? { count } : {}),
        ...(language ? { language } : {}),
      },
    }),

  getSession: (sessionId) => request(`/sessions/${sessionId}`),

  submitSession: ({ sessionId, answers, timings, startedAt, abandoned }) =>
    request(`/sessions/${sessionId}/submit`, {
      method: "POST",
      body: { answers, timings, startedAt, abandoned },
    }),

  getSessionResult: (sessionId) => request(`/sessions/${sessionId}/result`),

  listMySessions: () => request("/sessions"),

  getMyCurrentSession: () => request("/sessions/current"),

  getMySessionStats: () => request("/sessions/stats"),

  clearMyAttempts: () => request("/users/me/attempts", { method: "DELETE" }),

  getLeaderboardOverview: ({ limit, talukaId, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard${qs ? `?${qs}` : ""}`);
  },

  getSchoolLeaderboard: ({ limit, schoolId, institute, talukaId, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (schoolId) params.set("school_id", schoolId);
    if (institute) params.set("institute", institute);
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/school${qs ? `?${qs}` : ""}`);
  },

  getCollegeLeaderboard: ({ limit, talukaId, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/college${qs ? `?${qs}` : ""}`);
  },

  getCitizenLeaderboard: ({ limit, talukaId, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/citizen${qs ? `?${qs}` : ""}`);
  },

  getTalukaLeaderboard: ({ limit, talukaId, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/taluka${qs ? `?${qs}` : ""}`);
  },
};
