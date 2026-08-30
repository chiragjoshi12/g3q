import { prisma } from '../config/prisma.client.js';
import { credentialFieldFor } from '../config/roles.js';

/** Fields exposed to clients — mirrors roster + login identity. */
const toRaw = (user) => {
  if (!user) return null;
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
    return toRaw(user);
  }

  static async findById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return toRaw(user);
  }
}
