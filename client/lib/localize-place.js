import { LANGUAGE } from "@/config/languages";
import { findDistrict, GUJARAT_DISTRICTS } from "@/data/gujarat-geo";

function pickLocalized(entry, language) {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  if (language === LANGUAGE.ENGLISH) return entry.nameEn || entry.nameGu || "";
  if (language === LANGUAGE.HINDI) return entry.nameHi || entry.nameEn || entry.nameGu || "";
  return entry.nameGu || entry.nameEn || "";
}

/** Resolve a stored district/taluka value (any language) to localized display text. */
export function localizePlaceName(name, language, { districtName } = {}) {
  const raw = String(name ?? "").trim();
  if (!raw) return "";

  const district = findDistrict(raw);
  if (district && !districtName) {
    return pickLocalized(district, language);
  }

  const parent = findDistrict(districtName || raw);
  const taluka = (parent?.talukas || []).find(
    (item) =>
      item.nameGu === raw ||
      item.nameEn === raw ||
      item.nameHi === raw ||
      item === raw
  );
  if (taluka) return pickLocalized(taluka, language);

  // Fallback: scan all districts for a matching taluka.
  for (const d of GUJARAT_DISTRICTS) {
    const hit = (d.talukas || []).find(
      (item) => item.nameGu === raw || item.nameEn === raw || item.nameHi === raw
    );
    if (hit) return pickLocalized(hit, language);
  }

  return raw;
}

export function districtChoiceOptions(language) {
  return GUJARAT_DISTRICTS.map((item) => ({
    value: item.nameGu,
    label: pickLocalized(item, language),
  }));
}

export function talukaChoiceOptions(districtName, language) {
  const district = findDistrict(districtName);
  return (district?.talukas || []).map((item) => ({
    value: item.nameGu,
    label: pickLocalized(item, language),
  }));
}
