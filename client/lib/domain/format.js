import { LANGUAGE } from "@/config/languages";

export function pad2(value) {
  return String(value).padStart(2, "0");
}

/** "MM:SS" — for the running timer and compact stats. */
export function formatClock(ms = 0) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${pad2(minutes)}:${pad2(seconds)}`;
}

/** Verbose duration — for summaries and per-question review rows. */
export function formatDuration(ms = 0, language = LANGUAGE.GUJARATI) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (language === LANGUAGE.ENGLISH) {
    if (minutes === 0) return `${seconds} sec`;
    if (seconds === 0) return `${minutes} min`;
    return `${minutes} min ${seconds} sec`;
  }
  if (language === LANGUAGE.HINDI) {
    if (minutes === 0) return `${seconds} सेकंड`;
    if (seconds === 0) return `${minutes} मिनट`;
    return `${minutes} मि ${seconds} से`;
  }
  if (minutes === 0) return `${seconds} સેકન્ડ`;
  if (seconds === 0) return `${minutes} મિનિટ`;
  return `${minutes} મિ ${seconds} સે`;
}

export function formatDate(isoDate) {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  const months = [
    "જાન્યુ", "ફેબ્રુ", "માર્ચ", "એપ્રિલ", "મે", "જૂન",
    "જુલાઈ", "ઓગસ્ટ", "સપ્ટે", "ઓક્ટો", "નવે", "ડિસે",
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

const MONTHS_FULL = [
  "જાન્યુઆરી",
  "ફેબ્રુઆરી",
  "માર્ચ",
  "એપ્રિલ",
  "મે",
  "જૂન",
  "જુલાઈ",
  "ઓગસ્ટ",
  "સપ્ટેમ્બર",
  "ઓક્ટોબર",
  "નવેમ્બર",
  "ડિસેમ્બર",
];

/** "12 ઓગસ્ટ, 2026" — used on quiz-attempt cards. */
export function formatGujaratiDate(value, language = LANGUAGE.GUJARATI) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (language === LANGUAGE.ENGLISH) {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
  if (language === LANGUAGE.HINDI) {
    return new Intl.DateTimeFormat("hi-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]}, ${date.getFullYear()}`;
}

/** "Week 2" / "અઠવાડિયું 2" / "सप्ताह 2" */
export function formatWeekLabel(week, language = LANGUAGE.GUJARATI) {
  const n = Number(week);
  const safe = Number.isFinite(n) && n > 0 ? n : 1;
  if (language === LANGUAGE.ENGLISH) return `Week ${safe}`;
  if (language === LANGUAGE.HINDI) return `सप्ताह ${safe}`;
  return `અઠવાડિયું ${safe}`;
}

/** Same wording as `formatWeekLabel` — used on compact chips. */
export function formatWeekChipLabel(week, language = LANGUAGE.GUJARATI) {
  return formatWeekLabel(week, language);
}
