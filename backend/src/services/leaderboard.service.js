import { prisma } from '../config/prisma.client.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { UserModel } from '../models/UserModel.js';

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

/**
 * Aggregates submitted quiz_sessions per user, ranked by:
 *   1) best percentage DESC
 *   2) total correct DESC
 *   3) total time ASC (faster is better)
 */
async function rankedUsers({ whereSql, params, limit, meId }) {
  const sql = `
    SELECT
      u.id AS user_id,
      u.name,
      u.institute,
      u.school_id,
      u.grade,
      u.taluka,
      u.district,
      MAX(s.percentage) AS best_percentage,
      COALESCE(SUM(s.correct_count), 0) AS total_correct,
      COALESCE(SUM(s.wrong_count), 0) AS total_wrong,
      COALESCE(SUM(s.total_time_ms), 0) AS total_time_ms,
      COUNT(s.id) AS sessions_completed
    FROM users u
    INNER JOIN quiz_sessions s
      ON s.user_id = u.id AND s.status = 'submitted'
    WHERE ${whereSql}
    GROUP BY u.id, u.name, u.institute, u.school_id, u.grade, u.taluka, u.district
    ORDER BY best_percentage DESC, total_correct DESC, total_time_ms ASC
    LIMIT ?
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params, limit);
  return rows.map((row, i) => toEntry(row, i + 1, meId));
}

async function findMyRank({ whereSql, params, meId }) {
  if (!meId) return null;

  const sql = `
    SELECT ranked.rank_num AS rank_num, ranked.*
    FROM (
      SELECT
        u.id AS user_id,
        u.name,
        u.institute,
        u.school_id,
        u.grade,
        u.taluka,
        u.district,
        MAX(s.percentage) AS best_percentage,
        COALESCE(SUM(s.correct_count), 0) AS total_correct,
        COALESCE(SUM(s.wrong_count), 0) AS total_wrong,
        COALESCE(SUM(s.total_time_ms), 0) AS total_time_ms,
        COUNT(s.id) AS sessions_completed,
        RANK() OVER (
          ORDER BY MAX(s.percentage) DESC,
                   COALESCE(SUM(s.correct_count), 0) DESC,
                   COALESCE(SUM(s.total_time_ms), 0) ASC
        ) AS rank_num
      FROM users u
      INNER JOIN quiz_sessions s
        ON s.user_id = u.id AND s.status = 'submitted'
      WHERE ${whereSql}
      GROUP BY u.id, u.name, u.institute, u.school_id, u.grade, u.taluka, u.district
    ) ranked
    WHERE ranked.user_id = ?
    LIMIT 1
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params, meId);
  if (!rows.length) return null;
  const row = rows[0];
  return toEntry(row, Number(row.rank_num), meId);
}

function clampLimit(limit) {
  const n = Number(limit) || DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)));
}

export const leaderboardService = {
  async school({ userId, schoolId, institute, limit }) {
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
      rankedUsers({ whereSql, params, limit: cap, meId: userId }),
      findMyRank({ whereSql, params, meId: userId }),
    ]);

    return {
      scope: 'school',
      schoolId: scopeSchoolId,
      institute: scopeInstitute,
      total: items.length,
      items,
      me: meEntry,
    };
  },

  async taluka({ userId, taluka, limit }) {
    const me = await UserModel.findById(userId);
    if (!me) throw new AppError(ERROR_CODE.UNAUTHORIZED);

    const scopeTaluka = (taluka || me.taluka || '').trim() || null;
    if (!scopeTaluka) {
      throw new AppError(
        ERROR_CODE.INVALID_REQUEST,
        'Taluka is not set on this account. Provide taluka.'
      );
    }

    const whereSql = 'LOWER(u.taluka) = LOWER(?)';
    const params = [scopeTaluka];
    const cap = clampLimit(limit);

    const [items, meEntry] = await Promise.all([
      rankedUsers({ whereSql, params, limit: cap, meId: userId }),
      findMyRank({ whereSql, params, meId: userId }),
    ]);

    return {
      scope: 'taluka',
      taluka: scopeTaluka,
      total: items.length,
      items,
      me: meEntry,
    };
  },
};
