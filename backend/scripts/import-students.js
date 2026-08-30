/**
 * Upsert students from admin/students.json into users.
 * Usage: npm run import:students
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/config/prisma.client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function emptyToNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === '' || s.toUpperCase() === 'X/X/X' ? null : s;
}

function fullName(row) {
  const parts = [row.name, row.surname].map((p) => String(p || '').trim()).filter(Boolean);
  return parts.join(' ') || 'Student';
}

function mapStudent(row) {
  const id = `stu_roster_${row.id}`;
  // Deterministic demo phone so OTP login works in local/dev.
  const phone = `9${String(row.id).padStart(9, '0')}`;

  return {
    id,
    role: 'student',
    name: fullName(row),
    surname: emptyToNull(row.surname),
    gender: emptyToNull(row.gender),
    fatherName: emptyToNull(row.father_name),
    motherName: emptyToNull(row.mother_name),
    institute: emptyToNull(row.school_name),
    schoolId: emptyToNull(row.school_id),
    grade: row.standard != null ? `Std ${row.standard}` : null,
    district: emptyToNull(row.district),
    taluka: emptyToNull(row.taluka),
    village: emptyToNull(row.village),
    socialCategory: emptyToNull(row.social_category),
    dateOfBirth: emptyToNull(row.date_of_birth),
    phone,
    udiseCode: String(row.udise_code).trim(),
    joinedOn: new Date(),
  };
}

async function main() {
  const jsonPath =
    process.argv[2] ||
    path.resolve(__dirname, '../../admin/students.json');

  const rows = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!Array.isArray(rows) || !rows.length) {
    throw new Error(`No students found in ${jsonPath}`);
  }

  let upserted = 0;
  for (const row of rows) {
    const data = mapStudent(row);
    const existing = await prisma.user.findUnique({
      where: { udiseCode: data.udiseCode },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          surname: data.surname,
          gender: data.gender,
          fatherName: data.fatherName,
          motherName: data.motherName,
          institute: data.institute,
          schoolId: data.schoolId,
          grade: data.grade,
          district: data.district,
          taluka: data.taluka,
          village: data.village,
          socialCategory: data.socialCategory,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
        },
      });
    } else {
      await prisma.user.create({ data });
    }
    upserted += 1;
  }

  console.log(`Upserted ${upserted} students from ${jsonPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
