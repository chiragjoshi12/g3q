import { appConfig } from "@/config/app.config";
import { AppError, ERROR_CODE, ERROR_MESSAGE } from "@/lib/core/errors";
import { storage, STORAGE_KEYS } from "@/lib/storage/storage";

const inflightGetRequests = new Map();
const recentGetResponses = new Map();
const GET_RESPONSE_TTL_MS = 800;

function cacheTtlMsForPath(path) {
  if (path.startsWith("/landing/summary")) return 30_000;
  if (path.startsWith("/leaderboard")) return 15_000;
  if (path.startsWith("/users/me")) return 5 * 60_000;
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

function unwrapApiPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  if (payload.success === false) {
    throw new AppError(
      payload.code || ERROR_CODE.UNKNOWN,
      payload.message ||
        (typeof ERROR_MESSAGE[ERROR_CODE.UNKNOWN] === "function"
          ? ERROR_MESSAGE[ERROR_CODE.UNKNOWN]()
          : ERROR_MESSAGE[ERROR_CODE.UNKNOWN]),
      payload
    );
  }

  if (payload.success !== true) {
    return payload;
  }

  const { success: _success, message: _message, code: _code, ...rest } = payload;
  if (Object.prototype.hasOwnProperty.call(rest, "data") && Object.keys(rest).length === 1) {
    return rest.data;
  }
  return rest;
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

      if (!response.ok || payload?.success === false) {
        throw new AppError(
          payload?.code || (response.status === 404 ? ERROR_CODE.NOT_FOUND : ERROR_CODE.UNKNOWN),
          payload?.message ||
            (typeof ERROR_MESSAGE[ERROR_CODE.UNKNOWN] === "function"
              ? ERROR_MESSAGE[ERROR_CODE.UNKNOWN]()
              : ERROR_MESSAGE[ERROR_CODE.UNKNOWN]),
          payload
        );
      }

      const normalized = unwrapApiPayload(payload);
      if (requestKey) {
        recentGetResponses.set(requestKey, {
          at: Date.now(),
          ttlMs: cacheTtlMsForPath(path),
          payload: normalized,
        });
      }
      return normalized;
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

export function clearHttpGetCache(pathPrefix = "") {
  const prefix = String(pathPrefix || "");
  for (const key of [...recentGetResponses.keys()]) {
    try {
      const parsed = JSON.parse(key);
      if (!prefix || String(parsed.path || "").startsWith(prefix)) {
        recentGetResponses.delete(key);
      }
    } catch {
      recentGetResponses.delete(key);
    }
  }
  for (const key of [...inflightGetRequests.keys()]) {
    try {
      const parsed = JSON.parse(key);
      if (!prefix || String(parsed.path || "").startsWith(prefix)) {
        inflightGetRequests.delete(key);
      }
    } catch {
      inflightGetRequests.delete(key);
    }
  }
}

export const httpSource = {
  name: "rest",

  lookupIdentity: ({ role, credential }) =>
    request("/auth/identity/lookup", { method: "POST", body: { role, credential } }),

  requestOtp: ({ role, credential, phone }) =>
    request("/auth/otp/request", { method: "POST", body: { role, credential, phone } }),

  verifyOtp: ({ id, otp, role, credential }) =>
    request("/auth/otp/verify", {
      method: "POST",
      body: { id, otp, role, credential },
    }),

  registerCitizen: ({ id, name, district, taluka, districtId, talukaId }) =>
    request("/auth/citizen/register", {
      method: "POST",
      body: { id, name, district, taluka, districtId, talukaId },
    }),

  linkRoster: ({ id, role, credential }) =>
    request("/auth/roster/link", {
      method: "POST",
      body: { id, role, credential },
    }),

  betaLogin: ({ firstName, lastName, district, taluka, districtId, talukaId, phone }) =>
    request("/auth/beta/login", {
      method: "POST",
      body: { firstName, lastName, district, taluka, districtId, talukaId, phone },
    }),

  getGeographyDistricts: ({ lang } = {}) => {
    const params = new URLSearchParams();
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/geography/districts${qs ? `?${qs}` : ""}`);
  },

  getLandingSummary: () => request("/landing/summary"),

  getGeographyDistricts: ({ lang } = {}) => {
    const params = new URLSearchParams();
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/geography/districts${qs ? `?${qs}` : ""}`);
  },

  getMe: () => request("/users/me"),

  uploadProfilePhoto: ({ imageBase64, contentType }) =>
    request("/users/me/photo", {
      method: "POST",
      body: { imageBase64, contentType },
    }),

  listQuizzes: async () => {
    throw new AppError(ERROR_CODE.NOT_FOUND, "Fixed quizzes are no longer available.");
  },

  getQuizById: async () => {
    throw new AppError(ERROR_CODE.NOT_FOUND, "Fixed quizzes are no longer available.");
  },

  getPracticeBundle: ({ quizId, language } = {}) => {
    const params = new URLSearchParams();
    if (quizId) params.set("quiz_id", quizId);
    if (language) params.set("language", language);
    const qs = params.toString();
    return request(`/quizzes/practice/bundle${qs ? `?${qs}` : ""}`);
  },

  getQuestionsByQuizId: async () => {
    throw new AppError(ERROR_CODE.NOT_FOUND, "Fixed quiz questions are no longer available.");
  },

  getExplanationsByQuizId: async () => {
    throw new AppError(ERROR_CODE.NOT_FOUND, "Fixed quiz explanations are no longer available.");
  },

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

  clearMySessions: () => request("/sessions", { method: "DELETE" }),

  getLeaderboardOverview: ({ limit, talukaId, week, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (week != null && week !== "") params.set("week", String(week));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard${qs ? `?${qs}` : ""}`);
  },

  getSchoolLeaderboard: ({ limit, schoolId, institute, talukaId, week, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (schoolId) params.set("school_id", schoolId);
    if (institute) params.set("institute", institute);
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (week != null && week !== "") params.set("week", String(week));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/school${qs ? `?${qs}` : ""}`);
  },

  getCollegeLeaderboard: ({ limit, talukaId, week, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (week != null && week !== "") params.set("week", String(week));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/college${qs ? `?${qs}` : ""}`);
  },

  getCitizenLeaderboard: ({ limit, talukaId, week, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (week != null && week !== "") params.set("week", String(week));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/citizen${qs ? `?${qs}` : ""}`);
  },

  getTalukaLeaderboard: ({ limit, talukaId, week, lang } = {}) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    if (talukaId != null && talukaId !== "") params.set("taluka", String(talukaId));
    if (week != null && week !== "") params.set("week", String(week));
    if (lang) params.set("lang", lang);
    const qs = params.toString();
    return request(`/leaderboard/taluka${qs ? `?${qs}` : ""}`);
  },
};
