import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

/** Last 10 digits only. */
export function normalizeMobileDigits(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(-10);
}

export function isValidIndianMobile(value) {
  return MOBILE_PATTERN.test(normalizeMobileDigits(value));
}

function resolveKeyMaterial() {
  const raw = String(process.env.MOBILE_ENCRYPTION_KEY || '').trim();
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  // Derive a stable 32-byte key from the configured secret (or local fallback).
  const seed = raw || process.env.JWT_SECRET || 'g3q-dev-mobile-encryption-key';
  return crypto.createHash('sha256').update(seed).digest();
}

function getKey() {
  return resolveKeyMaterial();
}

/** HMAC lookup key — never store raw mobile for search. */
export function hashMobile(value) {
  const digits = normalizeMobileDigits(value);
  if (!digits) return null;
  return crypto.createHmac('sha256', getKey()).update(`mobile:${digits}`).digest('hex');
}

/**
 * Encrypt normalized digits. Format: `ivBase64:tagBase64:cipherBase64`.
 */
export function encryptMobile(value) {
  const digits = normalizeMobileDigits(value);
  if (!digits) return null;
  if (!MOBILE_PATTERN.test(digits)) {
    throw new Error('Invalid Indian mobile number for encryption');
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(digits, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/** Decrypt ciphertext, or pass through legacy plaintext 10-digit values. */
export function decryptMobile(stored) {
  if (stored == null || stored === '') return null;
  const raw = String(stored);
  if (MOBILE_PATTERN.test(raw)) return raw;
  const parts = raw.split(':');
  if (parts.length !== 3) return null;
  const [ivB64, tagB64, dataB64] = parts;
  try {
    const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return plain.toString('utf8');
  } catch {
    return null;
  }
}

export function maskMobile(value) {
  const digits = normalizeMobileDigits(value);
  if (!digits || digits.length < 4) return '';
  return `••••••${digits.slice(-4)}`;
}

/** Persist shape for Prisma writes. */
export function mobileStorageFields(value) {
  const digits = normalizeMobileDigits(value);
  if (!digits) {
    return { mobile: null, mobileHash: null };
  }
  if (!MOBILE_PATTERN.test(digits)) {
    throw new Error('Invalid Indian mobile number');
  }
  return {
    mobile: encryptMobile(digits),
    mobileHash: hashMobile(digits),
  };
}
