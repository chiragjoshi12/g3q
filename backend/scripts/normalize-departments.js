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
        nameGu: department.nameGu,
      },
      create: {
        id: department.id,
        key: department.key,
        nameEn: department.nameEn,
        nameGu: department.nameGu,
      },
    });
  }
}

async function normalizeBankQuestions() {
  const rows = await prisma.bankQuestion.findMany({
    select: {
      id: true,
      queId: true,
      departmentId: true,
      departmentEn: true,
      departmentGu: true,
    },
  });

  const unresolved = new Map();
  let updated = 0;

  for (const row of rows) {
    const raw = pickRawDepartment(row);
    const department = resolveDepartment(raw);
    if (!department) {
      unresolved.set(raw || '(empty)', unresolved.get(raw || '(empty)') || []);
      unresolved.get(raw || '(empty)').push(row.queId);
      continue;
    }

    const needsUpdate =
      row.departmentId !== department.id ||
      row.departmentEn !== department.nameEn ||
      row.departmentGu !== department.nameGu;

    if (!needsUpdate) continue;

    await prisma.bankQuestion.update({
      where: { id: row.id },
      data: {
        departmentId: department.id,
        departmentEn: department.nameEn,
        departmentGu: department.nameGu,
      },
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
  const bank = await normalizeBankQuestions();
  const snapshots = await normalizeSessionSnapshots();

  if (bank.unresolved.size > 0) {
    const details = [...bank.unresolved.entries()]
      .map(([raw, queIds]) => `${raw}: ${queIds.slice(0, 5).join(', ')}`)
      .join('\n');
    throw new Error(`Unresolved department values remain:\n${details}`);
  }

  console.log(
    JSON.stringify(
      {
        departments: DEPARTMENTS.length,
        bankQuestions: bank,
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
