import { appConfig } from "@/config/app.config";

/**
 * Namespaced, versioned, SSR-safe wrapper around localStorage.
 *
 * Everything the app persists goes through here, so migrating to a different
 * backend (IndexedDB, a server session, encrypted storage) is a one-file change.
 */

const { namespace, version } = appConfig.storage;

export const STORAGE_KEYS = {
  session: "session",
  profile: "profile",
  quizProgress: "quiz-progress",
  attempts: "attempts",
};

const prefix = `${namespace}:v${version}:`;

/** Used on the server and when localStorage is unavailable (private mode, quota). */
const memory = new Map();

function backend() {
  if (typeof window === "undefined") return null;
  try {
    const probe = `${prefix}__probe`;
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

function readRaw(key) {
  const store = backend();
  if (!store) return memory.get(key) ?? null;
  return store.getItem(key);
}

function writeRaw(key, value) {
  const store = backend();
  if (!store) {
    memory.set(key, value);
    return;
  }
  try {
    store.setItem(key, value);
  } catch {
    memory.set(key, value);
  }
}

function removeRaw(key) {
  const store = backend();
  memory.delete(key);
  if (store) store.removeItem(key);
}

export const storage = {
  /** Read and parse a namespaced value, falling back when absent or corrupt. */
  get(key, fallback = null) {
    const raw = readRaw(prefix + key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    writeRaw(prefix + key, JSON.stringify(value));
    return value;
  },

  remove(key) {
    removeRaw(prefix + key);
  },

  /** Wipes only this app's namespace — never touches other keys on the origin. */
  clear() {
    const store = backend();
    memory.clear();
    if (!store) return;
    const doomed = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) doomed.push(key);
    }
    doomed.forEach((key) => store.removeItem(key));
  },
};

/**
 * Adapter matching Zustand's StateStorage contract, so persisted stores share
 * the same namespacing and fallback behaviour as direct storage reads.
 */
export const zustandStorage = {
  getItem: (name) => readRaw(prefix + name),
  setItem: (name, value) => writeRaw(prefix + name, value),
  removeItem: (name) => removeRaw(prefix + name),
};
