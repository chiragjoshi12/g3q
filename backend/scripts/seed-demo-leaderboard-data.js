import { prisma } from '../src/config/prisma.client.js';
import { QuizSessionModel } from '../src/models/QuizSessionModel.js';

const QUESTION_COUNT = 15;

const STUDENT_SCHOOLS = [
  {
    institute: 'શ્રી સરસ્વતી વિદ્યાલય, અમદાવાદ',
    schoolId: '24070608844',
    district: 'અમદાવાદ',
    taluka: 'DASCROI',
  },
  {
    institute: 'જિલ્લા શિક્ષણ મંડળ શાળા, પાલનપુર',
    schoolId: '24010100991',
    district: 'બનાસકાંઠા',
    taluka: 'PALANPUR',
  },
  {
    institute: 'મોડેલ હાઇસ્કૂલ, મહેસાણા',
    schoolId: '24020200555',
    district: 'મહેસાણા',
    taluka: 'MEHSANA',
  },
  {
    institute: 'સ્વામી વિવેકાનંદ વિદ્યાલય, ગાંધીનગર',
    schoolId: '24030300421',
    district: 'ગાંધીનગર',
    taluka: 'GANDHINAGAR',
  },
  {
    institute: 'શ્રી કૃષ્ણ વિદ્યામંદિર, સુરત',
    schoolId: '24040400331',
    district: 'સુરત',
    taluka: 'CHORYASI',
  },
];

const COLLEGES = [
  {
    institute: 'સરકારી વિનયન કૉલેજ, ગાંધીનગર',
    district: 'ગાંધીનગર',
    taluka: 'GANDHINAGAR',
  },
  {
    institute: 'એલ. ડી. ઇજનેરી કૉલેજ, અમદાવાદ',
    district: 'અમદાવાદ',
    taluka: 'DASCROI',
  },
  {
    institute: 'હેમચંદ્રાચાર્ય કૉલેજ, પાટણ',
    district: 'પાટણ',
    taluka: 'PATAN',
  },
  {
    institute: 'નર્મદા સાયન્સ કૉલેજ, વડોદરા',
    district: 'વડોદરા',
    taluka: 'VADODARA',
  },
];

const CITIZEN_AREAS = [
  { district: 'અમદાવાદ', taluka: 'Sanand' },
  { district: 'બનાસકાંઠા', taluka: 'Palanpur' },
  { district: 'મહેસાણા', taluka: 'Mehsana' },
  { district: 'ગાંધીનગર', taluka: 'Kalol' },
  { district: 'સુરત', taluka: 'Choryasi' },
];

const FIRST_NAMES = [
  'આરવ', 'દિવ્યા', 'કૃશ', 'કાવ્યા', 'મીત', 'જિયા', 'પાર્થ', 'આન્યા', 'વિવાન', 'મિરા',
  'હિત', 'કિઆરા', 'ધ્રુવ', 'નિધિ', 'તનય', 'પ્રિયા', 'વેદ', 'જાનવી', 'માનવ', 'નેહા',
];

const LAST_NAMES = [
  'પટેલ', 'ચૌધરી', 'શાહ', 'દેસાઈ', 'ઠક્કર', 'જાડેજા', 'સોલંકી', 'વાઘેલા', 'ત્રિવેદી', 'પરમાર',
];

const SOCIAL_CATEGORIES = ['GENERAL', 'OBC', 'SC', 'ST', 'SEBC'];
const GRADES = ['ધોરણ 9', 'ધોરણ 10', 'ધોરણ 11', 'ધોરણ 12'];
const COLLEGE_GRADES = [
  'બી.એ. - સેમેસ્ટર 2',
  'બી.કોમ - સેમેસ્ટર 4',
  'બી.એસસી - સેમેસ્ટર 6',
  'બી.ઈ. - સેમેસ્ટર 8',
];

