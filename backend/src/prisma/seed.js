import { PrismaClient } from '@prisma/client';
import { BETA_DEPARTMENTS } from '../config/beta-departments.js';
import { DEPARTMENTS } from '../config/departments.js';
import { GUJARAT_DISTRICTS } from '../config/gujarat-geography.js';

const prisma = new PrismaClient();

// Mirrors gujarat-gov-quiz/data/*.json exactly, so the seeded backend
// reproduces the same login codes, quiz and questions the frontend's local
// JSON data source already ships with.

const users = {
  students: [
    {
      id: 'stu_1',
      role: 'student',
      udiseCode: '24010100101',
      name: 'રિયા પટેલ',
      institute: 'શ્રી સરસ્વતી વિદ્યાલય, અમદાવાદ',
      schoolId: '24070608844',
      grade: 'ધોરણ 10',
      districtKey: 'Ahmedabad',
      talukaKey: 'Daskroi',
      phone: '+91 98765 43210',
    },
    {
      id: 'stu_2',
      role: 'student',
      udiseCode: '24020200202',
      name: 'હાર્દિક ચૌધરી',
      institute: 'સરકારી માધ્યમિક શાળા, મહેસાણા',
      schoolId: '24020200202',
      grade: 'ધોરણ 12',
      districtKey: 'Mehsana',
      talukaKey: 'Mehsana',
      phone: '+91 91234 56780',
    },
  ],
  colleges: [
    {
      id: 'col_1',
      role: 'college',
      abcId: '123456789012',
      name: 'મીરા શાહ',
      institute: 'સરકારી વિનયન કૉલેજ, ગાંધીનગર',
      grade: 'બી.એ. — સેમેસ્ટર 4',
      districtKey: 'Gandhinagar',
      talukaKey: 'Gandhinagar',
      phone: '+91 99887 76655',
    },
    {
      id: 'col_2',
      role: 'college',
      abcId: '987654321098',
      name: 'કરણ ઠક્કર',
      institute: 'એલ. ડી. ઇજનેરી કૉલેજ, અમદાવાદ',
      grade: 'બી.ઈ. — સેમેસ્ટર 6',
      districtKey: 'Ahmedabad',
      talukaKey: 'Ahmedabad City',
      phone: '+91 90909 10101',
    },
  ],
  citizens: [
    {
      id: 'cit_1',
      role: 'citizen',
      name: 'અમિત દેસાઈ',
      institute: 'નાગરિક સહભાગી',
      districtKey: 'Ahmedabad',
      talukaKey: 'Sanand',
      phone: '9876543210',
    },
  ],
};


async function seedDistricts() {
  for (const district of GUJARAT_DISTRICTS) {
    await prisma.district.upsert({
      where: { id: district.id },
      update: district,
      create: district,
    });
  }
  console.log(`Seeded ${GUJARAT_DISTRICTS.length} districts.`);
}

const SEED_TALUKAS = [
  { districtKey: 'Ahmedabad', nameEn: 'Daskroi', nameGu: 'દસક્રોઇ', nameHi: 'दसक्रोइ' },
  { districtKey: 'Ahmedabad', nameEn: 'Sanand', nameGu: 'સાણંદ', nameHi: 'साणंद' },
  { districtKey: 'Ahmedabad', nameEn: 'Ahmedabad City', nameGu: 'અમદાવાદ શહેર', nameHi: 'अहमदाबाद शहर' },
  { districtKey: 'Mehsana', nameEn: 'Mehsana', nameGu: 'મહેસાણા', nameHi: 'मेहसाणा' },
  { districtKey: 'Gandhinagar', nameEn: 'Gandhinagar', nameGu: 'ગાંધીનગર', nameHi: 'गांधीनगर' },
];

async function seedSeedTalukas() {
  const byEn = new Map(GUJARAT_DISTRICTS.map((d) => [d.nameEn, d]));
  for (const row of SEED_TALUKAS) {
    const district = byEn.get(row.districtKey);
    if (!district) continue;
    await prisma.taluka.upsert({
      where: {
        districtId_nameEn: {
          districtId: district.id,
          nameEn: row.nameEn,
        },
      },
      update: {
        nameGu: row.nameGu,
        nameHi: row.nameHi,
      },
      create: {
        districtId: district.id,
        nameEn: row.nameEn,
        nameGu: row.nameGu,
        nameHi: row.nameHi,
      },
    });
  }
  console.log(`Seeded ${SEED_TALUKAS.length} demo talukas.`);
}

async function seedDepartments() {
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
  console.log(`Seeded ${DEPARTMENTS.length} departments.`);
}

