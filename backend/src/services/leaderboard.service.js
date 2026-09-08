import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { UserModel } from '../models/UserModel.js';
import { ROLE } from '../config/roles.js';
import {
  BETA_CITIZEN_LEADERBOARD,
  BETA_COLLEGE_LEADERBOARD,
  BETA_LEADERBOARD_TALUKA,
  BETA_SCHOOL_LEADERBOARD,
} from '../data/betaLeaderboard.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const toEntry = (row, rank, meId) => ({
  rank,
  userId: row.user_id,
  name: row.name,
  institute: row.institute || '',
  schoolId: row.school_id || null,
  grade: row.grade || '',
  taluka: row.taluka || null,
  district: row.district || null,
  bestPercentage: Number(row.best_percentage) || 0,
  totalCorrect: Number(row.total_correct) || 0,
  totalWrong: Number(row.total_wrong) || 0,
  totalTimeMs: Number(row.total_time_ms) || 0,
  sessionsCompleted: Number(row.sessions_completed) || 0,
  you: row.user_id === meId,
});

const schoolLabel = (scopeName, week) =>
  `${scopeName || 'રાજ્ય'} - ${week} મું અઠવાડિયું`;

function baseFilters({ taluka, role, schoolId, institute }) {
  const where = ['la.week = ?'];
  const params = [CONFIG.QUIZ.CURRENT_WEEK];

  if (taluka) {
    where.push('LOWER(la.taluka) = LOWER(?)');
    params.push(taluka);
  }

  if (role === ROLE.STUDENT) {
    where.push("la.role = 'student'");
  } else if (role) {
    where.push('la.role = ?');
    params.push(role);
  }

  if (schoolId) {
    where.push('u.school_id = ?');
    params.push(schoolId);
  } else if (institute) {
    where.push('u.institute = ?');
    params.push(institute);
  }

  return { whereSql: where.join(' AND '), params };
}

