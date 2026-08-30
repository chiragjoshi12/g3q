export const ROLE = {
  STUDENT: "student",
  COLLEGE: "college",
};

/** Per-role credential rules, driving both the login form and its validation. */
export const CREDENTIAL = {
  [ROLE.STUDENT]: {
    key: "udiseCode",
    label: "UDISE કોડ",
    hint: "તમારો 11 અથવા 18 અંકનો UDISE કોડ દાખલ કરો",
    placeholder: "UDISE કોડ અહીં લખો",
    length: 18,
    pattern: /^\d{11}$|^\d{18}$/,
    inputMode: "numeric",
    error: "UDISE કોડ 11 અથવા 18 અંકનો હોવો જોઈએ.",
  },
  [ROLE.COLLEGE]: {
    key: "abcId",
    label: "ABC ID",
    hint: "તમારો 12 અંકનો ABC (Academic Bank of Credits) ID દાખલ કરો",
    placeholder: "ABC ID અહીં લખો",
    length: 12,
    pattern: /^\d{12}$/,
    inputMode: "numeric",
    error: "ABC ID 12 અંકનો હોવો જોઈએ.",
  },
};

export const ROLE_TABS = [
  { id: ROLE.STUDENT, label: "શાળા વિદ્યાર્થી" },
  { id: ROLE.COLLEGE, label: "કોલેજ વિદ્યાર્થી" },
];

export function validateCredential(role, value) {
  const rule = CREDENTIAL[role];
  if (!rule) return "અમાન્ય પ્રકાર.";
  const trimmed = String(value || "").trim();
  if (!trimmed) return `${rule.label} દાખલ કરો.`;
  if (!rule.pattern.test(trimmed)) return rule.error;
  return null;
}

const PHONE_PATTERN = /^\d{10}$/;

export function validatePhone(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "મોબાઇલ નંબર દાખલ કરો.";
  if (!PHONE_PATTERN.test(trimmed)) return "મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ.";
  return null;
}
