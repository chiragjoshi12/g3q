import { appConfig } from "@/config/app.config";
import { ROLE } from "@/lib/domain/roles";

export const CERTIFICATE_MIN_PERCENT = 60;

/** Native pixel size of `/certificate-bg.png`. */
export const CERT_NATIVE = { width: 6250, height: 4419 };

/**
 * Positions as fractions of the background. Measured against the official
 * G3Q certificate so overlays land on the empty fields.
 */
export const CERT_LAYOUT = {
  week: { x: 0.9708, y: 0.1892, fontSize: 0.0115, align: "left", baseline: "middle" },
  g3qId: { x: 0.978, y: 0.2215, fontSize: 0.0115, align: "right", baseline: "middle" },
  category: { x: 0.5, y: 0.466, fontSize: 18 / 1024, align: "center", baseline: "middle" },
  body: {
    x: 0.5,
    y: 0.516,
    maxWidth: 0.66,
    fontSize: 16 / 1024,
    lineHeight: 1.55,
    align: "center",
    baseline: "top",
  },
};

export function attemptEarnsCertificate(attempt) {
  return (attempt?.percentage ?? 0) >= CERTIFICATE_MIN_PERCENT;
}

export function formatG3qId(user = {}) {
  if (user.g3qId) return String(user.g3qId).toUpperCase();
  const digits = String(user.credential || user.id || "")
    .replace(/\D/g, "")
    .slice(-7)
    .padStart(7, "0");
  const prefix = user.role === ROLE.COLLEGE ? "GJC" : "GJS";
  return `${prefix}${digits}`;
}

export function certificateCategory(role) {
  const isCollege = role === ROLE.COLLEGE;
  return {
    title: isCollege ? "College/University Category" : "School Category",
    inline: isCollege ? "College/University category" : "School category",
  };
}

/**
 * Snapshot of everything the certificate needs. Prefers the live user, then
 * fields frozen onto the attempt at submit time.
 */
export function buildCertificatePayload(user, attempt, options = {}) {
  const role = user?.role || attempt?.userRole || ROLE.STUDENT;
  const category = certificateCategory(role);
  const name = user?.name || attempt?.userName || "";
  const institute = user?.institute || attempt?.institute || "";
  const credential = user?.credential || attempt?.credential || "";
  const week = Number(options.week ?? attempt?.week ?? user?.week ?? appConfig.certificate.week);

  return {
    week: Number.isFinite(week) && week > 0 ? week : 1,
    g3qId: formatG3qId({
      g3qId: user?.g3qId || attempt?.g3qId,
      id: user?.id || attempt?.userId,
      credential,
      role,
    }),
    categoryTitle: category.title,
    categoryInline: category.inline,
    name,
    school: institute,
  };
}

export function certificateFileName(payload) {
  const id = payload?.g3qId || "certificate";
  return `G3Q-certificate-${id}.png`;
}
