/**
 * Seed districts (if needed) + rebuild talukas from Wikipedia list.
 * Usage: node scripts/seed-gujarat-talukas.js
 */
import 'dotenv/config';
import { prisma } from '../src/config/prisma.client.js';
import { GUJARAT_DISTRICTS, DISTRICT_BY_NAME } from '../src/config/gujarat-geography.js';
import { GUJARAT_TALUKAS } from '../src/config/gujarat-talukas.js';

async function ensureDistricts() {
  for (const district of GUJARAT_DISTRICTS) {
    await prisma.district.upsert({
      where: { id: district.id },
      update: {
        nameEn: district.nameEn,
        nameGu: district.nameGu,
        nameHi: district.nameHi,
      },
      create: district,
    });
  }
}

async function loadExistingNameMap() {
  try {
    const existing = await prisma.taluka.findMany({
      select: { nameEn: true, nameGu: true, nameHi: true, districtId: true },
    });
    const byKey = new Map();
    for (const row of existing) {
      byKey.set(`${row.districtId}::${row.nameEn.toLowerCase()}`, row);
    }
    return byKey;
  } catch {
    return new Map();
  }
}

async function seedTalukas() {
  const now = new Date();
  const nameMap = await loadExistingNameMap();
  const rows = [];
  const missing = new Set();

  for (const item of GUJARAT_TALUKAS) {
    const district = DISTRICT_BY_NAME.get(item.districtEn);
    if (!district) {
      missing.add(item.districtEn);
      continue;
    }
    const prior = nameMap.get(`${district.id}::${item.nameEn.toLowerCase()}`);
    const nameGu = item.nameGu || prior?.nameGu || item.nameEn;
    const nameHi = item.nameHi || prior?.nameHi || item.nameEn;
    rows.push({
      districtId: district.id,
      nameEn: item.nameEn,
      nameGu,
      nameHi,
      type: item.type,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (missing.size) {
    throw new Error(`Unknown districts in taluka list: ${[...missing].join(', ')}`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.updateMany({ data: { talukaId: null } });
    await tx.leaderboardAggregate.deleteMany({});
    await tx.leaderboardTalukaStat.deleteMany({});
    await tx.taluka.deleteMany({});
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await tx.taluka.createMany({ data: rows.slice(i, i + chunkSize) });
    }
  });

  const [talukaCount, mcCount] = await Promise.all([
    prisma.taluka.count({ where: { type: 'taluka' } }),
    prisma.taluka.count({ where: { type: 'municipal_corporation' } }),
  ]);

  console.log(
    `Seeded talukas: ${talukaCount} taluka + ${mcCount} municipal_corporation = ${talukaCount + mcCount}`
  );
}

async function main() {
  await ensureDistricts();
  await seedTalukas();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
