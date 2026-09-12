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
      error: translateCurrent("errorInvalidCtsNumber"),
    },
    [ROLE.COLLEGE]: {
      key: "abcId",
      label: translateCurrent("abcIdLabel"),
      hint: translateCurrent("enterAbcId"),
      placeholder: translateCurrent("abcIdPlaceholder"),
      length: 12,
      pattern: /^\d{12}$/,
      inputMode: "numeric",
      error: translateCurrent("errorInvalidAbcId"),
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
  if (!trimmed) return translateCurrent("enterField", { field: rule.label });
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

export function validateCitizenProfile({ name, district, taluka, districtId, talukaId }) {
  const fullName = String(name || "").trim();
  if (!fullName) return translateCurrent("yourFullName");
  if (fullName.length < 2) return translateCurrent("yourFullName");
  const hasDistrict = districtId != null || String(district || "").trim();
  const hasTaluka = talukaId != null || String(taluka || "").trim();
  if (!hasDistrict) return translateCurrent("district");
  if (!hasTaluka) return translateCurrent("taluka");
  return null;
}