async function seedBetaDepartments() {
  for (const department of BETA_DEPARTMENTS) {
    await prisma.betaDepartment.upsert({
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
  console.log(`Seeded ${BETA_DEPARTMENTS.length} beta departments.`);
}

async function resolveSeedGeography(districtKey, talukaKey) {
  const district = GUJARAT_DISTRICTS.find((item) => item.nameEn === districtKey);
  if (!district) return { districtId: null, talukaId: null };
  const taluka = await prisma.taluka.findFirst({
    where: {
      districtId: district.id,
      OR: [
        { nameEn: { equals: talukaKey } },
        { nameGu: { equals: talukaKey } },
        { nameHi: { equals: talukaKey } },
      ],
    },
  });
  return {
    districtId: district.id,
    talukaId: taluka?.id ?? null,
  };
}

async function seedUsers() {
  const allUsers = [...users.students, ...users.colleges, ...users.citizens];
  for (const user of allUsers) {
    const { districtKey, talukaKey, ...rest } = user;
    const geo = await resolveSeedGeography(districtKey, talukaKey);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        districtId: geo.districtId,
        talukaId: geo.talukaId,
      },
      create: {
        ...rest,
        districtId: geo.districtId,
        talukaId: geo.talukaId,
      },
    });
  }
  console.log(`Seeded ${allUsers.length} users.`);
}


