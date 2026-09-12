/** In-memory + session profile photo URLs so each image is reused across navigations. */
const photoByUserId = new Map();
const SESSION_KEY = "g3q.profilePhotoByUser";

function readSessionMap() {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSessionMap(map) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(map));
  } catch {
    // Quota / private mode — in-memory cache still works.
  }
}

function persist(userId, url) {
  const id = String(userId || "").trim();
  const photo = String(url || "").trim();
  if (!id || !photo) return;
  photoByUserId.set(id, photo);
  const map = readSessionMap();
  map[id] = photo;
  writeSessionMap(map);
}

/** Returns uploaded photo URL, or `null` when the user has no custom photo. */
export function resolveProfilePhotoSrc(user) {
  const userId = user?.id;
  const remote = String(user?.profilePhoto || "").trim();
  if (userId && remote) {
    const mem = photoByUserId.get(userId);
    if (mem === remote) return mem;

    const session = readSessionMap()[userId];
    if (session === remote) {
      photoByUserId.set(userId, remote);
      return remote;
    }

    persist(userId, remote);
    return remote;
  }
  if (userId) {
    photoByUserId.delete(userId);
    const map = readSessionMap();
    if (map[userId]) {
      delete map[userId];
      writeSessionMap(map);
    }
  }
  return null;
}

export function rememberProfilePhoto(userId, url) {
  persist(userId, url);
}
