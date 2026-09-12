/** Shared Express origin for Next rewrites / API defaults. */
export const AZURE_BACKEND_ORIGIN = "https://g3q-backend-staging.azurewebsites.net";
export const LOCAL_BACKEND_ORIGIN = "http://localhost:4000";

/**
 * Resolve the Express host (no `/api` suffix).
 * Prefers `BACKEND_ORIGIN`, else Azure staging in production builds and
 * localhost in local/dev. Override for a future production App Service via env.
 */
export function resolveBackendOrigin() {
  const fromEnv = (process.env.BACKEND_ORIGIN || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === "production"
    ? AZURE_BACKEND_ORIGIN
    : LOCAL_BACKEND_ORIGIN;
}

/** Full `/api` base URL when calling the backend directly (not via rewrite). */
export function resolveApiBaseUrl() {
  const fromEnv = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Same-origin `/api` → Next rewrite proxies to local or Azure Express.
  return "/api";
}
