/**
 * Mirrors gujarat-gov-quiz/lib/domain/roles.js so identity validation and
 * error copy match exactly between frontend and backend.
 */
export const ROLE = {
  STUDENT: 'student',
  COLLEGE: 'college',
};

/** Per-role credential rules, driving both lookup and OTP request validation. */
export const CREDENTIAL = {
  [ROLE.STUDENT]: {
    key: 'udiseCode',
    label: 'CTS Number',
    // School CTS Number is 11 digits; student-level codes from roster are 18 digits.
    pattern: /^\d{11}$|^\d{18}$/,
    error: 'CTS Number 11 અથવા 18 અંકનો હોવો જોઈએ.',
  },
  [ROLE.COLLEGE]: {
    key: 'abcId',
    label: 'ABC ID',
    pattern: /^\d{12}$/,
    error: 'ABC ID 12 અંકનો હોવો જોઈએ.',
  },
};

const PHONE_PATTERN = /^\d{10}$/;

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

export function validatePhone(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return 'મોબાઇલ નંબર દાખલ કરો.';
  if (!PHONE_PATTERN.test(trimmed)) return 'મોબાઇલ નંબર 10 અંકનો હોવો જોઈએ.';
  return null;
}

/** Which User column the credential is stored/looked-up in, per role. */
export function credentialFieldFor(role) {
  return role === ROLE.COLLEGE ? 'abcId' : 'udiseCode';
}
