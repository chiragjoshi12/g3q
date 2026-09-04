const DEFAULT_TALUKA = "પાલનપુર";

const TALUKA_GUJARATI = {
  palanpur: "પાલનપુર",
  dhanera: "ધાનેરા",
  sanand: "સાણંદ",
  mehsana: "મહેસાણા",
  gandhinagar: "ગાંધીનગર",
  "ahmedabad city": "અમદાવાદ શહેર",
};

export function formatTalukaLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return DEFAULT_TALUKA;

  const mapped = TALUKA_GUJARATI[raw.toLowerCase()];
  if (mapped) return mapped;

  return raw.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

export function formatTalukaWeekPill(taluka, week) {
  const n = Number.isFinite(Number(week)) ? Number(week) : 5;
  return `${formatTalukaLabel(taluka)} તાલુકો - ${n} મું અઠવાડિયું`;
}
