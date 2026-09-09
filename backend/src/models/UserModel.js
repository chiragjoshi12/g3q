import { prisma } from '../config/prisma.client.js';
import { credentialFieldFor, ROLE } from '../config/roles.js';

function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

/** Fields exposed to clients — mirrors roster + login identity. */
async function resolveTalukaId(taluka) {
  const trimmed = String(taluka ?? '').trim();
  if (!trimmed) return null;
  const rows = await prisma.$queryRawUnsafe(
    `
      SELECT id
      FROM talukas
      WHERE LOWER(name_en) = LOWER(?)
        OR LOWER(name_gu) = LOWER(?)
        OR LOWER(name_hi) = LOWER(?)
      LIMIT 1
    `,
    trimmed,
    trimmed,
    trimmed
  );
  return rows[0]?.id ?? null;
}

const toRaw = async (user) => {
  if (!user) return null;
  const talukaId = await resolveTalukaId(user.taluka);
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
    district: user.district ?? '',
    taluka: user.taluka ?? null,
    talukaId,
    village: user.village ?? null,
    socialCategory: user.socialCategory ?? null,
    dateOfBirth: user.dateOfBirth ?? null,
    phone: user.phone ?? '',
    joinedOn: user.joinedOn ? user.joinedOn.toISOString().slice(0, 10) : null,
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
    });
    return await toRaw(user);
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return await toRaw(user);
  }

  static async findByPhone(role, phone) {
    const digits = phoneDigits(phone);
    if (!digits) return null;
    const user = await prisma.user.findFirst({
      where: { phone: digits },
    });
    if (!user) return null;
    if (role && user.role !== role) return null;
    return await toRaw(user);
  }

  static async createCitizen({ name, district, taluka, phone }) {
    const user = await prisma.user.create({
      data: {
        role: ROLE.CITIZEN,
        name: String(name).trim(),
        district: String(district).trim(),
        taluka: String(taluka).trim(),
        phone: phoneDigits(phone),
        institute: 'નાગરિક સહભાગી',
        joinedOn: new Date(),
      },
    });
    return await toRaw(user);
  }

  static async updateCitizenProfile(id, { name, district, taluka }) {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: String(name).trim(),
        district: String(district).trim(),
        taluka: String(taluka).trim(),
        institute: 'નાગરિક સહભાગી',
      },
    });
    return await toRaw(user);
  }
}
