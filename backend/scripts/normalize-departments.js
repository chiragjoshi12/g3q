import { PrismaClient } from '@prisma/client';
import { DEPARTMENTS, resolveDepartment } from '../src/config/departments.js';

const prisma = new PrismaClient();

function pickRawDepartment(row) {
  return row.departmentEn || row.departmentGu || '';
}

async function upsertDepartments() {
  for (const department of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: department.id },
      update: {
        key: department.key,
        nameEn: department.nameEn,
        nameGu: department.nameGu || department.nameEn,
      },
      create: {
        id: department.id,
        key: department.key,
        nameEn: department.nameEn,
        nameGu: department.nameGu || department.nameEn,
      },
    });
  }
}

async function normalizeQuestionRoots() {
  const rows = await prisma.questionRoot.findMany({
    select: {
      id: true,
      legacyQueId: true,
      departmentId: true,
      departmentRef: { select: { nameEn: true, nameGu: true } },
    },
  });

  const unresolved = new Map();
  let updated = 0;

  for (const row of rows) {
    const raw =
      row.departmentRef?.nameEn ||
      row.departmentRef?.nameGu ||
      '';
    // If already linked, skip unless we want to re-resolve from legacy ids — keep as-is
    if (row.departmentId) continue;

    const department = resolveDepartment(raw || row.legacyQueId);
    if (!department) {
      unresolved.set(raw || '(empty)', unresolved.get(raw || '(empty)') || []);
      unresolved.get(raw || '(empty)').push(row.legacyQueId || String(row.id));
      continue;
    }

    await prisma.questionRoot.update({
      where: { id: row.id },
      data: { departmentId: department.id },
    });
    updated += 1;
  }

  return { total: rows.length, updated, unresolved };
}

async function normalizeSessionSnapshots() {
  const rows = await prisma.quizSessionQuestion.findMany({
    select: {
      id: true,
      departmentEn: true,
      departmentGu: true,
    },
  });

  let updated = 0;

  for (const row of rows) {
    const raw = pickRawDepartment(row);
    const department = resolveDepartment(raw);
    if (!department) continue;

    const needsUpdate =
      row.departmentEn !== department.nameEn || row.departmentGu !== department.nameGu;
    if (!needsUpdate) continue;

    await prisma.quizSessionQuestion.update({
      where: { id: row.id },
      data: {
        departmentEn: department.nameEn,
        departmentGu: department.nameGu,
      },
    });
    updated += 1;
  }

  return { total: rows.length, updated };
}

async function main() {
  await upsertDepartments();
  const roots = await normalizeQuestionRoots();
  const snapshots = await normalizeSessionSnapshots();

  if (roots.unresolved.size > 0) {
    const details = [...roots.unresolved.entries()]
      .map(([raw, queIds]) => `${raw}: ${queIds.slice(0, 5).join(', ')}`)
      .join('\n');
    throw new Error(`Unresolved department values remain:\n${details}`);
  }

  console.log(
    JSON.stringify(
      {
        departments: DEPARTMENTS.length,
        questionRoots: roots,
        sessionSnapshots: snapshots,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
