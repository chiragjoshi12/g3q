import { CREDENTIAL, ROLE } from "@/lib/domain/roles";

/**
 * Mappers from raw data-source payloads to the domain shapes the app uses.
 *
 * This is the insulation layer: if a future API returns snake_case, nests
 * differently, or renames fields, only these functions change — stores,
 * controllers and components keep working untouched.
 */

export function toUser(raw) {
  if (!raw) return null;
  const role = Object.values(ROLE).includes(raw.role) ? raw.role : ROLE.STUDENT;
  const phoneDigits = String(raw.phone ?? "").replace(/\D/g, "").slice(-10);
  const credential = raw.udiseCode ?? raw.abcId ?? phoneDigits;
  const institute =
    raw.institute || (role === ROLE.CITIZEN ? "નાગરિક સહભાગી" : "") || "";
  return {
    id: raw.id,
    role,
    name: raw.name,
    institute,
    grade:
      raw.grade ||
      (role === ROLE.CITIZEN
        ? [raw.district, raw.taluka].filter(Boolean).join(" · ")
        : "") ||
      "",
    district: raw.district ?? "",
    taluka: raw.taluka ?? "",
    phone: raw.phone ?? "",
    joinedOn: raw.joinedOn ?? null,
    credential,
    credentialLabel: CREDENTIAL[role]?.label ?? "",
  };
}

export function toQuiz(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle ?? "",
    description: raw.description ?? "",
    banner: raw.banner ?? null,
    category: raw.category ?? "",
    level: raw.level ?? "",
    totalQuestions: Number(raw.totalQuestions ?? 0),
    durationMinutes: Number(raw.durationMinutes ?? 0),
    totalPoints: Number(raw.totalPoints ?? raw.totalQuestions ?? 0),
    featured: Boolean(raw.featured),
    tags: raw.tags ?? [],
    week: raw.week != null ? Number(raw.week) : null,
  };
}

export function toQuestion(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    order: Number(raw.order ?? 0),
    type: raw.type,
    points: Number(raw.points ?? 1),
    prompt: raw.prompt,
    placeholder: raw.placeholder ?? "",
    options: raw.options ?? null,
    left: raw.left ?? null,
    right: raw.right ?? null,
    items: raw.items ?? null,
    segments: raw.segments ?? null,
    bank: raw.bank ?? null,
    answer: raw.answer,
    acceptable: raw.acceptable ?? null,
  };
}

export function toExplanation(raw) {
  if (!raw) return null;
  return {
    questionId: raw.questionId,
    model: raw.model ?? "AI",
    summary: raw.summary ?? "",
    body: raw.body ?? "",
    keyPoints: raw.keyPoints ?? [],
  };
}
