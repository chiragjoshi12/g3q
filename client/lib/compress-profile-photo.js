/** Max accepted source file size before compression (3 MB). */
export const MAX_PROFILE_PHOTO_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

/**
 * Compress / resize a profile image in the browser before upload.
 * Always returns a JPEG data URL sized for avatar use (~450 KB target).
 */
export async function compressProfilePhoto(
  file,
  {
    maxInputBytes = MAX_PROFILE_PHOTO_BYTES,
    maxEdge = 1024,
    maxBytes = 450 * 1024,
    mimeType = "image/jpeg",
  } = {}
) {
  if (!(file instanceof Blob)) {
    throw new Error("Invalid image file.");
  }

  const type = String(file.type || "").toLowerCase();
  // Some mobile pickers omit MIME; allow those and let createImageBitmap decide.
  if (type && !ALLOWED_TYPES.has(type)) {
    const err = new Error("PHOTO_TYPE");
    err.code = "PHOTO_TYPE";
    throw err;
  }

  if (file.size > maxInputBytes) {
    const err = new Error("PHOTO_TOO_LARGE");
    err.code = "PHOTO_TOO_LARGE";
    throw err;
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas unavailable.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL(mimeType, quality);
    let bytes = estimateDataUrlBytes(dataUrl);

    while (bytes > maxBytes && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.12);
      dataUrl = canvas.toDataURL(mimeType, quality);
      bytes = estimateDataUrlBytes(dataUrl);
    }

    if (bytes > maxBytes) {
      const shrink = Math.sqrt(maxBytes / bytes);
      const nextWidth = Math.max(1, Math.round(width * Math.min(1, shrink)));
      const nextHeight = Math.max(1, Math.round(height * Math.min(1, shrink)));
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, nextWidth, nextHeight);
      ctx.drawImage(bitmap, 0, 0, nextWidth, nextHeight);
      dataUrl = canvas.toDataURL(mimeType, 0.72);
      bytes = estimateDataUrlBytes(dataUrl);
    }

    if (bytes > MAX_PROFILE_PHOTO_BYTES) {
      const err = new Error("PHOTO_TOO_LARGE");
      err.code = "PHOTO_TOO_LARGE";
      throw err;
    }

    return {
      imageBase64: dataUrl,
      contentType: mimeType,
    };
  } finally {
    bitmap.close?.();
  }
}

function estimateDataUrlBytes(dataUrl) {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}