async function rankedUsers({ taluka, role, schoolId, institute, limit, meId }) {
  const { whereSql, params } = baseFilters({ taluka, role, schoolId, institute });
  const sql = `
    SELECT
      la.user_id AS user_id,
      u.name,
      u.institute,
      u.school_id,
      u.grade,
      u.taluka,
      u.district,
      la.best_percentage,
      la.total_correct,
      la.total_wrong,
      la.total_time_ms,
      la.sessions_completed
    FROM leaderboard_aggregates la
    INNER JOIN users u
      ON u.id = la.user_id
    WHERE ${whereSql}
    ORDER BY
      la.best_percentage DESC,
      la.total_correct DESC,
      la.total_time_ms ASC,
      la.user_id ASC
    LIMIT ?
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params, limit);
  return rows.map((row, i) => toEntry(row, i + 1, meId));
}

async function findMyRank({ taluka, role, schoolId, institute, meId }) {
  if (!meId) return null;
  const { whereSql, params } = baseFilters({ taluka, role, schoolId, institute });

  const meSql = `
    SELECT
      la.user_id AS user_id,
      u.name,
      u.institute,
      u.school_id,
      u.grade,
      u.taluka,
      u.district,
      la.best_percentage,
      la.total_correct,
      la.total_wrong,
      la.total_time_ms,
      la.sessions_completed
    FROM leaderboard_aggregates la
    INNER JOIN users u
      ON u.id = la.user_id
    WHERE ${whereSql} AND la.user_id = ?
    LIMIT 1
  `;
  const mineRows = await prisma.$queryRawUnsafe(meSql, ...params, meId);
  if (!mineRows.length) return null;

  const mine = mineRows[0];
  const betterSql = `
    SELECT COUNT(*) AS better_count
    FROM leaderboard_aggregates la
    INNER JOIN users u
      ON u.id = la.user_id
    WHERE ${whereSql}
      AND (
        la.best_percentage > ?
        OR (la.best_percentage = ? AND la.total_correct > ?)
        OR (la.best_percentage = ? AND la.total_correct = ? AND la.total_time_ms < ?)
        OR (
          la.best_percentage = ?
          AND la.total_correct = ?
          AND la.total_time_ms = ?
          AND la.user_id < ?
        )
      )
  `;
  const countRows = await prisma.$queryRawUnsafe(
    betterSql,
    ...params,
    mine.best_percentage,
    mine.best_percentage,
    mine.total_correct,
    mine.best_percentage,
    mine.total_correct,
    mine.total_time_ms,
    mine.best_percentage,
    mine.total_correct,
    mine.total_time_ms,
    mine.user_id
  );
  return toEntry(mine, Number(countRows[0]?.better_count || 0) + 1, meId);
}

function clampLimit(limit) {
  const n = Number(limit) || DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)));
}

function fixedCategory(scope, items, taluka, limit) {
  const cap = clampLimit(limit);
  return {
    scope,
    taluka,
    week: CONFIG.QUIZ.CURRENT_WEEK,
    weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
    label: schoolLabel(taluka, CONFIG.QUIZ.CURRENT_WEEK),
    total: Math.min(items.length, cap),
    items: items.slice(0, cap),
    me: null,
  };
}

async function resolveScopedUser(userId) {
  if (!userId) return null;
  return UserModel.findById(userId);
}

async function topRunningTaluka() {
  return prisma.leaderboardTalukaStat.findFirst({
    where: { week: CONFIG.QUIZ.CURRENT_WEEK },
    orderBy: [{ submittedSessions: 'desc' }, { taluka: 'asc' }],
  });
}

async function resolveTaluka({ userId, taluka }) {
  const provided = String(taluka || '').trim();
  if (provided) return provided;
  const me = await resolveScopedUser(userId);
  const mine = String(me?.taluka || '').trim();
  if (mine) return mine;
  const top = await topRunningTaluka();
  return String(top?.taluka || '').trim() || null;
}

async function talukaLeaderboardByRole({ role, userId, taluka, limit, schoolId = null, institute = null }) {
  const scopeTaluka = await resolveTaluka({ userId, taluka });
  if (!scopeTaluka) {
    throw new AppError(ERROR_CODE.NOT_FOUND, 'No taluka leaderboard data found.');
  }

  const cap = clampLimit(limit);
  const [items, meEntry] = await Promise.all([
    rankedUsers({ taluka: scopeTaluka, role, schoolId, institute, limit: cap, meId: userId }),
    findMyRank({ taluka: scopeTaluka, role, schoolId, institute, meId: userId }),
  ]);

  return {
    taluka: scopeTaluka,
    week: CONFIG.QUIZ.CURRENT_WEEK,
    weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
    label: schoolLabel(scopeTaluka, CONFIG.QUIZ.CURRENT_WEEK),
    total: items.length,
    items,
    me: meEntry,
  };
}

async function scopedTalukaCategory({ scope, role, userId, taluka, limit }) {
  return {
    scope,
    ...(await talukaLeaderboardByRole({ role, userId, taluka, limit })),
  };
}

export const leaderboardService = {
  async school({ userId, schoolId, institute, taluka, limit }) {
    const scopeTaluka = String(taluka || '').trim();
    if (scopeTaluka || (!schoolId && !institute)) {
      return {
        scope: 'school',
        ...(await talukaLeaderboardByRole({
          role: ROLE.STUDENT,
          userId,
          taluka,
          limit,
        })),
      };
    }

    const me = await UserModel.findById(userId);
    if (!me) throw new AppError(ERROR_CODE.UNAUTHORIZED);

    const scopeSchoolId = (schoolId || me.schoolId || '').trim() || null;
    const scopeInstitute = (institute || me.institute || '').trim() || null;

    if (!scopeSchoolId && !scopeInstitute) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        'School is not set on this account. Provide school_id or institute.'
      );
    }

    let whereSql;
    let params;
    if (scopeSchoolId) {
      whereSql = 'u.school_id = ?';
      params = [scopeSchoolId];
    } else {
      whereSql = 'u.institute = ?';
      params = [scopeInstitute];
    }

    const cap = clampLimit(limit);
    const [items, meEntry] = await Promise.all([
      rankedUsers({
        taluka: me.taluka || null,
        role: ROLE.STUDENT,
        schoolId: scopeSchoolId,
        institute: scopeInstitute,
        limit: cap,
        meId: userId,
      }),
      findMyRank({
        taluka: me.taluka || null,
        role: ROLE.STUDENT,
        schoolId: scopeSchoolId,
        institute: scopeInstitute,
        meId: userId,
      }),
    ]);

    return {
      scope: 'school',
      schoolId: scopeSchoolId,
      institute: scopeInstitute,
      taluka: me.taluka || null,
      week: CONFIG.QUIZ.CURRENT_WEEK,
      label: schoolLabel(me.taluka || me.district || scopeInstitute, CONFIG.QUIZ.CURRENT_WEEK),
      total: items.length,
      items,
      me: meEntry,
    };
  },

  async taluka({ userId, taluka, limit }) {
    return {
      scope: 'taluka',
      ...(await talukaLeaderboardByRole({ role: null, userId, taluka, limit })),
    };
  },

  async globalByRole({ userId, role, taluka, limit }) {
    return scopedTalukaCategory({ scope: role, role, userId, taluka, limit });
  },

  async overview({ userId, taluka, limit }) {
    const scopeTaluka = await resolveTaluka({ userId, taluka });
    if (!scopeTaluka) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'No taluka leaderboard data found.');
    }

    const [school, college, citizen] = await Promise.all([
      scopedTalukaCategory({
        scope: 'school',
        role: ROLE.STUDENT,
        userId,
        taluka: scopeTaluka,
        limit,
      }),
      scopedTalukaCategory({
        scope: ROLE.COLLEGE,
        role: ROLE.COLLEGE,
        userId,
        taluka: scopeTaluka,
        limit,
      }),
      scopedTalukaCategory({
        scope: ROLE.CITIZEN,
        role: ROLE.CITIZEN,
        userId,
        taluka: scopeTaluka,
        limit,
      }),
    ]);

    return {
      taluka: scopeTaluka,
      week: CONFIG.QUIZ.CURRENT_WEEK,
      weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
      school,
      college,
      citizen,
    };
  },

  async betaOverview({ userId, taluka, limit }) {
    const me = await resolveScopedUser(userId);
    const scopeTaluka =
      String(taluka || '').trim() || String(me?.taluka || '').trim() || BETA_LEADERBOARD_TALUKA;

    return {
      taluka: scopeTaluka,
      week: CONFIG.QUIZ.CURRENT_WEEK,
      weekMeta: CONFIG.QUIZ.CURRENT_WEEK_META,
      school: fixedCategory('school', BETA_SCHOOL_LEADERBOARD, scopeTaluka, limit),
      college: fixedCategory(ROLE.COLLEGE, BETA_COLLEGE_LEADERBOARD, scopeTaluka, limit),
      citizen: fixedCategory(ROLE.CITIZEN, BETA_CITIZEN_LEADERBOARD, scopeTaluka, limit),
    };
  },

  async college({ userId, taluka, limit }) {
    return this.globalByRole({ userId, role: ROLE.COLLEGE, taluka, limit });
  },

  async citizen({ userId, taluka, limit }) {
    return this.globalByRole({ userId, role: ROLE.CITIZEN, taluka, limit });
  },
};
