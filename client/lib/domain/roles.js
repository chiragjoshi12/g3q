import { translateCurrent } from "@/lib/i18n";

export const ROLE = {
  STUDENT: "student",
  COLLEGE: "college",
  CITIZEN: "citizen",
};

export function getCredentialRules() {
  return {
    [ROLE.STUDENT]: {
      key: "udiseCode",
      label: translateCurrent("yourCtsNumber"),
      hint: translateCurrent("enterCtsCode"),
      placeholder: translateCurrent("yourCtsNumber"),
      length: 18,
      pattern: /^\d{11}$|^\d{18}$/,
      inputMode: "numeric",
      error: "CTS Number must be 11 or 18 digits.",
    },
    [ROLE.COLLEGE]: {
      key: "abcId",
      label: "ABC (Academic Bank of Credits) ID",
      hint: translateCurrent("enterCtsCode").replace("CTS", "ABC"),
      placeholder: "ABC ID",
      length: 12,
      pattern: /^\d{12}$/,
      inputMode: "numeric",
      error: "ABC ID must be 12 digits.",
    },
    [ROLE.CITIZEN]: {
      key: "phone",
      label: translateCurrent("mobileNumber"),
      hint: translateCurrent("enterMobileNumber"),
      placeholder: translateCurrent("mobileNumber"),
      length: 10,
      pattern: /^[6-9]\d{9}$/,
      inputMode: "numeric",
      error: translateCurrent("errorInvalidPhone"),
    },
  };
}

export function getCredentialRule(role) {
  return getCredentialRules()[role];
}

export function getRoleTabs() {
  return [
    { id: ROLE.STUDENT, label: translateCurrent("schoolStudent"), icon: "/icons/Login Student.png" },
    { id: ROLE.COLLEGE, label: translateCurrent("collegeStudent"), icon: "/icons/Login College.png" },
    { id: ROLE.CITIZEN, label: translateCurrent("citizen"), icon: "/icons/Login Civilian.png" },
  ];
}

export function isCitizen(role) {
  return role === ROLE.CITIZEN;
}

export function usesRosterIdentity(role) {
  return role === ROLE.STUDENT || role === ROLE.COLLEGE;
}

export function validateCredential(role, value) {
  const rule = getCredentialRule(role);
  if (!rule) return translateCurrent("somethingWentWrong");
  const trimmed = String(value || "").trim();
  if (!trimmed) return `${rule.label} ${translateCurrent("submit")}`;
  if (!rule.pattern.test(trimmed)) return rule.error;
  return null;
}

const PHONE_PATTERN = /^[6-9]\d{9}$/;

export function validatePhone(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return translateCurrent("mobileNumber");
  if (!PHONE_PATTERN.test(trimmed)) return translateCurrent("errorInvalidPhone");
  return null;
}

export function validateCitizenProfile({ name, district, taluka }) {
  const fullName = String(name || "").trim();
  if (!fullName) return translateCurrent("yourFullName");
  if (fullName.length < 2) return translateCurrent("yourFullName");
  if (!String(district || "").trim()) return translateCurrent("district");
  if (!String(taluka || "").trim()) return translateCurrent("taluka");
  return null;
}

export function validateBetaLoginProfile({ firstName, lastName, district, taluka, phone }) {
  const joinedName = [String(firstName || "").trim(), String(lastName || "").trim()]
    .filter(Boolean)
    .join(" ");
  const nameError = validateCitizenProfile({ name: joinedName, district, taluka });
  if (nameError) return nameError;
  return validatePhone(phone);
}
