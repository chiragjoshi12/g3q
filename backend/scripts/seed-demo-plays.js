/**
 * Seed demo submitted quiz sessions so admin analytics has sample charts.
 * Uses existing roster students + ACCEPTED (or any) bank questions.
 * Usage: npm run seed:demo-plays
 */
import 'dotenv/config';
import { prisma } from '../src/config/prisma.client.js';

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

async function main() {
  const students = await prisma.user.findMany({
    where: { role: 'student', id: { startsWith: 'stu_roster_' } },
  });
  if (!students.length) {
    throw new Error('No roster students found. Run npm run import:students first.');
  }

  let bank = await prisma.bankQuestion.findMany({
    where: { reviewStatus: 'ACCEPTED', correctOption: { not: null } },
    take: 200,
  });
  if (bank.length < 5) {
    // Promote a slice of pending questions for demo analytics.
    const pending = await prisma.bankQuestion.findMany({
      where: { correctOption: { not: null } },
      take: 80,
    });
    for (const q of pending) {
      await prisma.bankQuestion.update({
        where: { id: q.id },
        data: { reviewStatus: 'ACCEPTED' },
      });
    }
    bank = pending;
  }
  if (bank.length < 5) {
    throw new Error('Not enough bank questions to seed demo plays.');
  }

  // Clear prior demo sessions for these students (idempotent re-seed).
  await prisma.quizSession.deleteMany({
    where: { userId: { in: students.map((s) => s.id) } },
  });

  let created = 0;
  const now = Date.now();

  for (const student of students) {
    const sessionCount = 1 + Math.floor(Math.random() * 3); // 1–3 sessions
    for (let s = 0; s < sessionCount; s += 1) {
      const daysAgo = Math.floor(Math.random() * 28);
      const completedAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
      const startedAt = new Date(completedAt.getTime() - (8 + Math.random() * 20) * 60 * 1000);
      const qs = pick(bank, 10);
      let correct = 0;
      let totalTime = 0;

      const questionCreates = qs.map((q, index) => {
        const isCorrect = Math.random() > 0.35;
        if (isCorrect) correct += 1;
        const timeSpentMs = 15000 + Math.floor(Math.random() * 45000);
        totalTime += timeSpentMs;
        const selected = isCorrect
          ? q.correctOption
          : ['A', 'B', 'C', 'D'].filter((x) => x !== q.correctOption)[
              Math.floor(Math.random() * 3)
            ];
        return {
          order: index + 1,
          bankQueId: q.queId,
          points: 1,
          departmentGu: q.departmentGu,
          departmentEn: q.departmentEn,
          questionGu: q.questionGu,
          questionEn: q.questionEn,
          optionAGu: q.optionAGu,
          optionBGu: q.optionBGu,
          optionCGu: q.optionCGu,
          optionDGu: q.optionDGu,
          optionAEn: q.optionAEn,
          optionBEn: q.optionBEn,
          optionCEn: q.optionCEn,
          optionDEn: q.optionDEn,
          correctOption: q.correctOption,
          selectedOption: selected,
          isCorrect,
          timeSpentMs,
        };
      });

      const wrong = qs.length - correct;
      const percentage = Math.round((correct / qs.length) * 100);

      await prisma.quizSession.create({
        data: {
          userId: student.id,
          status: 'submitted',
          questionCount: qs.length,
          language: 'gu',
          startedAt,
          completedAt,
          expiresAt: null,
          correctCount: correct,
          wrongCount: wrong,
          totalTimeMs: totalTime,
          wallClockMs: completedAt.getTime() - startedAt.getTime(),
          averageTimeMs: Math.round(totalTime / qs.length),
          percentage,
          questions: { create: questionCreates },
        },
      });

      for (const q of questionCreates) {
        await prisma.userQuestionExposure.upsert({
          where: {
            userId_bankQueId: { userId: student.id, bankQueId: q.bankQueId },
          },
          create: {
            userId: student.id,
            bankQueId: q.bankQueId,
            firstSeenAt: completedAt,
            lastSeenAt: completedAt,
            timesSeen: 1,
            timesCorrect: q.isCorrect ? 1 : 0,
            timesWrong: q.isCorrect ? 0 : 1,
            totalTimeMs: q.timeSpentMs,
          },
          update: {
            lastSeenAt: completedAt,
            timesSeen: { increment: 1 },
            timesCorrect: { increment: q.isCorrect ? 1 : 0 },
            timesWrong: { increment: q.isCorrect ? 0 : 1 },
            totalTimeMs: { increment: q.timeSpentMs },
          },
        });
      }

      created += 1;
    }
  }

  console.log(`Seeded ${created} demo quiz sessions for ${students.length} students.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
