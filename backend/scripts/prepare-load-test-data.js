import { prisma } from '../src/config/prisma.client.js';
import { resolveUserGeography } from '../src/services/geography.service.js';

const STUDENT_COUNT = Number(process.env.LOAD_TEST_STUDENTS || 1200);
const COLLEGE_COUNT = Number(process.env.LOAD_TEST_COLLEGES || 800);
const CITIZEN_COUNT = Number(process.env.LOAD_TEST_CITIZENS || 3000);
const QUESTION_COUNT = Number(process.env.LOAD_TEST_QUESTIONS || 180);

const STUDENT_SCHOOLS = [
  { institute: 'શ્રી સરસ્વતી વિદ્યાલય, અમદાવાદ', schoolId: '24070608844', district: 'અમદાવાદ', taluka: 'DASCROI' },
  { institute: 'જિલ્લા શિક્ષણ મંડળ શાળા, પાલનપુર', schoolId: '24010100991', district: 'બનાસકાંઠા', taluka: 'PALANPUR' },
  { institute: 'મોડેલ હાઇસ્કૂલ, મહેસાણા', schoolId: '24020200555', district: 'મહેસાણા', taluka: 'MEHSANA' },
  { institute: 'સ્વામી વિવેકાનંદ વિદ્યાલય, ગાંધીનગર', schoolId: '24030300421', district: 'ગાંધીનગર', taluka: 'GANDHINAGAR' },
  { institute: 'શ્રી કૃષ્ણ વિદ્યામંદિર, સુરત', schoolId: '24040400331', district: 'સુરત', taluka: 'CHORYASI' },
];

const COLLEGES = [
  { institute: 'સરકારી વિનયન કૉલેજ, ગાંધીનગર', district: 'ગાંધીનગર', taluka: 'GANDHINAGAR' },
  { institute: 'એલ. ડી. ઇજનેરી કૉલેજ, અમદાવાદ', district: 'અમદાવાદ', taluka: 'DASCROI' },
  { institute: 'હેમચંદ્રાચાર્ય કૉલેજ, પાટણ', district: 'પાટણ', taluka: 'PATAN' },
  { institute: 'નર્મદા સાયન્સ કૉલેજ, વડોદરા', district: 'વડોદરા', taluka: 'VADODARA' },
];

const CITIZEN_AREAS = [
  { district: 'અમદાવાદ', taluka: 'Sanand' },
  { district: 'બનાસકાંઠા', taluka: 'Palanpur' },
  { district: 'મહેસાણા', taluka: 'Mehsana' },
  { district: 'ગાંધીનગર', taluka: 'Kalol' },
  { district: 'સુરત', taluka: 'Choryasi' },
  { district: 'વડોદરા', taluka: 'Vadodara' },
];

const SOCIAL_CATEGORIES = ['GENERAL', 'OBC', 'SC', 'ST', 'SEBC'];
const STUDENT_GRADES = ['ધોરણ 9', 'ધોરણ 10', 'ધોરણ 11', 'ધોરણ 12'];
const COLLEGE_GRADES = ['બી.એ. - સેમેસ્ટર 2', 'બી.કોમ - સેમેસ્ટર 4', 'બી.એસસી - સેમેસ્ટર 6', 'બી.ઈ. - સેમેસ્ટર 8'];

const pick = (list, index) => list[index % list.length];
const phoneFor = (seed) => `808${String(1000000 + seed).slice(-7)}`;

const geoCache = new Map();

async function resolveGeo(district, taluka) {
  const key = `${district}::${taluka}`;
  if (geoCache.has(key)) return geoCache.get(key);
  const geo = await resolveUserGeography({ district, taluka });
  const value = { districtId: geo.districtId, talukaId: geo.talukaId };
  geoCache.set(key, value);
  return value;
}

async function buildStudents(count) {
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const school = pick(STUDENT_SCHOOLS, index);
    const geo = await resolveGeo(school.district, school.taluka);
    rows.push({
      id: `load_stu_${String(index + 1).padStart(5, '0')}`,
      role: 'student',
      name: `Load Student ${index + 1}`,
      institute: school.institute,
      schoolId: school.schoolId,
      grade: pick(STUDENT_GRADES, index),
      districtId: geo.districtId,
      talukaId: geo.talukaId,
      socialCategory: pick(SOCIAL_CATEGORIES, index),
      udiseCode: `24${String(810000000 + index).padStart(9, '0')}`,
      phone: phoneFor(index),
    });
  }
  return rows;
}

