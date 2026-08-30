import { prisma } from '../config/prisma.client.js';

const n = (v) => Number(v ?? 0);

function dateFilters(alias, { from, to }) {
  const clauses = [];
  const params = [];
  if (from) {
    clauses.push(`${alias}.completed_at >= ?`);
    params.push(`${from} 00:00:00`);
  }
  if (to) {
    clauses.push(`${alias}.completed_at <= ?`);
    params.push(`${to} 23:59:59`);
  }
  return { clauses, params };
}

function userScopeFilters({ district, taluka, school_id }) {
  const clauses = [];
  const params = [];
  if (district) {
    clauses.push('LOWER(u.district) = LOWER(?)');
    params.push(district);
  }
  if (taluka) {
    clauses.push('LOWER(u.taluka) = LOWER(?)');
    params.push(taluka);
  }
  if (school_id) {
    clauses.push('u.school_id = ?');
    params.push(school_id);
  }
  return { clauses, params };
}

export const adminAnalyticsService = {
  async overview(filters = {}) {
    const sessionDates = dateFilters('s', filters);
    const userScope = userScopeFilters(filters);

    const rosterWhere = ['u.role = \'student\'', ...userScope.clauses];
    const rosterParams = [...userScope.params];
    const rosterRows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) AS total_students FROM users u WHERE ${rosterWhere.join(' AND ')}`,
      ...rosterParams
    );
    const totalStudents = n(rosterRows[0]?.total_students);

    const sessionWhere = [
      's.status = \'submitted\'',
      'u.role = \'student\'',
      ...sessionDates.clauses,
      ...userScope.clauses,
    ];
    const sessionParams = [...sessionDates.params, ...userScope.params];

    const kpiRows = await prisma.$queryRawUnsafe(
      `
      SELECT
        COUNT(DISTINCT s.user_id) AS students_played,
        COUNT(s.id) AS sessions_completed,
        COALESCE(SUM(s.correct_count), 0) AS questions_correct,
        COALESCE(SUM(s.wrong_count), 0) AS questions_wrong,
        COALESCE(SUM(s.question_count), 0) AS questions_attempted,
        COALESCE(SUM(s.total_time_ms), 0) AS total_time_ms,
        COALESCE(AVG(s.percentage), 0) AS avg_percentage,
        COALESCE(MAX(s.percentage), 0) AS best_percentage
      FROM quiz_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE ${sessionWhere.join(' AND ')}
      `,
      ...sessionParams
    );
    const kpis = kpiRows[0] || {};

    const bank = await prisma.bankQuestion.groupBy({
      by: ['reviewStatus'],
      _count: { _all: true },
    });
    const bankMap = Object.fromEntries(
      bank.map((r) => [r.reviewStatus, r._count._all])
    );

    const studentsPlayed = n(kpis.students_played);
    const questionsAttempted = n(kpis.questions_attempted);
    const questionsCorrect = n(kpis.questions_correct);
    const sessionsCompleted = n(kpis.sessions_completed);

    return {
      filters,
      overview: {
        total_students: totalStudents,
        students_played: studentsPlayed,
        students_not_played: Math.max(0, totalStudents - studentsPlayed),
        play_rate_pct:
          totalStudents > 0 ? Math.round((studentsPlayed / totalStudents) * 100) : 0,
        sessions_completed: sessionsCompleted,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        questions_wrong: n(kpis.questions_wrong),
        accuracy_pct:
          questionsAttempted > 0
            ? Math.round((questionsCorrect / questionsAttempted) * 100)
            : 0,
        avg_percentage: Math.round(n(kpis.avg_percentage)),
        best_percentage: Math.round(n(kpis.best_percentage)),
        total_time_ms: n(kpis.total_time_ms),
        avg_time_per_session_ms:
          sessionsCompleted > 0
            ? Math.round(n(kpis.total_time_ms) / sessionsCompleted)
            : 0,
      },
      bank: {
        total: Object.values(bankMap).reduce((a, b) => a + b, 0),
        pending: bankMap.PENDING || 0,
        accepted: bankMap.ACCEPTED || 0,
        rejected: bankMap.REJECTED || 0,
      },
    };
  },

  async geo(filters = {}) {
    const groupBy = filters.group_by || 'district';
    const limit = filters.limit || 25;
    const sessionDates = dateFilters('s', filters);
    const userScope = userScopeFilters(filters);

    const column =
      groupBy === 'taluka'
        ? 'u.taluka'
        : groupBy === 'school'
          ? 'COALESCE(NULLIF(TRIM(u.institute), \'\'), u.school_id)'
          : 'u.district';

    const extraSelect =
      groupBy === 'school'
        ? ', MAX(u.school_id) AS school_id, MAX(u.institute) AS institute'
        : '';

    const where = [
      'u.role = \'student\'',
      ...userScope.clauses,
      `${column} IS NOT NULL`,
      `TRIM(${column}) <> ''`,
    ];

    const dateJoin = sessionDates.clauses.length
      ? `AND ${sessionDates.clauses.join(' AND ')}`
      : '';

    const params = [...userScope.params, ...sessionDates.params, limit];

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        ${column} AS label
        ${extraSelect},
        COUNT(DISTINCT u.id) AS registered_students,
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN u.id END) AS students_played,
        COUNT(s.id) AS sessions_completed,
        COALESCE(SUM(s.question_count), 0) AS questions_attempted,
        COALESCE(SUM(s.correct_count), 0) AS questions_correct,
        COALESCE(AVG(s.percentage), 0) AS avg_percentage
      FROM users u
      LEFT JOIN quiz_sessions s
        ON s.user_id = u.id
       AND s.status = 'submitted'
       ${dateJoin}
      WHERE ${where.join(' AND ')}
      GROUP BY ${column}
      ORDER BY students_played DESC, sessions_completed DESC, registered_students DESC
      LIMIT ?
      `,
      ...params
    );

    return {
      group_by: groupBy,
      items: rows.map((r) => ({
        label: r.label,
        school_id: r.school_id ?? null,
        institute: r.institute ?? null,
        registered_students: n(r.registered_students),
        students_played: n(r.students_played),
        sessions_completed: n(r.sessions_completed),
        questions_attempted: n(r.questions_attempted),
        questions_correct: n(r.questions_correct),
        avg_percentage: Math.round(n(r.avg_percentage)),
        play_rate_pct:
          n(r.registered_students) > 0
            ? Math.round((n(r.students_played) / n(r.registered_students)) * 100)
            : 0,
      })),
    };
  },

  async weekly(filters = {}) {
    const sessionDates = dateFilters('s', filters);
    const userScope = userScopeFilters(filters);
    const where = [
      's.status = \'submitted\'',
      'u.role = \'student\'',
      ...sessionDates.clauses,
      ...userScope.clauses,
    ];
    const params = [...sessionDates.params, ...userScope.params];

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        YEARWEEK(s.completed_at, 3) AS year_week,
        DATE_FORMAT(MIN(s.completed_at), '%Y-%m-%d') AS week_start,
        COUNT(s.id) AS sessions_completed,
        COUNT(DISTINCT s.user_id) AS students_played,
        COALESCE(SUM(s.question_count), 0) AS questions_attempted,
        COALESCE(AVG(s.percentage), 0) AS avg_percentage
      FROM quiz_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE ${where.join(' AND ')}
        AND s.completed_at IS NOT NULL
      GROUP BY YEARWEEK(s.completed_at, 3)
      ORDER BY year_week ASC
      LIMIT 52
      `,
      ...params
    );

    return {
      items: rows.map((r) => ({
        year_week: String(r.year_week),
        week_start: r.week_start,
        sessions_completed: n(r.sessions_completed),
        students_played: n(r.students_played),
        questions_attempted: n(r.questions_attempted),
        avg_percentage: Math.round(n(r.avg_percentage)),
      })),
    };
  },

  async caste(filters = {}) {
    const sessionDates = dateFilters('s', filters);
    const userScope = userScopeFilters(filters);
    const where = ['u.role = \'student\'', ...userScope.clauses];
    const params = [...userScope.params, ...sessionDates.params];
    const dateJoin = sessionDates.clauses.length
      ? `AND ${sessionDates.clauses.join(' AND ')}`
      : '';

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        COALESCE(NULLIF(TRIM(u.social_category), ''), 'UNKNOWN') AS caste_category,
        COUNT(DISTINCT u.id) AS registered_students,
        COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN u.id END) AS students_played,
        COUNT(s.id) AS sessions_completed,
        COALESCE(SUM(s.question_count), 0) AS questions_attempted,
        COALESCE(SUM(s.correct_count), 0) AS questions_correct,
        COALESCE(AVG(s.percentage), 0) AS avg_percentage
      FROM users u
      LEFT JOIN quiz_sessions s
        ON s.user_id = u.id
       AND s.status = 'submitted'
       ${dateJoin}
      WHERE ${where.join(' AND ')}
      GROUP BY COALESCE(NULLIF(TRIM(u.social_category), ''), 'UNKNOWN')
      ORDER BY students_played DESC, registered_students DESC
      `,
      ...params
    );

    return {
      items: rows.map((r) => ({
        caste_category: r.caste_category,
        registered_students: n(r.registered_students),
        students_played: n(r.students_played),
        sessions_completed: n(r.sessions_completed),
        questions_attempted: n(r.questions_attempted),
        questions_correct: n(r.questions_correct),
        avg_percentage: Math.round(n(r.avg_percentage)),
        play_rate_pct:
          n(r.registered_students) > 0
            ? Math.round((n(r.students_played) / n(r.registered_students)) * 100)
            : 0,
      })),
    };
  },

  async dashboard(filters = {}) {
    const [overview, byDistrict, byTaluka, bySchool, weekly, caste] =
      await Promise.all([
        this.overview(filters),
        this.geo({ ...filters, group_by: 'district', limit: 20 }),
        this.geo({ ...filters, group_by: 'taluka', limit: 20 }),
        this.geo({ ...filters, group_by: 'school', limit: 20 }),
        this.weekly(filters),
        this.caste(filters),
      ]);

    return {
      ...overview,
      by_district: byDistrict.items,
      by_taluka: byTaluka.items,
      by_school: bySchool.items,
      weekly: weekly.items,
      by_caste: caste.items,
    };
  },
};
