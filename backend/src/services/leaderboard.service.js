import { prisma } from '../config/prisma.client.js';
import { CONFIG } from '../config/index.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { UserModel } from '../models/UserModel.js';
import { ROLE } from '../config/roles.js';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const DEFAULT_LANG = 'gu';
const LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;

let locationCache = null;

function normalizeNameKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeLang(lang) {
  return ['gu', 'en', 'hi'].includes(String(lang || '').trim()) ? String(lang).trim() : DEFAULT_LANG;
}

function localizedName(row, lang) {
  const safeLang = normalizeLang(lang);
  if (safeLang === 'en') return row?.nameEn || row?.nameGu || row?.nameHi || null;
  if (safeLang === 'hi') return row?.nameHi || row?.nameGu || row?.nameEn || null;
  return row?.nameGu || row?.nameEn || row?.nameHi || null;
}

async function getLocationCache() {
  const now = Date.now();
  if (locationCache && now - locationCache.at < LOCATION_CACHE_TTL_MS) {
    return locationCache;
  }

  const [districts, talukas] = await Promise.all([
    prisma.district.findMany({
      select: { id: true, nameEn: true, nameGu: true, nameHi: true },
    }),
    prisma.taluka.findMany({
      select: { id: true, districtId: true, nameEn: true, nameGu: true, nameHi: true },
    }),
  ]);

  const districtsByAnyName = new Map();
  const talukasByAnyName = new Map();
  const talukasById = new Map();

  for (const district of districts) {
    for (const name of [district.nameEn, district.nameGu, district.nameHi]) {
      const key = normalizeNameKey(name);
      if (key) districtsByAnyName.set(key, district);
    }
  }

  for (const taluka of talukas) {
    talukasById.set(taluka.id, taluka);
    for (const name of [taluka.nameEn, taluka.nameGu, taluka.nameHi]) {
      const key = normalizeNameKey(name);
      if (key) talukasByAnyName.set(key, taluka);
    }
  }

  locationCache = {
    at: now,
    districtsByAnyName,
    districtsById: new Map(districts.map((d) => [d.id, d])),
    talukasByAnyName,
    talukasById,
  };
  return locationCache;
}

const toEntry = (row, rank, meId, { role = null } = {}) => ({
  rank,
  userId: row.user_id,
  name: row.name,
  institute: row.institute || '',
  schoolId: row.school_id || null,
  grade: role === ROLE.CITIZEN ? null : row.grade || null,
  taluka: row.taluka || null,
  district: row.district || null,
  bestPercentage: Number(row.best_percentage) || 0,
  totalTimeMs: Number(row.total_time_ms) || 0,
  you: row.user_id === meId,
});

const schoolLabel = (scopeName, week, lang = DEFAULT_LANG) => {
  const safeLang = normalizeLang(lang);
  if (safeLang === 'en') return `${scopeName || 'State'} - Week ${week}`;
  if (safeLang === 'hi') return `${scopeName || 'राज्य'} - सप्ताह ${week}`;
  return `${scopeName || 'રાજ્ય'} - ${week} મું અઠવાડિયું`;
};

function talukaNamesForFilter(scopeTaluka) {
  if (!scopeTaluka) return [];
  return [...new Set([scopeTaluka.nameEn, scopeTaluka.nameGu, scopeTaluka.nameHi].filter(Boolean))];
}

function toTalukaResponse(scopeTaluka, lang = DEFAULT_LANG) {
  if (!scopeTaluka) return null;
  return {
    id: scopeTaluka.id,
    districtId: scopeTaluka.districtId,
    name: localizedName(scopeTaluka, lang),
  };
}

function toDistrictResponse(district, lang = DEFAULT_LANG) {
  if (!district) return null;
  return {
    id: district.id,
    name: localizedName(district, lang),
  };
}

function resolveWeek(week) {
  const n = Number(week);
  if (Number.isInteger(n) && n >= 1 && n <= 52) return n;
  return CONFIG.QUIZ.CURRENT_WEEK;
}

