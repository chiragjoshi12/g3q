/**
 * Mirrors gujarat-gov-quiz/lib/domain/roles.js so identity validation and
 * error copy match exactly between frontend and backend.
 */
export const ROLE = {
  STUDENT: 'student',
  COLLEGE: 'college',
  CITIZEN: 'citizen',
};

/** Per-role credential rules, driving both lookup and OTP request validation. */
export const CREDENTIAL = {
  [ROLE.STUDENT]: {
    key: 'ctsId',
    label: 'CTS ID',
    // School CTS ID is 11 digits; student-level codes from roster are 18 digits.
    pattern: /^\d{11}$|^\d{18}$/,
    error: 'CTS ID 11 અથવા 18 અંકનો હોવો જોઈએ.',
  },
  [ROLE.COLLEGE]: {
    key: 'apparId',
    label: 'Appar ID',
    pattern: /^\d{12}$/,
    error: 'Appar ID 12 અંકનો હોવો જોઈએ.',
  },
  [ROLE.CITIZEN]: {
    key: 'mobile',
    label: 'મોબાઈલ નંબર',
    pattern: /^[6-9]\d{9}$/,
    error: 'મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ અને 6, 7, 8 અથવા 9 થી શરૂ થવો જોઈએ.',
  },
};

const MOBILE_PATTERN = /^[6-9]\d{9}$/;

export function isCitizen(role) {
  return role === ROLE.CITIZEN;
}

export function usesRosterIdentity(role) {
  return role === ROLE.STUDENT || role === ROLE.COLLEGE;
}

export function validateRole(role) {
  return CREDENTIAL[role] ? null : 'અમાન્ય પ્રકાર.';
}

export function validateCredential(role, value) {
  const rule = CREDENTIAL[role];
  if (!rule) return 'અમાન્ય પ્રકાર.';
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return `${rule.label} દાખલ કરો.`;
  if (!rule.pattern.test(trimmed)) return rule.error;
  return null;
}

export function validateMobile(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return 'મોબાઇલ નંબર દાખલ કરો.';
  if (!MOBILE_PATTERN.test(trimmed)) {
    return 'મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ અને 6, 7, 8 અથવા 9 થી શરૂ થવો જોઈએ.';
  }
  return null;
}

export function validateCitizenProfile({ name, surname, districtId, talukaId }) {
  const first = String(name ?? '').trim();
  if (!first) return 'નામ દાખલ કરો.';
  if (first.length < 1) return 'નામ દાખલ કરો.';
  const last = String(surname ?? '').trim();
  if (!last) return 'અટક દાખલ કરો.';
  if (districtId == null || !Number.isFinite(Number(districtId)) || Number(districtId) <= 0) {
    return 'જિલ્લો પસંદ કરો.';
  }
  if (talukaId == null || !Number.isFinite(Number(talukaId)) || Number(talukaId) <= 0) {
    return 'તાલુકો પસંદ કરો.';
  }
  return null;
}

/** Which User column the credential is stored/looked-up in, per role. */
export function credentialFieldFor(role) {
  return role === ROLE.COLLEGE ? 'apparId' : 'ctsId';
}
