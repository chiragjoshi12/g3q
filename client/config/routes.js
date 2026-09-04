export const ROUTES = {
  root: "/",
  auth: "/auth",
  abhiyan: "/abhiyan",
  leaderboard: "/leaderboard",
  g3qAi: "/g3q-ai",
  home: "/home",
  profile: "/profile",
  quiz: (quizId, { practice = false } = {}) =>
    practice ? `/quiz/${quizId}?practice=1` : `/quiz/${quizId}`,
  result: (attemptId, { practice = false } = {}) =>
    practice ? `/result/${attemptId}?practice=1` : `/result/${attemptId}`,
};

/** Featured quiz launched from the landing Practice Quiz action. */
export const FEATURED_QUIZ_ID = "quiz_gujarat_gk";

const POST_AUTH_KEY = "ggq:post-auth";

export function setPostAuthPath(path) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(POST_AUTH_KEY, path);
}

export function consumePostAuthPath() {
  if (typeof window === "undefined") return ROUTES.home;
  const next = sessionStorage.getItem(POST_AUTH_KEY);
  sessionStorage.removeItem(POST_AUTH_KEY);
  return next || ROUTES.home;
}

/** Routes that require an authenticated session. */
export const PROTECTED_PREFIXES = ["/home", "/profile", "/quiz", "/result"];

export function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