function baseFilters({ week, talukaNames, role, schoolId, institute }) {
  const where = ['la.week = ?'];
  const params = [resolveWeek(week)];

  if (talukaNames?.length) {
    where.push(`(${talukaNames.map(() => 'LOWER(la.taluka) = LOWER(?)').join(' OR ')})`);
    params.push(...talukaNames);
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

async function rankedUsers({ week, talukaNames, role, schoolId, institute, limit, meId, lang }) {
  const { whereSql, params } = baseFilters({ week, talukaNames, role, schoolId, institute });
  const sql = `
    SELECT
      la.user_id AS user_id,
      u.name,
      u.institute,
      u.school_id,
      u.grade,
      COALESCE(t.name_gu, t.name_en, la.taluka) AS taluka,
      COALESCE(d.name_gu, d.name_en, la.district) AS district,
      la.best_percentage,
      la.total_time_ms
    FROM leaderboard_aggregates la
    INNER JOIN users u
      ON u.id = la.user_id
    LEFT JOIN talukas t
      ON t.id = u.taluka_id
    LEFT JOIN districts d
      ON d.id = u.district_id
    WHERE ${whereSql}
    ORDER BY
      la.best_percentage DESC,
      la.total_correct DESC,
      la.total_time_ms ASC,
      la.user_id ASC
    LIMIT ?
  `;

  const rows = await prisma.$queryRawUnsafe(sql, ...params, limit);
  const cache = await getLocationCache();
  return rows.map((row, i) =>
    toEntry(
      {
        ...row,
        taluka: localizedName(cache.talukasByAnyName.get(normalizeNameKey(row.taluka)), lang) || row.taluka || null,
        district:
          localizedName(cache.districtsByAnyName.get(normalizeNameKey(row.district)), lang) || row.district || null,
      },
      i + 1,
      meId,
      { role }
    )
  );
}

async function findMyRank({ week, talukaNames, role, schoolId, institute, meId, lang }) {
  if (!meId) return null;
  const { whereSql, params } = baseFilters({ week, talukaNames, role, schoolId, institute });

  const meSql = `
    SELECT
      la.user_id AS user_id,
      u.name,
      u.institute,
      u.school_id,
      u.grade,
      COALESCE(t.name_gu, t.name_en, la.taluka) AS taluka,
      COALESCE(d.name_gu, d.name_en, la.district) AS district,
      la.best_percentage,
      la.total_correct,
      la.total_time_ms
    FROM leaderboard_aggregates la
    INNER JOIN users u
      ON u.id = la.user_id
    LEFT JOIN talukas t
      ON t.id = u.taluka_id
    LEFT JOIN districts d
      ON d.id = u.district_id
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
  const cache = await getLocationCache();
  return toEntry(
    {
      ...mine,
      taluka: localizedName(cache.talukasByAnyName.get(normalizeNameKey(mine.taluka)), lang) || mine.taluka || null,
      district:
        localizedName(cache.districtsByAnyName.get(normalizeNameKey(mine.district)), lang) || mine.district || null,
    },
    Number(countRows[0]?.better_count || 0) + 1,
    meId,
    { role }
  );
}

function clampLimit(limit) {
  const n = Number(limit) || DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)));
}

async function resolveScopedUser(userId) {
  if (!userId) return null;
  return UserModel.findById(userId);
}

async function topRunningTalukaRows(week) {
  const scopedWeek = resolveWeek(week);
  const currentWeekRows = await prisma.leaderboardTalukaStat.findMany({
    where: { week: scopedWeek },
    orderBy: [{ submittedSessions: 'desc' }, { taluka: 'asc' }],
    take: 25,
  });
  if (currentWeekRows.length) return currentWeekRows;

  return prisma.leaderboardTalukaStat.findMany({
    orderBy: [{ submittedSessions: 'desc' }, { week: 'desc' }, { taluka: 'asc' }],
    take: 25,
  });
}

async function findTalukaByAnyName(name) {
  const key = normalizeNameKey(name);
  if (!key) return null;
  const cache = await getLocationCache();
  return cache.talukasByAnyName.get(key) || null;
}

async function defaultTaluka() {
  const cache = await getLocationCache();
  return [...cache.talukasById.values()].sort((a, b) => a.id - b.id)[0] || null;
}

async function resolveTaluka({ userId, talukaId, talukaName, week }) {
  const providedId = Number(talukaId);
  if (Number.isInteger(providedId) && providedId > 0) {
    const cache = await getLocationCache();
    const taluka = cache.talukasById.get(providedId) || null;
    if (!taluka) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Taluka not found.');
    }
    return taluka;
  }

  if (talukaName) {
    const byName = await findTalukaByAnyName(talukaName);
    if (!byName) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'Taluka not found.');
    }
    return byName;
  }

  const me = await resolveScopedUser(userId);
  if (me?.talukaId) {
    const cache = await getLocationCache();
    const byId = cache.talukasById.get(Number(me.talukaId));
    if (byId) return byId;
  }
  const mine = await findTalukaByAnyName(me?.taluka);
  if (mine) return mine;

  const topRows = await topRunningTalukaRows(week);
  for (const row of topRows) {
    const matched = await findTalukaByAnyName(row?.taluka);
    if (matched) return matched;
  }

  return defaultTaluka();
}

async function talukaLeaderboardByRole({
  role,
  userId,
  talukaId,
  talukaName,
  week,
  limit,
  schoolId = null,
  institute = null,
  lang,
}) {
  const scopedWeek = resolveWeek(week);
  const scopeTaluka = await resolveTaluka({ userId, talukaId, talukaName, week: scopedWeek });
  if (!scopeTaluka) {
    throw new AppError(ERROR_CODE.NOT_FOUND, 'No taluka leaderboard data found.');
  }

  const cap = clampLimit(limit);
  const talukaNames = talukaNamesForFilter(scopeTaluka);
  const [items, meEntry] = await Promise.all([
    rankedUsers({
      week: scopedWeek,
      talukaNames,
      role,
      schoolId,
      institute,
      limit: cap,
      meId: userId,
      lang,
    }),
    findMyRank({
      week: scopedWeek,
      talukaNames,
      role,
      schoolId,
      institute,
      meId: userId,
      lang,
    }),
  ]);

  return {
    label: schoolLabel(localizedName(scopeTaluka, lang), scopedWeek, lang),
    total: items.length,
    items,
    me: meEntry,
  };
}

async function scopedTalukaCategory({ scope, role, userId, talukaId, talukaName, week, limit, lang }) {
  return {
    scope,
    ...(await talukaLeaderboardByRole({
      role,
      userId,
      talukaId,
      talukaName,
      week,
      limit,
      lang,
    })),
  };
}

export const leaderboardService = {
  async school({ userId, schoolId, institute, talukaId, talukaName, week, limit, lang }) {
    const scopedWeek = resolveWeek(week);
    if (talukaId || talukaName || (!schoolId && !institute)) {
      return {
        scope: 'school',
        ...(await talukaLeaderboardByRole({
          role: ROLE.STUDENT,
          userId,
          talukaId,
          talukaName,
          week: scopedWeek,
          limit,
          lang,
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

    const cap = clampLimit(limit);
    const scopeTaluka = await findTalukaByAnyName(me?.taluka);
    const talukaNames = talukaNamesForFilter(scopeTaluka);
    const [items, meEntry] = await Promise.all([
      rankedUsers({
        week: scopedWeek,
        talukaNames,
        role: ROLE.STUDENT,
        schoolId: scopeSchoolId,
        institute: scopeInstitute,
        limit: cap,
        meId: userId,
        lang,
      }),
      findMyRank({
        week: scopedWeek,
        talukaNames,
        role: ROLE.STUDENT,
        schoolId: scopeSchoolId,
        institute: scopeInstitute,
        meId: userId,
        lang,
      }),
    ]);

    return {
      scope: 'school',
      schoolId: scopeSchoolId,
      institute: scopeInstitute,
      label: schoolLabel(
        localizedName(scopeTaluka, lang) || me.taluka || me.district || scopeInstitute,
        scopedWeek,
        lang
      ),
      total: items.length,
      items,
      me: meEntry,
    };
  },

  async taluka({ userId, talukaId, talukaName, week, limit, lang }) {
    return {
      scope: 'taluka',
      ...(await talukaLeaderboardByRole({
        role: null,
        userId,
        talukaId,
        talukaName,
        week,
        limit,
        lang,
      })),
    };
  },

  async globalByRole({ userId, role, talukaId, talukaName, week, limit, lang }) {
    return scopedTalukaCategory({
      scope: role,
      role,
      userId,
      talukaId,
      talukaName,
      week,
      limit,
      lang,
    });
  },

  async overview({ userId, talukaId, talukaName, week, limit, lang }) {
    const scopedWeek = resolveWeek(week);
    const scopeTaluka = await resolveTaluka({
      userId,
      talukaId,
      talukaName,
      week: scopedWeek,
    });
    if (!scopeTaluka) {
      throw new AppError(ERROR_CODE.NOT_FOUND, 'No taluka leaderboard data found.');
    }

    const cache = await getLocationCache();
    const scopeDistrict = cache.districtsById.get(scopeTaluka.districtId) || null;

    const [school, college, citizen] = await Promise.all([
      scopedTalukaCategory({
        scope: 'school',
        role: ROLE.STUDENT,
        userId,
        talukaId: scopeTaluka.id,
        week: scopedWeek,
        limit,
        lang,
      }),
      scopedTalukaCategory({
        scope: ROLE.COLLEGE,
        role: ROLE.COLLEGE,
        userId,
        talukaId: scopeTaluka.id,
        week: scopedWeek,
        limit,
        lang,
      }),
      scopedTalukaCategory({
        scope: ROLE.CITIZEN,
        role: ROLE.CITIZEN,
        userId,
        talukaId: scopeTaluka.id,
        week: scopedWeek,
        limit,
        lang,
      }),
    ]);

    return {
      district: toDistrictResponse(scopeDistrict, lang),
      taluka: toTalukaResponse(scopeTaluka, lang),
      week: scopedWeek,
      weekMeta:
        CONFIG.QUIZ.WEEKS.find((item) => item.id === scopedWeek) || CONFIG.QUIZ.CURRENT_WEEK_META,
      weeks: CONFIG.QUIZ.WEEKS,
      school,
      college,
      citizen,
    };
  },

  async college({ userId, talukaId, talukaName, week, limit, lang }) {
    return this.globalByRole({ userId, role: ROLE.COLLEGE, talukaId, talukaName, week, limit, lang });
  },

  async citizen({ userId, talukaId, talukaName, week, limit, lang }) {
    return this.globalByRole({ userId, role: ROLE.CITIZEN, talukaId, talukaName, week, limit, lang });
  },
};
