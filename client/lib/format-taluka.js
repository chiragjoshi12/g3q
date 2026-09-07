import { LANGUAGE } from "@/config/languages";

const DEFAULT_TALUKA = "Palanpur";

const TALUKA_GUJARATI = {
  palanpur: "પાલનપુર",
  dhanera: "ધાનેરા",
  sanand: "સાણંદ",
  mehsana: "મહેસાણા",
  gandhinagar: "ગાંધીનગર",
  "ahmedabad city": "અમદાવાદ શહેર",
};

export function formatTalukaLabel(value, language = LANGUAGE.GUJARATI) {
  const raw = String(value || "").trim();
  if (!raw) return language === LANGUAGE.GUJARATI ? "પાલનપુર" : DEFAULT_TALUKA;

  const mapped = TALUKA_GUJARATI[raw.toLowerCase()];
  if (mapped && language === LANGUAGE.GUJARATI) return mapped;

  return raw.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function formatTalukaWeekPill(taluka, week, language = LANGUAGE.GUJARATI) {
  const n = Number.isFinite(Number(week)) ? Number(week) : 5;
  const label = formatTalukaLabel(taluka, language);
  if (language === LANGUAGE.ENGLISH) return `${label} Taluka - Week ${n}`;
  if (language === LANGUAGE.HINDI) return `${label} तालुका - सप्ताह ${n}`;
  return `${label} તાલુકો - ${n} મું અઠવાડિયું`;
}