function pick(list, index) {
  return list[index % list.length];
}

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function range(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildName(index) {
  return `${pick(FIRST_NAMES, index)} ${pick(LAST_NAMES, index + 3)}`;
}

function buildPhone(index) {
  return `9090${String(100000 + index).slice(-6)}`;
}

function buildStudents(count = 30) {
  return Array.from({ length: count }, (_, index) => {
    const school = pick(STUDENT_SCHOOLS, index);
    return {
      id: `demo_stu_${String(index + 1).padStart(3, '0')}`,
      role: 'student',
      name: buildName(index),
      institute: school.institute,
      schoolId: school.schoolId,
      grade: pick(GRADES, index),
      district: school.district,
      taluka: school.taluka,
      socialCategory: pick(SOCIAL_CATEGORIES, index),
      udiseCode: `24${String(700000000 + index).padStart(9, '0')}`,
      phone: buildPhone(index),
      joinedOn: new Date(Date.now() - range(30, 240) * 24 * 60 * 60 * 1000),
    };
  });
}

function buildColleges(count = 16) {
  return Array.from({ length: count }, (_, index) => {
    const college = pick(COLLEGES, index);
    return {
      id: `demo_col_${String(index + 1).padStart(3, '0')}`,
      role: 'college',
      name: buildName(index + 50),
      institute: college.institute,
      grade: pick(COLLEGE_GRADES, index),
      district: college.district,
      taluka: college.taluka,
      abcId: `8${String(10000000000 + index).padStart(11, '0')}`,
      phone: buildPhone(index + 100),
      joinedOn: new Date(Date.now() - range(20, 200) * 24 * 60 * 60 * 1000),
    };
  });
}

function buildCitizens(count = 65) {
  return Array.from({ length: count }, (_, index) => {
    const area = pick(CITIZEN_AREAS, index);
    return {
      id: `demo_cit_${String(index + 1).padStart(3, '0')}`,
      role: 'citizen',
      name: buildName(index + 100),
      institute: 'નાગરિક સહભાગી',
      district: area.district,
      taluka: area.taluka,
      phone: buildPhone(index + 200),
      joinedOn: new Date(Date.now() - range(5, 120) * 24 * 60 * 60 * 1000),
    };
  });
}

async function resetDemoUsers() {
  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'demo_stu_' } },
        { id: { startsWith: 'demo_col_' } },
        { id: { startsWith: 'demo_cit_' } },
      ],
    },
  });
}

async function upsertUsers(users) {
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        institute: user.institute,
        schoolId: user.schoolId ?? null,
        grade: user.grade ?? null,
        district: user.district ?? null,
        taluka: user.taluka ?? null,
        socialCategory: user.socialCategory ?? null,
        udiseCode: user.udiseCode ?? null,
        abcId: user.abcId ?? null,
        phone: user.phone,
        joinedOn: user.joinedOn,
      },
      create: user,
    });
  }
}

function sessionCountForRole(role) {
  if (role === 'student') return range(2, 4);
  if (role === 'college') return range(2, 3);
  return range(1, 3);
}

function targetAccuracy(role) {
  if (role === 'student') return range(7, 14);
  if (role === 'college') return range(8, 15);
  return range(6, 13);
}