async function buildColleges(count) {
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const college = pick(COLLEGES, index);
    const geo = await resolveGeo(college.district, college.taluka);
    rows.push({
      id: `load_col_${String(index + 1).padStart(5, '0')}`,
      role: 'college',
      name: `Load College ${index + 1}`,
      institute: college.institute,
      grade: pick(COLLEGE_GRADES, index),
      districtId: geo.districtId,
      talukaId: geo.talukaId,
      abcId: `9${String(91000000000 + index).padStart(11, '0')}`,
      phone: phoneFor(index + 200000),
    });
  }
  return rows;
}

async function buildCitizens(count) {
  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const area = pick(CITIZEN_AREAS, index);
    const geo = await resolveGeo(area.district, area.taluka);
    rows.push({
      id: `load_cit_${String(index + 1).padStart(5, '0')}`,
      role: 'citizen',
      name: `Load Citizen ${index + 1}`,
      institute: 'નાગરિક સહભાગી',
      districtId: geo.districtId,
      talukaId: geo.talukaId,
      phone: phoneFor(index + 400000),
    });
  }
  return rows;
}

function buildQuestions(count) {
  return Array.from({ length: count }, (_, index) => {
    const area = pick(CITIZEN_AREAS, index);
    const category = pick(SOCIAL_CATEGORIES, index);
    const n = index + 1;
    return {
      queId: `LOAD_Q_${String(n).padStart(5, '0')}`,
      departmentGu: 'લોડ ટેસ્ટ વિભાગ',
      departmentEn: 'Load Test Department',
      questionGu: `લોડ ટેસ્ટ પ્રશ્ન ${n} માટે યોગ્ય વિકલ્પ પસંદ કરો.`,
      questionEn: `Choose the correct option for load test question ${n}.`,
      optionAGu: `વિકલ્પ A ${n}`,
      optionBGu: `વિકલ્પ B ${n}`,
      optionCGu: `વિકલ્પ C ${n}`,
      optionDGu: `વિકલ્પ D ${n}`,
      optionAEn: `Option A ${n}`,
      optionBEn: `Option B ${n}`,
      optionCEn: `Option C ${n}`,
      optionDEn: `Option D ${n}`,
      correctOption: ['A', 'B', 'C', 'D'][index % 4],
      scope: 'GENERAL',
      district: index % 3 === 0 ? area.district : null,
      casteCategory: index % 4 === 0 ? category : 'GENERAL',
      reviewStatus: 'ACCEPTED',
    };
  });
}

async function resetLoadData() {
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'load_stu_' } },
        { id: { startsWith: 'load_col_' } },
        { id: { startsWith: 'load_cit_' } },
      ],
    },
  });

  await prisma.bankQuestion.deleteMany({
    where: { queId: { startsWith: 'LOAD_Q_' } },
  });
}

async function createUsers(users) {
  const chunkSize = 500;
  for (let index = 0; index < users.length; index += chunkSize) {
    const chunk = users.slice(index, index + chunkSize);
    await prisma.user.createMany({ data: chunk, skipDuplicates: true });
  }
}

async function createQuestions(questions) {
  const chunkSize = 300;
  for (let index = 0; index < questions.length; index += chunkSize) {
    const chunk = questions.slice(index, index + chunkSize);
    await prisma.bankQuestion.createMany({ data: chunk, skipDuplicates: true });
  }
}

async function main() {
  const users = [
    ...(await buildStudents(STUDENT_COUNT)),
    ...(await buildColleges(COLLEGE_COUNT)),
    ...(await buildCitizens(CITIZEN_COUNT)),
  ];
  const questions = buildQuestions(QUESTION_COUNT);

  await resetLoadData();
  await createQuestions(questions);
  await createUsers(users);

  console.log(
    JSON.stringify(
      {
        createdUsers: users.length,
        createdQuestions: questions.length,
        byRole: {
          student: STUDENT_COUNT,
          college: COLLEGE_COUNT,
          citizen: CITIZEN_COUNT,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
