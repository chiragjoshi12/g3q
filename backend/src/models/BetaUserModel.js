import { prisma } from '../config/prisma.client.js';
import { ROLE } from '../config/roles.js';
import { resolveUserGeography } from '../services/geography.service.js';

/** Forced beta identity for question personalisation / bank matching. */
const BETA_DISTRICT_ID = 1; // Ahmedabad
const BETA_DEFAULT_TALUKA_ID = 2; // Daskroi (any Ahmedabad taluka is fine)
const BETA_SOCIAL_CATEGORY = 'ST';

function phoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '').slice(-10);
}

function trimText(value) {
  return String(value ?? '').trim();
}

function buildFullName(firstName, lastName) {
  return [trimText(firstName), trimText(lastName)].filter(Boolean).join(' ').trim();
}

async function resolveBetaGeography({ district, taluka, districtId, talukaId }) {
  try {
    const geo = await resolveUserGeography({ districtId, talukaId, district, taluka });
    const talukaRow =
      geo.talukaId != null
        ? await prisma.taluka.findUnique({
            where: { id: geo.talukaId },
            select: { id: true, districtId: true },
          })
        : null;

    return {
      districtId: BETA_DISTRICT_ID,
      talukaId:
        talukaRow && talukaRow.districtId === BETA_DISTRICT_ID
          ? talukaRow.id
          : BETA_DEFAULT_TALUKA_ID,
      socialCategory: BETA_SOCIAL_CATEGORY,
    };
  } catch {
    return {
      districtId: BETA_DISTRICT_ID,
      talukaId: BETA_DEFAULT_TALUKA_ID,
      socialCategory: BETA_SOCIAL_CATEGORY,
    };
  }
}

export class BetaUserModel {
  static async upsertLoginProfile({
    firstName,
    lastName,
    district,
    taluka,
    districtId,
    talukaId,
    phone,
  }) {
    const first = trimText(firstName);
    const last = trimText(lastName);
    const fullName = buildFullName(first, last);
    const phoneNumber = phoneDigits(phone);
    const geo = await resolveBetaGeography({ districtId, talukaId, district, taluka });

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
            districtId: geo.districtId,
            talukaId: geo.talukaId,
            socialCategory: geo.socialCategory,
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
            districtId: geo.districtId,
            talukaId: geo.talukaId,
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
          districtId: geo.districtId,
          talukaId: geo.talukaId,
          socialCategory: geo.socialCategory,
          phone: phoneNumber,
          institute: 'Beta User',
        },
      });

      await tx.betaUser.create({
        data: {
          firstName: first,
          lastName: last || null,
          fullName,
          districtId: geo.districtId,
          talukaId: geo.talukaId,
          phone: phoneNumber,
          linkedUserId: user.id,
        },
      });

      return user;
    });
  }
}