async function createSubmittedSession(user, bankQuestions, indexSeed) {
  const selected = shuffle(bankQuestions).slice(0, QUESTION_COUNT);
  const session = await QuizSessionModel.createWithQuestions({
    userId: user.id,
    language: 'gu',
    expiresAt: new Date(Date.now() + 90 * 60 * 1000),
    bankRows: selected,
  });

  const desiredCorrect = Math.min(QUESTION_COUNT, targetAccuracy(user.role));
  const correctIndexes = new Set(shuffle([...Array(QUESTION_COUNT).keys()]).slice(0, desiredCorrect));

  const gradedRows = session.questions.map((row, index) => {
    const correctLetter = String(row.correctOption).toUpperCase();
    const wrongChoices = ['A', 'B', 'C', 'D'].filter((letter) => letter !== correctLetter);
    const selectedOption = correctIndexes.has(index)
      ? correctLetter
      : wrongChoices[(index + indexSeed) % wrongChoices.length];
    return {
      id: row.id,
      userId: user.id,
      bankQueId: row.bankQueId,
      attempted: true,
      selectedOption,
      isCorrect: selectedOption === correctLetter,
      timeSpentMs: range(6000, 26000),
    };
  });

  const totals = gradedRows.reduce(
    (acc, row) => {
      acc.correctCount += row.isCorrect ? 1 : 0;
      acc.wrongCount += row.isCorrect ? 0 : 1;
      acc.totalTimeMs += row.timeSpentMs;
      return acc;
    },
    { correctCount: 0, wrongCount: 0, totalTimeMs: 0 }
  );
  totals.wallClockMs = totals.totalTimeMs + range(20000, 120000);
  totals.averageTimeMs = Math.round(totals.totalTimeMs / gradedRows.length);
  totals.percentage = Math.round((totals.correctCount / QUESTION_COUNT) * 100);

  await Promise.all(
    gradedRows.map((row) =>
      prisma.quizSessionQuestion.update({
        where: { id: row.id },
        data: {
          selectedOption: row.selectedOption,
          isCorrect: row.isCorrect,
          timeSpentMs: row.timeSpentMs,
        },
      })
    )
  );

  for (const row of gradedRows) {
    await prisma.userQuestionExposure.upsert({
      where: {
        userId_bankQueId: {
          userId: row.userId,
          bankQueId: row.bankQueId,
        },
      },
      update: {
        lastSeenAt: new Date(),
        timesSeen: { increment: 1 },
        timesCorrect: { increment: row.isCorrect ? 1 : 0 },
        timesWrong: { increment: row.isCorrect ? 0 : 1 },
        totalTimeMs: { increment: row.timeSpentMs },
      },
      create: {
        userId: row.userId,
        bankQueId: row.bankQueId,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
        timesSeen: 1,
        timesCorrect: row.isCorrect ? 1 : 0,
        timesWrong: row.isCorrect ? 0 : 1,
        totalTimeMs: row.timeSpentMs,
      },
    });
  }

  const daysAgo = range(0, 21);
  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - range(0, 8) * 60 * 60 * 1000);
  const startedAt = new Date(completedAt.getTime() - totals.wallClockMs);

  await prisma.quizSession.update({
    where: { id: session.id },
    data: {
      status: 'submitted',
      startedAt,
      completedAt,
      expiresAt: new Date(startedAt.getTime() + 90 * 60 * 1000),
      createdAt: startedAt,
      correctCount: totals.correctCount,
      wrongCount: totals.wrongCount,
      totalTimeMs: totals.totalTimeMs,
      wallClockMs: totals.wallClockMs,
      averageTimeMs: totals.averageTimeMs,
      percentage: totals.percentage,
    },
  });
}

async function seedSessions(users, bankQuestions) {
  let created = 0;
  for (const [userIndex, user] of users.entries()) {
    const count = sessionCountForRole(user.role);
    for (let i = 0; i < count; i += 1) {
      await createSubmittedSession(user, bankQuestions, userIndex + i);
      created += 1;
    }
  }
  return created;
}

async function main() {
  let bankQuestions = await prisma.bankQuestion.findMany({
    where: {
      reviewStatus: 'ACCEPTED',
      correctOption: { not: null },
    },
  });

  if (bankQuestions.length < QUESTION_COUNT) {
    bankQuestions = await prisma.bankQuestion.findMany({
      where: {
        correctOption: { not: null },
      },
    });
  }

  if (bankQuestions.length < QUESTION_COUNT) {
    throw new Error(`Need at least ${QUESTION_COUNT} bank questions with answers, found ${bankQuestions.length}.`);
  }

  const users = [...buildStudents(), ...buildColleges(), ...buildCitizens()];

  await resetDemoUsers();
  await upsertUsers(users);
  const sessionsCreated = await seedSessions(users, bankQuestions);

  console.log(`Created ${users.length} demo users.`);
  console.log(`Created ${sessionsCreated} submitted quiz sessions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
