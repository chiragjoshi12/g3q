import { prisma } from '../config/prisma.client.js';
import { AppError, ERROR_CODE } from '../utils/appError.js';
import { createTtlCache } from '../utils/ttlCache.js';

function trimText(value) {
  return String(value ?? '').trim();
}

function normalizeNameKey(value) {
  return trimText(value).toLowerCase();
}

function localizedName(row, lang = 'gu') {
  if (!row) return null;
  if (lang === 'en') return row.nameEn || row.nameGu || row.nameHi || null;
  if (lang === 'hi') return row.nameHi || row.nameEn || row.nameGu || null;
  return row.nameGu || row.nameEn || row.nameHi || null;
}

const geographyNameCache = createTtlCache({ ttlMs: 5 * 60_000 });

async function loadGeographyNameMaps() {
  const cached = geographyNameCache.get();
  if (cached) return cached;

  const [districts, talukas] = await Promise.all([
    prisma.district.findMany({
      select: { id: true, nameEn: true, nameGu: true, nameHi: true },
    }),
    prisma.taluka.findMany({
      select: {
        id: true,
        districtId: true,
        nameEn: true,
        nameGu: true,
        nameHi: true,
      },
    }),
  ]);

  const districtsByName = new Map();
  const districtsById = new Map();
  for (const row of districts) {
    districtsById.set(row.id, row);
    for (const name of [row.nameEn, row.nameGu, row.nameHi]) {
      const key = normalizeNameKey(name);
      if (key) districtsByName.set(key, row);
    }
  }

  const talukasByName = new Map();
  const talukasById = new Map();
  for (const row of talukas) {
    talukasById.set(row.id, row);
    for (const name of [row.nameEn, row.nameGu, row.nameHi]) {
      const key = normalizeNameKey(name);
      if (!key) continue;
      if (!talukasByName.has(key)) talukasByName.set(key, []);
      talukasByName.get(key).push(row);
    }
  }

  return geographyNameCache.set({
    districtsByName,
    districtsById,
    talukasByName,
    talukasById,
  });
}

export async function findDistrictById(id) {
  const districtId = Number(id);
  if (!Number.isFinite(districtId) || districtId <= 0) return null;
  const maps = await loadGeographyNameMaps();
  return maps.districtsById.get(districtId) || null;
}

export async function findTalukaById(id) {
  const talukaId = Number(id);
  if (!Number.isFinite(talukaId) || talukaId <= 0) return null;
  const maps = await loadGeographyNameMaps();
  const taluka = maps.talukasById.get(talukaId) || null;
  if (!taluka) return null;
  return {
    ...taluka,
    district: maps.districtsById.get(taluka.districtId) || null,
  };
}

export async function findDistrictByName(name) {
  const key = normalizeNameKey(name);
  if (!key) return null;
  const maps = await loadGeographyNameMaps();
  return maps.districtsByName.get(key) || null;
}

export async function findTalukaByName(name, { districtId = null } = {}) {
  const key = normalizeNameKey(name);
  if (!key) return null;
  const maps = await loadGeographyNameMaps();
  const matches = maps.talukasByName.get(key) || [];
  if (!matches.length) return null;
  if (districtId != null && Number.isFinite(Number(districtId))) {
    return matches.find((row) => Number(row.districtId) === Number(districtId)) || null;
  }
  return matches[0] || null;
}

/**
 * Resolve district/taluka from IDs and/or names.
 * Prefer IDs when provided; names are matched against en/gu/hi.
 */
export async function resolveUserGeography({
  districtId = null,
  talukaId = null,
  district = null,
  taluka = null,
} = {}) {
  let districtRow = null;
  let talukaRow = null;

  if (talukaId != null && String(talukaId).trim() !== '') {
    talukaRow = await findTalukaById(talukaId);
    if (!talukaRow) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Invalid talukaId.');
    }
    districtRow = talukaRow.district || (await findDistrictById(talukaRow.districtId));
  }

  if (!districtRow && districtId != null && String(districtId).trim() !== '') {
    districtRow = await findDistrictById(districtId);
    if (!districtRow) {
      throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Invalid districtId.');
    }
  }

  if (!districtRow && trimText(district)) {
    districtRow = await findDistrictByName(district);
  }

  if (!talukaRow && trimText(taluka)) {
    talukaRow = await findTalukaByName(taluka, {
      districtId: districtRow?.id ?? null,
    });
  }

  if (!districtRow && talukaRow?.districtId) {
    districtRow = await findDistrictById(talukaRow.districtId);
  }

  if (!districtRow) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'District is required.');
  }
  if (!talukaRow) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Taluka is required.');
  }
  if (Number(talukaRow.districtId) !== Number(districtRow.id)) {
    throw new AppError(ERROR_CODE.INVALID_REQUEST, 'Taluka does not belong to the selected district.');
  }

  return {
    districtId: districtRow.id,
    talukaId: talukaRow.id,
    district: localizedName(districtRow, 'gu'),
    taluka: localizedName(talukaRow, 'gu'),
    districtEn: districtRow.nameEn,
    talukaEn: talukaRow.nameEn,
    districtRow,
    talukaRow,
  };
}

export function placeNamesFromUser(user, lang = 'gu') {
  const district =
    localizedName(user?.districtRel || user?.districtRef, lang) ||
    localizedName(user?.district, lang) ||
    null;
  const taluka =
    localizedName(user?.talukaRel || user?.talukaRef, lang) ||
    localizedName(user?.taluka, lang) ||
    null;
  return { district, taluka };
}

export { localizedName };
