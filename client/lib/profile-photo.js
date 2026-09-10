/** In-memory profile photo URLs so each user image is resolved once per session. */
const photoByUserId = new Map();

/** Returns uploaded photo URL, or `null` when the user has no custom photo. */
export function resolveProfilePhotoSrc(user) {
  const userId = user?.id;
  const remote = String(user?.profilePhoto || "").trim();
  if (userId && remote) {
    const cached = photoByUserId.get(userId);
    if (cached === remote) return cached;
    photoByUserId.set(userId, remote);
    return remote;
  }
  if (userId) photoByUserId.delete(userId);
  return null;
}

export function rememberProfilePhoto(userId, url) {
  const id = String(userId || "").trim();
  const photo = String(url || "").trim();
  if (!id || !photo) return;
  photoByUserId.set(id, photo);
}
