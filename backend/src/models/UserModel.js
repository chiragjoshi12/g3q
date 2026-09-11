import { prisma } from '../config/prisma.client.js';
import { credentialFieldFor, ROLE } from '../config/roles.js';
import { resolveAzureBlobUrl } from '../utils/azureStorage.js';
import {
  localizedName,
  resolveUserGeography,
} from '../services/geography.service.js';

function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

const USER_GEO_INCLUDE = {
  district: true,
  taluka: true,
};

/** Fields exposed to clients — mirrors roster + login identity. */
const toRaw = (user, lang = 'gu') => {
  if (!user) return null;
  const districtName = localizedName(user.district, lang);
  const talukaName = localizedName(user.taluka, lang);
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    surname: user.surname ?? null,
    gender: user.gender ?? null,
    fatherName: user.fatherName ?? null,
    motherName: user.motherName ?? null,
    institute: user.institute ?? '',
    schoolId: user.schoolId ?? null,
    grade: user.grade ?? '',
    districtId: user.districtId ?? null,
    talukaId: user.talukaId ?? null,
    district: districtName ?? '',
    taluka: talukaName ?? null,
    village: user.village ?? null,
    socialCategory: user.socialCategory ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    phone: user.phone ?? '',
    profilePhoto: user.profilePhoto
      ? resolveAzureBlobUrl(user.profilePhoto) || user.profilePhoto
      : null,
    udiseCode: user.udiseCode ?? undefined,
    abcId: user.abcId ?? undefined,
  };
};

export class UserModel {
  /** Looks a user up by their role-specific credential (CTS Number / ABC ID). */
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
        betaProfile: { select: { id: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      institute: user.institute ?? '',
      socialCategory: user.socialCategory ?? null,
      districtId: user.districtId ?? null,
      talukaId: user.talukaId ?? null,
      district: localizedName(user.district, 'gu') || '',
      taluka: localizedName(user.taluka, 'gu') || null,
      isBeta: Boolean(user.betaProfile),
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

  static async findByPhone(role, phone) {
    const digits = phoneDigits(phone);
    if (!digits) return null;
    const user = await prisma.user.findFirst({
      where: { phone: digits },
      include: USER_GEO_INCLUDE,
    });
    if (!user) return null;
    if (role && user.role !== role) return null;
    return toRaw(user);
  }

  /** Phone-first login: resolve any role by mobile number. */
  static async findByPhoneAny(phone) {
    return this.findByPhone(null, phone);
  }

  static async updatePhone(id, phone) {
    const user = await prisma.user.update({
      where: { id },
      data: { phone: phoneDigits(phone) },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async createCitizen({ name, phone, districtId, talukaId, district, taluka }) {
    const geo = await resolveUserGeography({ districtId, talukaId, district, taluka });
    const user = await prisma.user.create({
      data: {
        role: ROLE.CITIZEN,
        name: String(name).trim(),
        districtId: geo.districtId,
        talukaId: geo.talukaId,
        phone: phoneDigits(phone),
        institute: 'નાગરિક સહભાગી',
      },
      include: USER_GEO_INCLUDE,
    });
    return toRaw(user);
  }

  static async updateCitizenProfile(id, { name, districtId, talukaId, district, taluka }) {
    const geo = await resolveUserGeography({ districtId, talukaId, district, taluka });
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: String(name).trim(),
        districtId: geo.districtId,
        talukaId: geo.talukaId,
        institute: 'નાગરિક સહભાગી',
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
}
