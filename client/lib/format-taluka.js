import { LANGUAGE } from "@/config/languages";
import { localizePlaceName } from "@/lib/localize-place";

const DEFAULT_TALUKA = {
  [LANGUAGE.GUJARATI]: "પાલનપુર",
  [LANGUAGE.ENGLISH]: "Palanpur",
  [LANGUAGE.HINDI]: "पालनपुर",
};

export function formatTalukaLabel(value, language = LANGUAGE.GUJARATI) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_TALUKA[language] || DEFAULT_TALUKA[LANGUAGE.ENGLISH];
  return localizePlaceName(raw, language);
}

export function formatTalukaWeekPill(taluka, week, language = LANGUAGE.GUJARATI) {
  const n = Number.isFinite(Number(week)) ? Number(week) : 5;
  const label = formatTalukaLabel(taluka, language);
  if (language === LANGUAGE.ENGLISH) return `${label} Taluka - Week ${n}`;
  if (language === LANGUAGE.HINDI) return `${label} तालुका - सप्ताह ${n}`;
  return `${label} તાલુકો - ${n} મું અઠવાડિયું`;
}