async function seedAdminAndBank() {
  const { adminAuthService } = await import('../services/adminAuth.service.js');
  const { buildVariantPayloadFromBankRow, legacyTypeToBankType } = await import(
    '../config/question-types.js'
  );
  const { resolveDepartment } = await import('../config/departments.js');
  await adminAuthService.ensureMasterAdmin();
  console.log('Ensured master admin user.');

  const bankQuestions = [
    {
      queId: 'G3Q_Q_1',
      type: 'single_choice',
      departmentGu: 'Education, Science and technology',
      departmentEn: 'Education, Science and technology',
      questionGu: 'આઈટી/આઈટીસ નીતિ (2022-27) હેઠળ, ડીબીટીનું પૂરું નામ શું છે ?',
      questionEn: 'Under IT/ITes Policy(2022-27), what is the full form of DBT?',
      optionAGu: 'ડાયરેક્ટ બિલ્ડિંગ ટ્રાન્સફર',
      optionBGu: 'ડાયરેક્ટ બેનિફિટ ટ્રાન્સફર',
      optionCGu: 'ડાયરેક્ટ બેનિફિટ ટ્રેડ',
      optionDGu: 'ડાયરેક્ટ બિઝનેસ ટ્રાન્સફર',
      optionAEn: 'Direct Building Transfer',
      optionBEn: 'Direct Benefit Transfer',
      optionCEn: 'Direct Benefit Trade',
      optionDEn: 'Direct Business Transfer',
      correctOption: 'B',
      scope: 'GENERAL',
      districtId: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_2',
      type: 'single_choice',
      departmentGu: 'શિક્ષણ, વિજ્ઞાન અને ટેકનોલોજી',
      departmentEn: 'Education, Science and technology',
      questionGu: "ઇન્ટરનેટના સંદર્ભમાં 'યુઆરએલ' નો અર્થ શું છે ?",
      questionEn: 'What does "URL" stand for in the context of the internet?',
      optionAGu: 'યુઝર રીક્વેસ્ટેડ લિંક',
      optionBGu: 'યુનિફોર્મ રજિસ્ટ્રેશન લોગ',
      optionCGu: 'યુનિફોર્મ રીસોર્સ લોકેટર',
      optionDGu: 'યુનિવર્સલ રેકોર્ડ લિંક',
      optionAEn: 'User Requested Link',
      optionBEn: 'Uniform Registration Log',
      optionCEn: 'Uniform Resource Locator',
      optionDEn: 'Universal Record Link',
      correctOption: 'C',
      scope: 'GENERAL',
      districtId: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_3',
      type: 'single_choice',
      departmentGu: 'શિક્ષણ, વિજ્ઞાન અને ટેકનોલોજી',
      departmentEn: 'Education, Science and technology',
      questionGu:
        'તમારા ગામની શાળામાં ધોરણ-૯માં ભણતી અનુસૂચિત જાતિની વિદ્યાર્થીનીઓને અભ્યાસમાં સરળતા રહે તે માટે સરકાર દ્વારા કઈ યોજના હેઠળ સાયકલ આપવામાં આવે છે?',
      questionEn:
        'Under which scheme does the government provide bicycles to SC girls studying in Std 9 to make their commute to school easier?',
      optionAGu: 'અનુસૂચિત જાતિની કન્યાઓને મફત શિક્ષણ પૂરું પાડવું',
      optionBGu: 'સરસ્વતી સાધના યોજના',
      optionCGu: 'અનુસૂચિત જાતિના પરિવારોને આર્થિક સહાય પૂરી પાડવી',
      optionDGu: 'કૉલેજના વિદ્યાર્થીઓને શિષ્યવૃત્તિ આપવી',
      optionAEn: 'Providing free education to SC girls',
      optionBEn: 'Sarasvati Sadhana Yojana',
      optionCEn: 'Offering financial assistance to SC families',
      optionDEn: 'Providing scholarships to college students',
      correctOption: 'B',
      scope: 'TARGETED',
      districtId: null,
      casteCategory: 'SC',
    },
    {
      queId: 'G3Q_Q_4',
      type: 'single_choice',
      departmentGu: 'Education, Science and technology',
      departmentEn: 'Education, Science and technology',
      questionGu:
        "સમગ્ર શિક્ષા ગુજરાત દ્વારા 'બેટી બચાઓ બેટી પઢાઓ' અભિયાન અંતર્ગત 'દીકરીની સલામ દેશને નામ' કાર્યક્રમની ઉજવણી ક્યારે કરવામાં આવે છે?",
      questionEn:
        "When is the 'Dikri Ni Salam Desh Ne Naam' program celebrated by Samagra Shiksha Gujarat under the 'Beti Bachao Beti Padhao' campaign?",
      optionAGu: '26મી જાન્યુઆરી',
      optionBGu: '15મી ઑગસ્ટ',
      optionCGu: '5મી ઑગસ્ટ',
      optionDGu: '20મી જાન્યુઆરી',
      optionAEn: '26th January',
      optionBEn: '15th August',
      optionCEn: '5th August',
      optionDEn: '20th January',
      correctOption: 'A',
      scope: 'GENERAL',
      districtId: null,
      casteCategory: 'GENERAL',
    },
    {
      queId: 'G3Q_Q_47',
      type: 'single_choice',
      departmentGu: 'Freedom Fighters of India',
      departmentEn: 'Freedom Fighters of India',
      questionGu: 'સરદાર પટેલ સ્મારક ભવન અમદાવાદમાં કઈ જગ્યાએ આવેલું છે ?',
      questionEn: 'Sardar Patel Memorial Bhavan is located in which place in Ahmedabad?',
      optionAGu: 'શાહપુર',
      optionBGu: 'શાહીબાગ',
      optionCGu: 'પાલડી',
      optionDGu: 'વાસણા',
      optionAEn: 'Shahpur',
      optionBEn: 'Shahibag',
      optionCEn: 'Paldi',
      optionDEn: 'Vasana',
      correctOption: 'B',
      scope: 'TARGETED',
      districtId: null,
      casteCategory: 'GENERAL',
    },
  ];

  for (const q of bankQuestions) {
    const resolved = resolveDepartment(q.departmentEn || q.departmentGu);
    const root = await prisma.questionRoot.upsert({
      where: { legacyQueId: q.queId },
      update: {
        departmentId: resolved?.id ?? null,
        scope: q.scope,
        districtId: q.districtId,
        casteCategory: q.casteCategory,
      },
      create: {
        legacyQueId: q.queId,
        departmentId: resolved?.id ?? null,
        scope: q.scope,
        districtId: q.districtId,
        casteCategory: q.casteCategory,
      },
    });

    await prisma.questionVariant.upsert({
      where: { legacyQueId: q.queId },
      update: {
        rootId: root.id,
        type: legacyTypeToBankType(q.type),
        payload: buildVariantPayloadFromBankRow(q),
        reviewStatus: 'ACCEPTED',
      },
      create: {
        rootId: root.id,
        type: legacyTypeToBankType(q.type),
        legacyQueId: q.queId,
        payload: buildVariantPayloadFromBankRow(q),
        reviewStatus: 'ACCEPTED',
      },
    });
  }
  console.log(`Seeded ${bankQuestions.length} question roots/variants.`);
}

async function main() {
  await seedDistricts();
  await seedSeedTalukas();
  await seedDepartments();
  await seedBetaDepartments();
  await seedUsers();
  await seedAdminAndBank();
  // Roster sample from admin/students.json (30 students).
  const { spawnSync } = await import('child_process');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const script = path.resolve(here, '../../scripts/import-students.js');
  const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error('import-students failed during seed');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
