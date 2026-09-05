export const ROLE = {
  STUDENT: "student",
  COLLEGE: "college",
  CITIZEN: "citizen",
};

/** Per-role credential rules, driving both the login form and its validation. */
export const CREDENTIAL = {
  [ROLE.STUDENT]: {
    key: "udiseCode",
    label: "તમારો CTS નંબર",
    hint: "તમારો 11 અંકનો CTS કોડ દાખલ કરો",
    placeholder: "CTS Number અહીં લખો",
    length: 18,
    pattern: /^\d{11}$|^\d{18}$/,
    inputMode: "numeric",
    error: "CTS Number 11 અથવા 18 અંકનો હોવો જોઈએ.",
  },
  [ROLE.COLLEGE]: {
    key: "abcId",
    label: "ABC (Academic Bank of Credits) ID",
    hint: "તમારો 12 અંકનો ABC ID દાખલ કરો",
    placeholder: "ABC ID અહીં લખો",
    length: 12,
    pattern: /^\d{12}$/,
    inputMode: "numeric",
    error: "ABC ID 12 અંકનો હોવો જોઈએ.",
  },
  [ROLE.CITIZEN]: {
    key: "phone",
    label: "મોબાઈલ નંબર",
    hint: "તમારો 10 અંકનો મોબાઈલ નંબર દાખલ કરો",
    placeholder: "મોબાઈલ નંબર અહીં લખો",
    length: 10,
    pattern: /^\d{10}$/,
    inputMode: "numeric",
    error: "મોબાઈલ નંબર 10 અંકનો હોવો જોઈએ.",
  },
};

export const ROLE_TABS = [
  { id: ROLE.STUDENT, label: "શાળા વિદ્યાર્થી", icon: "/icons/Login Student.png" },
  { id: ROLE.COLLEGE, label: "કોલેજ વિદ્યાર્થી", icon: "/icons/Login College.png" },
  { id: ROLE.CITIZEN, label: "નાગરિક", icon: "/icons/Login Civilian.png" },
];

export function isCitizen(role) {
  return role === ROLE.CITIZEN;
}

export function usesRosterIdentity(role) {
  return role === ROLE.STUDENT || role === ROLE.COLLEGE;
}

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

export function validateCitizenProfile({ name, district, taluka }) {
  const fullName = String(name || "").trim();
  if (!fullName) return "પૂરું નામ દાખલ કરો.";
  if (fullName.length < 2) return "પૂરું નામ ઓછામાં ઓછા 2 અક્ષરનું હોવું જોઈએ.";
  if (!String(district || "").trim()) return "જિલ્લો દાખલ કરો.";
  if (!String(taluka || "").trim()) return "તાલુકો દાખલ કરો.";
  return null;
}
