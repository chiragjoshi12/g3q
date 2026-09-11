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
      u.taluka_id AS taluka_id,
      u.district_id AS district_id,
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
      AND u.taluka_id IS NOT NULL
    GROUP BY s.user_id, u.role, u.taluka_id, u.district_id
  `);

  if (aggregateRows.length) {
    await prisma.leaderboardAggregate.createMany({
      data: aggregateRows.map((row) => ({
        week,
        role: row.role,
        talukaId: Number(row.taluka_id),
        districtId: row.district_id != null ? Number(row.district_id) : null,
        bestPercentage: Number(row.best_percentage) || 0,
        totalCorrect: Number(row.total_correct) || 0,
        totalWrong: Number(row.total_wrong) || 0,
        totalTimeMs: Number(row.total_time_ms) || 0,
        sessionsCompleted: Number(row.sessions_completed) || 0,
        lastCompletedAt: row.last_completed_at || null,
        userId: row.user_id,
      })),
    });
  }

  const talukaRows = await prisma.$queryRawUnsafe(`
    SELECT
      u.taluka_id AS taluka_id,
      MAX(u.district_id) AS district_id,
      COUNT(*) AS submitted_sessions
    FROM quiz_sessions s
    INNER JOIN users u
      ON u.id = s.user_id
    WHERE s.status = 'submitted'
      AND u.taluka_id IS NOT NULL
    GROUP BY u.taluka_id
  `);

  if (talukaRows.length) {
    await prisma.leaderboardTalukaStat.createMany({
      data: talukaRows.map((row) => ({
        week,
        talukaId: Number(row.taluka_id),
        districtId: row.district_id != null ? Number(row.district_id) : null,
        submittedSessions: Number(row.submitted_sessions) || 0,
      })),
    });
  }

  console.log(
    `Done. aggregates=${aggregateRows.length}, talukaStats=${talukaRows.length}`
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
