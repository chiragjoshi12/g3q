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
export function formatDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
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
export function formatGujaratiDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()} ${MONTHS_FULL[date.getMonth()]}, ${date.getFullYear()}`;
}

const WEEK_ORDINALS = {
  1: "પહેલું",
  2: "બીજું",
  3: "ત્રીજું",
  4: "ચોથું",
  5: "પાંચમું",
  6: "છઠ્ઠું",
  7: "સાતમું",
  8: "આઠમું",
};

/** "પહેલું અઠવાડિયું" */
export function formatWeekLabel(week) {
  const n = Number(week);
  const ordinal = WEEK_ORDINALS[n] ?? `${Number.isFinite(n) && n > 0 ? n : 1} મું`;
  return `${ordinal} અઠવાડિયું`;
}
