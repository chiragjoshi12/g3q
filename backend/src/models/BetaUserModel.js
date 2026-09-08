import { prisma } from '../config/prisma.client.js';
import { ROLE } from '../config/roles.js';

function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

function trimText(value) {
  return String(value ?? '').trim();
}

function buildFullName(firstName, lastName) {
  return [trimText(firstName), trimText(lastName)].filter(Boolean).join(' ').trim();
}

export class BetaUserModel {
  static async upsertLoginProfile({ firstName, lastName, district, taluka, phone }) {
    const first = trimText(firstName);
    const last = trimText(lastName);
    const fullName = buildFullName(first, last);
    const phoneNumber = phoneDigits(phone);
    const districtName = trimText(district);
    const talukaName = trimText(taluka);

    return prisma.$transaction(async (tx) => {
      const existing = await tx.betaUser.findFirst({
        where: { phone: phoneNumber },
      });

      if (existing) {
        const user = await tx.user.update({
          where: { id: existing.linkedUserId },
          data: {
            role: ROLE.STUDENT,
            name: fullName,
            surname: last || null,
            district: districtName,
            taluka: talukaName,
            phone: phoneNumber,
            institute: 'Beta User',
          },
        });

        await tx.betaUser.update({
          where: { id: existing.id },
          data: {
            firstName: first,
            lastName: last || null,
            fullName,
            district: districtName,
            taluka: talukaName,
            phone: phoneNumber,
          },
        });

        return user;
      }

      const user = await tx.user.create({
        data: {
          role: ROLE.STUDENT,
          name: fullName,
          surname: last || null,
          district: districtName,
          taluka: talukaName,
          phone: phoneNumber,
          institute: 'Beta User',
          joinedOn: new Date(),
        },
      });

      await tx.betaUser.create({
        data: {
          firstName: first,
          lastName: last || null,
          fullName,
          district: districtName,
          taluka: talukaName,
          phone: phoneNumber,
          linkedUserId: user.id,
        },
      });

      return user;
    });
  }
}
