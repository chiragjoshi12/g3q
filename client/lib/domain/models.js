import { getCredentialRule, ROLE } from "@/lib/domain/roles";
import { QUESTION_TYPE } from "@/config/question-types";

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
    talukaId: raw.talukaId != null ? Number(raw.talukaId) : null,
    phone: raw.phone ?? "",
    joinedOn: raw.joinedOn ?? null,
    credential,
    credentialLabel: getCredentialRule(role)?.label ?? "",
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

function optionEntries(rawOptions) {
  if (!rawOptions) return [];
  if (Array.isArray(rawOptions)) {
    return rawOptions.map((option) => [
      option.id,
      option.imageUrl || option.image ? { label: option.label, imageUrl: option.imageUrl || option.image } : option.label,
    ]);
  }
  return Object.entries(rawOptions);
}

function toOptionList(rawOptions) {
  return optionEntries(rawOptions).map(([id, value]) =>
    typeof value === "object" && value !== null
      ? {
          id,
          label: value.label ?? "",
          image: value.imageUrl ?? value.image ?? null,
        }
      : { id, label: value ?? "" }
  );
}

function toPromptSegments(questionText = "") {
  const source = String(questionText ?? "");
  const parts = source.split(/(\{\{[A-Za-z0-9_-]+\}\})/g).filter(Boolean);
  return parts.map((part) => {
    const match = part.match(/^\{\{([A-Za-z0-9_-]+)\}\}$/);
    return match ? { type: "blank", id: match[1] } : { type: "text", value: part };
  });
}

export function toQuestion(raw) {
  if (!raw) return null;
  const choiceAnswerTypes = [
    QUESTION_TYPE.SINGLE_CHOICE,
    QUESTION_TYPE.TRUE_FALSE,
    QUESTION_TYPE.IMAGE_CHOICE,
  ];
  const rawAnswer = raw.answer?.value ?? raw.answer;
  const normalizedAnswer =
    choiceAnswerTypes.includes(raw.type) && !Array.isArray(rawAnswer) && rawAnswer != null
      ? [String(rawAnswer).toLowerCase()]
      : rawAnswer;
  const options = toOptionList(raw.options);
  const targets =
    raw.targets && !Array.isArray(raw.targets) ? Object.entries(raw.targets).map(([id, label]) => ({ id, label })) : [];
  return {
    id: raw.id,
    order: Number(raw.order ?? 0),
    type: raw.type,
    points: Number(raw.points ?? 1),
    prompt: raw.question ?? raw.prompt,
    placeholder: raw.placeholder ?? "",
    options:
      raw.type === QUESTION_TYPE.MATCH_FOLLOWING ||
      raw.type === QUESTION_TYPE.DRAG_DROP ||
      raw.type === QUESTION_TYPE.DRAG_INTO_BLANKS ||
      raw.type === QUESTION_TYPE.SINGLE_CHOICE ||
      raw.type === QUESTION_TYPE.TRUE_FALSE ||
      raw.type === QUESTION_TYPE.IMAGE_CHOICE
        ? options
        : raw.options ?? null,
    left: raw.type === QUESTION_TYPE.MATCH_FOLLOWING ? targets : raw.left ?? null,
    right: raw.type === QUESTION_TYPE.MATCH_FOLLOWING ? options : raw.right ?? null,
    items: raw.type === QUESTION_TYPE.DRAG_DROP ? options : raw.items ?? null,
    segments:
      raw.type === QUESTION_TYPE.DRAG_INTO_BLANKS
        ? toPromptSegments(raw.question ?? raw.prompt)
        : raw.segments ?? null,
    bank: raw.type === QUESTION_TYPE.DRAG_INTO_BLANKS ? options : raw.bank ?? null,
    backgroundImageUrl: raw.bg ?? raw.backgroundImageUrl ?? null,
    backgroundStyle: raw.backgroundStyle ?? null,
    answer: normalizedAnswer,
    explanation: raw.explanation ?? null,
    acceptable: raw.acceptable ?? null,
  };
}

export function toExplanation(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return {
      questionId: null,
      model: "AI",
      summary: "",
      body: raw,
      keyPoints: [],
    };
  }
  return {
    questionId: raw.questionId,
    model: raw.model ?? "AI",
    summary: raw.summary ?? "",
    body: raw.body ?? "",
    keyPoints: raw.keyPoints ?? [],
  };
}
