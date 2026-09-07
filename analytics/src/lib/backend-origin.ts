const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:4000";

export function getBackendOrigin() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_BACKEND_ORIGIN ||
    DEFAULT_BACKEND_ORIGIN
  ).replace(/\/$/, "");
}
