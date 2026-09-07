import 'dotenv/config';
import { prisma } from '../src/config/prisma.client.js';
import { CONFIG } from '../src/config/index.js';

async function main() {
  const week = CONFIG.QUIZ.CURRENT_WEEK;

  console.log(`Rebuilding leaderboard aggregates for week ${week}...`);

  await prisma.leaderboardAggregate.deleteMany({ where: { week } });
  await prisma.leaderboardTalukaStat.deleteMany({ where: { week } });

  const aggregateRows = await prisma.$queryRawUnsafe(`
    SELECT
      s.user_id AS user_id,
      u.role AS role,
      u.taluka AS taluka,
      u.district AS district,
      MAX(s.percentage) AS best_percentage,
      COALESCE(SUM(s.correct_count), 0) AS total_correct,
      COALESCE(SUM(s.wrong_count), 0) AS total_wrong,
      COALESCE(SUM(s.total_time_ms), 0) AS total_time_ms,
      COUNT(*) AS sessions_completed,
      MAX(COALESCE(s.completed_at, s.created_at)) AS last_completed_at
    FROM quiz_sessions s
    INNER JOIN users u
      ON u.id = s.user_id
    WHERE s.status = 'submitted'
      AND u.taluka IS NOT NULL
      AND TRIM(u.taluka) <> ''
    GROUP BY s.user_id, u.role, u.taluka, u.district
  `);

  if (aggregateRows.length) {
    await prisma.leaderboardAggregate.createMany({
      data: aggregateRows.map((row) => ({
        week,
        role: row.role,
        taluka: row.taluka,
        district: row.district || null,
        userId: row.user_id,
        bestPercentage: Number(row.best_percentage) || 0,
        totalCorrect: Number(row.total_correct) || 0,
        totalWrong: Number(row.total_wrong) || 0,
        totalTimeMs: Number(row.total_time_ms) || 0,
        sessionsCompleted: Number(row.sessions_completed) || 0,
        lastCompletedAt: row.last_completed_at ? new Date(row.last_completed_at) : null,
      })),
    });
  }

  const talukaRows = await prisma.$queryRawUnsafe(`
    SELECT
      u.taluka AS taluka,
      MAX(u.district) AS district,
      COUNT(*) AS submitted_sessions
    FROM quiz_sessions s
    INNER JOIN users u
      ON u.id = s.user_id
    WHERE s.status = 'submitted'
      AND u.taluka IS NOT NULL
      AND TRIM(u.taluka) <> ''
    GROUP BY u.taluka
  `);

  if (talukaRows.length) {
    await prisma.leaderboardTalukaStat.createMany({
      data: talukaRows.map((row) => ({
        week,
        taluka: row.taluka,
        district: row.district || null,
        submittedSessions: Number(row.submitted_sessions) || 0,
      })),
    });
  }

  console.log(
    `Leaderboard aggregates rebuilt: ${aggregateRows.length} user rows, ${talukaRows.length} taluka rows.`
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
