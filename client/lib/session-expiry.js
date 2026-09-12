const SESSION_EXPIRED_EVENT = "g3q:session-expired";

let dispatching = false;

/** Fired from the HTTP layer when an authenticated request returns 401. */
export function expireSession() {
  if (typeof window === "undefined") return;
  if (dispatching) return;
  dispatching = true;
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  queueMicrotask(() => {
    dispatching = false;
  });
}

export function onSessionExpired(handler) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(SESSION_EXPIRED_EVENT, handler);
  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
}
