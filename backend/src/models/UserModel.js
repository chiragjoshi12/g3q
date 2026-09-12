import { prisma } from '../config/prisma.client.js';
import { credentialFieldFor, ROLE } from '../config/roles.js';
import { resolveAzureBlobUrl } from '../utils/azureStorage.js';
import {
  decryptMobile,
  hashMobile,
  maskMobile,
  mobileStorageFields,
  normalizeMobileDigits,
} from '../utils/mobileCrypto.js';
import {
  localizedName,
  resolveUserGeography,
} from '../services/geography.service.js';

const USER_GEO_INCLUDE = {
  district: true,
  taluka: true,
};

/** Fields exposed to clients — mobile is always masked (never plaintext). */
const toRaw = (user, lang = 'gu') => {
  if (!user) return null;
  const districtName = localizedName(user.district, lang);
  const talukaName = localizedName(user.taluka, lang);
  const digits = decryptMobile(user.mobile);
  const firstName = String(user.name ?? '').trim();
  const surname = String(user.surname ?? '').trim();
  return {
    id: user.id,
    role: user.role,
    // Display name: first + surname merged; columns stay separate in DB.
    name: [firstName, surname].filter(Boolean).join(' '),
    surname: surname || null,
    gender: user.gender ?? null,
    fatherName: user.fatherName ?? null,
    motherName: user.motherName ?? null,
    institute: user.institute ?? null,
    schoolId: user.schoolId ?? null,
    grade: user.grade ?? '',
    districtId: user.districtId ?? null,
    talukaId: user.talukaId ?? null,
    district: districtName ?? '',
    taluka: talukaName ?? null,
    village: user.village ?? null,
    socialCategory: user.socialCategory ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    mobile: maskMobile(digits),
    profilePhoto: user.profilePhoto
      ? resolveAzureBlobUrl(user.profilePhoto) || user.profilePhoto
      : null,
    ctsId: user.ctsId ?? undefined,
    apparId: user.apparId ?? undefined,
  };
};

export class UserModel {
  /** Looks a user up by their role-specific credential (CTS ID / Appar ID). */
  static async findByCredential(role, credential) {
    const field = credentialFieldFor(role);
    const user = await prisma.user.findFirst({
      where: { role, [field]: credential },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  /** Allocation-only fields for POST /sessions — skips full serialization. */
  static async findByIdForSession(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        institute: true,
        socialCategory: true,
        districtId: true,
        talukaId: true,
        district: { select: { id: true, nameEn: true, nameGu: true, nameHi: true } },
        taluka: { select: { id: true, nameEn: true, nameGu: true, nameHi: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      institute: user.institute ?? null,
      socialCategory: user.socialCategory ?? null,
      districtId: user.districtId ?? null,
      talukaId: user.talukaId ?? null,
      district: localizedName(user.district, 'gu') || '',
      taluka: localizedName(user.taluka, 'gu') || null,
    };
  }

  /** Submit/leaderboard upsert — role + place names only. */
  static async findByIdForLeaderboard(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        districtId: true,
        talukaId: true,
        district: { select: { nameEn: true, nameGu: true, nameHi: true } },
        taluka: { select: { nameEn: true, nameGu: true, nameHi: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      role: user.role,
      districtId: user.districtId ?? null,
      talukaId: user.talukaId ?? null,
      district: localizedName(user.district, 'gu') || null,
      taluka: localizedName(user.taluka, 'gu') || null,
    };
  }

  static async findByMobile(role, mobile) {
    const lookup = hashMobile(mobile);
    if (!lookup) {
      // Legacy rows may still hold plaintext digits in `mobile` before encrypt backfill.
      const digits = normalizeMobileDigits(mobile);
      if (!digits) return null;
      const legacy = await prisma.user.findFirst({
        where: { mobile: digits },
        include: USER_GEO_INCLUDE,
      });
      if (!legacy) return null;
      if (role && legacy.role !== role) return null;
      return toRaw(legacy);
    }

    const user = await prisma.user.findFirst({
      where: { mobileHash: lookup },
      include: USER_GEO_INCLUDE,
    });
    if (!user) {
      const digits = normalizeMobileDigits(mobile);
      if (!digits) return null;
      const legacy = await prisma.user.findFirst({
        where: { mobile: digits },
        include: USER_GEO_INCLUDE,
      });
      if (!legacy) return null;
      if (role && legacy.role !== role) return null;
      return toRaw(legacy);
    }
    if (role && user.role !== role) return null;
    return toRaw(user);
  }

  /** Mobile-first login: resolve any role by mobile number. */
  static async findByMobileAny(mobile) {
    return this.findByMobile(null, mobile);
  }

  static async updateMobile(id, mobile) {
    const stored = mobileStorageFields(mobile);
    const user = await prisma.user.update({
      where: { id },
      data: stored,
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async createCitizen({ name, surname, mobile, districtId, talukaId }) {
    const geo = await resolveUserGeography({ districtId, talukaId });
    if (geo.districtId == null || geo.talukaId == null) {
      throw new Error('districtId and talukaId are required');
    }
    const stored = mobileStorageFields(mobile);
    const first = String(name).trim();
    const last = String(surname ?? '').trim();
    const user = await prisma.user.create({
      data: {
        role: ROLE.CITIZEN,
        name: first,
        surname: last || null,
        districtId: geo.districtId,
        talukaId: geo.talukaId,
        ...stored,
        institute: null,
      },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async updateCitizenProfile(id, { name, surname, districtId, talukaId }) {
    const geo = await resolveUserGeography({ districtId, talukaId });
    if (geo.districtId == null || geo.talukaId == null) {
      throw new Error('districtId and talukaId are required');
    }
    const first = String(name).trim();
    const last = String(surname ?? '').trim();
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: first,
        surname: last || null,
        districtId: geo.districtId,
        talukaId: geo.talukaId,
        institute: null,
      },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async updateProfilePhoto(id, profilePhoto) {
    const user = await prisma.user.update({
      where: { id },
      data: { profilePhoto: String(profilePhoto).trim() },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async recordConsent(userId, consentVersion) {
    await prisma.userConsent.create({
      data: {
        userId: String(userId),
        consentVersion: String(consentVersion).trim(),
      },
    });
  }
}
