import { LANGUAGE } from "@/config/languages";
import { formatWeekLabel } from "@/lib/domain/format";
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
  const weekLabel = formatWeekLabel(n, language);
  if (language === LANGUAGE.ENGLISH) return `${label} Taluka - ${weekLabel}`;
  if (language === LANGUAGE.HINDI) return `${label} तालुका - ${weekLabel}`;
  return `${label} તાલુકો - ${weekLabel}`;
}
