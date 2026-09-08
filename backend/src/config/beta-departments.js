export const BETA_DEPARTMENTS = [
  { id: 1, key: 'digital-india', nameEn: 'Digital India', nameGu: null, aliases: ['Digital India'] },
  { id: 2, key: 'finance', nameEn: 'Finance', nameGu: null, aliases: ['Finance'] },
  { id: 3, key: 'poverty-reduction', nameEn: 'Poverty Reduction', nameGu: null, aliases: ['Poverty Reduction'] },
  {
    id: 4,
    key: 'industry-manufacturing-energy',
    nameEn: 'Industry, Manufacturing & Energy',
    nameGu: null,
    aliases: [
      'Industry, Manufacturing & Energy',
      'Industry, Manufacturing & Energy (e.g., Startup India, Make in India)',
    ],
  },
  {
    id: 5,
    key: 'railway-road-infrastructure',
    nameEn: 'Railway, Road & Infrastructure',
    nameGu: null,
    aliases: ['Railway, Road & Infrastructure'],
  },
  {
    id: 6,
    key: 'science-tech',
    nameEn: 'Science & Tech',
    nameGu: null,
    aliases: ['Science & Tech', 'Science & Tech (e.g., ISRO achievements)'],
  },
  {
    id: 7,
    key: 'social-women-empowerment',
    nameEn: 'Social & Women Empowerment',
    nameGu: null,
    aliases: ['Social & Women Empowerment'],
  },
  { id: 8, key: 'health', nameEn: 'Health', nameGu: null, aliases: ['Health'] },
  { id: 9, key: 'agriculture', nameEn: 'Agriculture', nameGu: null, aliases: ['Agriculture'] },
  {
    id: 10,
    key: 'national-security-international-diplomacy',
    nameEn: 'National Security & International Diplomacy',
    nameGu: null,
    aliases: [
      'National Security & International Diplomacy',
      'National Security & International Diplomacy (e.g., foreign policy)',
    ],
  },
];

function normalizeDepartmentName(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/\(e\.g\.,[^)]*\)/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const BETA_DEPARTMENT_MAP = new Map(
  BETA_DEPARTMENTS.flatMap((department) =>
    [department.nameEn, ...(department.aliases || [])].map((alias) => [
      normalizeDepartmentName(alias),
      department,
    ])
  )
);

export function resolveBetaDepartment(value) {
  return BETA_DEPARTMENT_MAP.get(normalizeDepartmentName(value)) || null;
}
