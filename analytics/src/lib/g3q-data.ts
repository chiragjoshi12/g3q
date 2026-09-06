export type Category = "all" | "school" | "college" | "citizen";

export type CategoryLabel = "School Student" | "College Student" | "Citizen";

export type WeeklyStats = {
  played: number;
  totalPlays: number;
};

export type MetricBundle = {
  total: number | null;
  registered: number;
  played: number;
  totalPlays: number;
  weekly: WeeklyStats[];
};

export type Institution = {
  id: string;
  slug: string;
  name: string;
  type: "school" | "college";
  categoryLabel: CategoryLabel;
  metrics: MetricBundle;
};

export type Taluka = {
  id: string;
  slug: string;
  name: string;
  institutions: Institution[];
  metrics: Record<Exclude<Category, "all">, MetricBundle>;
};

export type District = {
  id: string;
  slug: string;
  name: string;
  talukas: Taluka[];
};

export type EntityKind = "state" | "district" | "taluka" | "institution";

export type SummaryMetrics = {
  total: number | null;
  registered: number;
  played: number;
  totalPlays: number;
  registrationRate: number | null;
  activationRate: number | null;
  reachRate: number | null;
};

export type ChildRow = {
  id: string;
  slug: string;
  name: string;
  kind: "district" | "taluka" | "institution";
  category: Category;
  categoryLabel: string;
  metrics: SummaryMetrics;
  weekly: WeeklyStats[];
  bundles: Partial<Record<Category, MetricBundle>>;
  href?: string;
  institutions?: Institution[];
};

export type DashboardEntity = {
  id: string;
  slug: string;
  kind: EntityKind;
  name: string;
  parentName?: string;
  header: SummaryMetrics;
  headerWeekly: WeeklyStats[];
  headerBundles: Partial<Record<Category, MetricBundle>>;
  children: ChildRow[];
  switcherOptions: { label: string; href: string; selected: boolean }[];
  citizenEmptyState?: {
    title: string;
    description: string;
  };
};

const WEEK_SHAPES = [
  [0.08, 0.11, 0.1, 0.13, 0.14, 0.15, 0.14, 0.15],
  [0.07, 0.09, 0.12, 0.11, 0.13, 0.16, 0.16, 0.16],
  [0.09, 0.12, 0.1, 0.1, 0.12, 0.14, 0.15, 0.18],
  [0.1, 0.11, 0.12, 0.09, 0.11, 0.13, 0.16, 0.18],
];

const DISTRICT_BLUEPRINTS = [
  {
    district: "Ahmedabad",
    talukas: ["Daskroi", "Sanand", "Dholka", "Viramgam", "Bavla"],
  },
  {
    district: "Surat",
    talukas: ["Choryasi", "Kamrej", "Bardoli", "Olpad", "Mahuva"],
  },
  {
    district: "Vadodara",
    talukas: ["Vadodara", "Dabhoi", "Karjan", "Savli"],
  },
  {
    district: "Rajkot",
    talukas: ["Rajkot", "Gondal", "Jasdan", "Jetpur"],
  },
  {
    district: "Bhavnagar",
    talukas: ["Bhavnagar", "Mahuva", "Palitana", "Sihor"],
  },
  {
    district: "Jamnagar",
    talukas: ["Jamnagar", "Dhrol", "Kalavad", "Lalpur"],
  },
  {
    district: "Kutch",
    talukas: ["Bhuj", "Anjar", "Mundra", "Mandvi", "Nakhatrana"],
  },
  {
    district: "Banaskantha",
    talukas: ["Palanpur", "Deesa", "Danta", "Tharad", "Dhanera"],
  },
  {
    district: "Junagadh",
    talukas: ["Junagadh", "Manavadar", "Keshod", "Mangrol"],
  },
  {
    district: "Anand",
    talukas: ["Anand", "Petlad", "Borsad", "Umreth"],
  },
] as const;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function pickInRange(seed: number, min: number, max: number) {
  const span = max - min + 1;
  return min + (seed % span);
}

function splitTotal(total: number, proportions: number[]) {
  const raw = proportions.map((share) => Math.round(total * share));
  const current = raw.reduce((sum, value) => sum + value, 0);
  raw[raw.length - 1] += total - current;
  return raw;
}

function makeWeeklyStats(
  played: number,
  totalPlays: number,
  seedKey: string,
): WeeklyStats[] {
  const seed = hashCode(seedKey);
  const shape = WEEK_SHAPES[seed % WEEK_SHAPES.length];
  const playedParts = splitTotal(played, [...shape]);
  const extraPlays = totalPlays - played;
  const extraShape = splitTotal(
    extraPlays,
    shape.map((share, index) => share + (((seed >> index) % 7) + 1) / 100),
  );

  return playedParts.map((weekPlayed, index) => ({
    played: weekPlayed,
    totalPlays: weekPlayed + extraShape[index],
  }));
}

function sumWeeklyStats(collection: WeeklyStats[][]) {
  return Array.from({ length: 8 }, (_, weekIndex) =>
    collection.reduce(
      (aggregate, weekly) => ({
        played: aggregate.played + weekly[weekIndex].played,
        totalPlays: aggregate.totalPlays + weekly[weekIndex].totalPlays,
      }),
      { played: 0, totalPlays: 0 },
    ),
  );
}

function addMetricBundles(bundles: MetricBundle[]): MetricBundle {
  const hasUnavailableTotal = bundles.some((bundle) => bundle.total === null);
  return {
    total: hasUnavailableTotal
      ? null
      : bundles.reduce((sum, bundle) => sum + (bundle.total ?? 0), 0),
    registered: bundles.reduce((sum, bundle) => sum + bundle.registered, 0),
    played: bundles.reduce((sum, bundle) => sum + bundle.played, 0),
    totalPlays: bundles.reduce((sum, bundle) => sum + bundle.totalPlays, 0),
    weekly: sumWeeklyStats(bundles.map((bundle) => bundle.weekly)),
  };
}

function summarizeMetrics(bundle: MetricBundle): SummaryMetrics {
  const registrationRate =
    bundle.total && bundle.total > 0 ? bundle.registered / bundle.total : null;
  const activationRate =
    bundle.registered > 0 ? bundle.played / bundle.registered : null;
  const reachRate =
    bundle.total && bundle.total > 0 ? bundle.played / bundle.total : null;

  return {
    total: bundle.total,
    registered: bundle.registered,
    played: bundle.played,
    totalPlays: bundle.totalPlays,
    registrationRate,
    activationRate,
    reachRate,
  };
}

function bundleForWeek(bundle: MetricBundle, week: number | null): MetricBundle {
  if (week === null) {
    return bundle;
  }
  const weekly = bundle.weekly[week - 1];
  return {
    ...bundle,
    played: weekly.played,
    totalPlays: weekly.totalPlays,
  };
}

function generateInstitution(
  districtName: string,
  talukaName: string,
  type: "school" | "college",
  index: number,
): Institution {
  const seedKey = `${districtName}-${talukaName}-${type}-${index}`;
  const seed = hashCode(seedKey);
  const total =
    type === "school"
      ? pickInRange(seed, 480, 1750)
      : pickInRange(seed, 260, 1120);
  const registrationRate =
    (type === "school" ? 0.42 : 0.46) + (seed % 17) / 100;
  const registered = Math.min(total, Math.round(total * registrationRate));
  const playedRate = 0.49 + ((seed >> 2) % 24) / 100;
  const played = Math.min(registered, Math.round(registered * playedRate));
  const repeatFactor = 1.08 + ((seed >> 3) % 85) / 100;
  const totalPlays = Math.max(played, Math.round(played * repeatFactor));
  const prefix = type === "school" ? "School" : "College";
  const countLabel = String(index + 1).padStart(2, "0");

  return {
    id: slugify(`${seedKey}`),
    slug: slugify(`${prefix}-${talukaName}-${countLabel}`),
    name: `${talukaName} ${prefix} ${countLabel}`,
    type,
    categoryLabel: type === "school" ? "School Student" : "College Student",
    metrics: {
      total,
      registered,
      played,
      totalPlays,
      weekly: makeWeeklyStats(played, totalPlays, seedKey),
    },
  };
}

function generateCitizenMetrics(districtName: string, talukaName: string): MetricBundle {
  const seedKey = `${districtName}-${talukaName}-citizen`;
  const seed = hashCode(seedKey);
  const total = pickInRange(seed, 3400, 21800);
  const registeredBase = total;
  const registered = Math.round(registeredBase * (0.19 + ((seed >> 1) % 18) / 100));
  const played = Math.min(
    registered,
    Math.round(registered * (0.43 + ((seed >> 3) % 28) / 100)),
  );
  const totalPlays = Math.max(played, Math.round(played * (1.14 + ((seed >> 4) % 94) / 100)));

  return {
    total,
    registered,
    played,
    totalPlays,
    weekly: makeWeeklyStats(played, totalPlays, seedKey),
  };
}

function generateTaluka(districtName: string, talukaName: string): Taluka {
  const seed = hashCode(`${districtName}-${talukaName}`);
  const schoolCount = pickInRange(seed, 4, 9);
  const collegeCount = pickInRange(seed >> 2, 1, 4);
  const schools = Array.from({ length: schoolCount }, (_, index) =>
    generateInstitution(districtName, talukaName, "school", index),
  );
  const colleges = Array.from({ length: collegeCount }, (_, index) =>
    generateInstitution(districtName, talukaName, "college", index),
  );
  const institutions = [...schools, ...colleges];

  return {
    id: slugify(`${districtName}-${talukaName}`),
    slug: slugify(talukaName),
    name: talukaName,
    institutions,
    metrics: {
      school: addMetricBundles(schools.map((institution) => institution.metrics)),
      college: addMetricBundles(colleges.map((institution) => institution.metrics)),
      citizen: generateCitizenMetrics(districtName, talukaName),
    },
  };
}

function generateDistrict(data: (typeof DISTRICT_BLUEPRINTS)[number]): District {
  return {
    id: slugify(data.district),
    slug: slugify(data.district),
    name: data.district,
    talukas: data.talukas.map((taluka) => generateTaluka(data.district, taluka)),
  };
}

export const districts: District[] = DISTRICT_BLUEPRINTS.map(generateDistrict);

function allMetricsForTaluka(taluka: Taluka) {
  return addMetricBundles([
    taluka.metrics.school,
    taluka.metrics.college,
    taluka.metrics.citizen,
  ]);
}

function allMetricsForDistrict(district: District) {
  return addMetricBundles(district.talukas.map(allMetricsForTaluka));
}

function allMetricsForState() {
  return addMetricBundles(districts.map(allMetricsForDistrict));
}

function getCategoryBundleForTaluka(taluka: Taluka, category: Category): MetricBundle {
  if (category === "all") {
    return allMetricsForTaluka(taluka);
  }
  return taluka.metrics[category];
}

function getCategoryBundleForDistrict(district: District, category: Category): MetricBundle {
  const bundles = district.talukas.map((taluka) => getCategoryBundleForTaluka(taluka, category));
  return addMetricBundles(bundles);
}

export function getDistrictBySlug(slug: string) {
  return districts.find((district) => district.slug === slug);
}

export function getTalukaBySlug(districtSlug: string, talukaSlug: string) {
  const district = getDistrictBySlug(districtSlug);
  if (!district) {
    return undefined;
  }
  return district.talukas.find((taluka) => taluka.slug === talukaSlug);
}

export function getWeekLabel(week: number | null) {
  return week === null ? "All weeks" : `Week ${week}`;
}

export function formatCompactNumber(value: number | null) {
  if (value === null) {
    return "—";
  }
  return new Intl.NumberFormat("en-IN", {
    notation: value >= 100000 ? "compact" : "standard",
    maximumFractionDigits: value >= 100000 ? 1 : 0,
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "—";
  }
  return `${Math.round(value * 100)}%`;
}

export function buildStateDashboard(): DashboardEntity {
  const stateMetrics = allMetricsForState();
  return {
    id: "gujarat",
    slug: "gujarat",
    kind: "state",
    name: "Gujarat",
    header: summarizeMetrics(stateMetrics),
    headerWeekly: stateMetrics.weekly,
    headerBundles: {
      all: stateMetrics,
      school: addMetricBundles(districts.map((district) => getCategoryBundleForDistrict(district, "school"))),
      college: addMetricBundles(districts.map((district) => getCategoryBundleForDistrict(district, "college"))),
      citizen: addMetricBundles(districts.map((district) => getCategoryBundleForDistrict(district, "citizen"))),
    },
    children: districts.map((district) => {
      const allMetrics = allMetricsForDistrict(district);
      return {
      id: district.id,
      slug: district.slug,
      name: district.name,
      kind: "district",
      category: "all",
      categoryLabel: "All participants",
      metrics: summarizeMetrics(allMetrics),
      weekly: allMetrics.weekly,
      bundles: {
        all: allMetrics,
        school: getCategoryBundleForDistrict(district, "school"),
        college: getCategoryBundleForDistrict(district, "college"),
        citizen: getCategoryBundleForDistrict(district, "citizen"),
      },
      href: `/district/${district.slug}`,
      };
    }),
    switcherOptions: [],
  };
}

export function buildDistrictDashboard(districtSlug: string): DashboardEntity | null {
  const district = getDistrictBySlug(districtSlug);
  if (!district) {
    return null;
  }
  const districtMetrics = allMetricsForDistrict(district);

  return {
    id: district.id,
    slug: district.slug,
    kind: "district",
    name: district.name,
    parentName: "Gujarat",
    header: summarizeMetrics(districtMetrics),
    headerWeekly: districtMetrics.weekly,
    headerBundles: {
      all: districtMetrics,
      school: getCategoryBundleForDistrict(district, "school"),
      college: getCategoryBundleForDistrict(district, "college"),
      citizen: getCategoryBundleForDistrict(district, "citizen"),
    },
    children: district.talukas.map((taluka) => {
      const allMetrics = allMetricsForTaluka(taluka);
      return {
      id: taluka.id,
      slug: taluka.slug,
      name: taluka.name,
      kind: "taluka",
      category: "all",
      categoryLabel: "All participants",
      metrics: summarizeMetrics(allMetrics),
      weekly: allMetrics.weekly,
      bundles: {
        all: allMetrics,
        school: taluka.metrics.school,
        college: taluka.metrics.college,
        citizen: taluka.metrics.citizen,
      },
      href: `/district/${district.slug}/taluka/${taluka.slug}`,
      };
    }),
    switcherOptions: districts.map((option) => ({
      label: option.name,
      href: `/district/${option.slug}`,
      selected: option.slug === district.slug,
    })),
  };
}

export function buildTalukaDashboard(
  districtSlug: string,
  talukaSlug: string,
): DashboardEntity | null {
  const district = getDistrictBySlug(districtSlug);
  const taluka = getTalukaBySlug(districtSlug, talukaSlug);
  if (!district || !taluka) {
    return null;
  }

  return {
    id: taluka.id,
    slug: taluka.slug,
    kind: "taluka",
    name: taluka.name,
    parentName: district.name,
    header: summarizeMetrics(allMetricsForTaluka(taluka)),
    headerWeekly: allMetricsForTaluka(taluka).weekly,
    headerBundles: {
      all: allMetricsForTaluka(taluka),
      school: taluka.metrics.school,
      college: taluka.metrics.college,
      citizen: taluka.metrics.citizen,
    },
    children: taluka.institutions.map((institution) => ({
      id: institution.id,
      slug: institution.slug,
      name: institution.name,
      kind: "institution",
      category: institution.type,
      categoryLabel: institution.categoryLabel,
      metrics: summarizeMetrics(institution.metrics),
      weekly: institution.metrics.weekly,
      bundles: {
        all: institution.metrics,
        [institution.type]: institution.metrics,
      },
    })),
    switcherOptions: district.talukas.map((option) => ({
      label: option.name,
      href: `/district/${district.slug}/taluka/${option.slug}`,
      selected: option.slug === taluka.slug,
    })),
    citizenEmptyState: {
      title: "Citizen participation is tracked at taluka level",
      description:
        "Citizens are not attached to schools or colleges, so this view keeps the taluka-wide citizen numbers in the header while the institution list steps aside.",
    },
  };
}

export function metricsForRow(
  row: ChildRow,
  category: Category,
  week: number | null,
): SummaryMetrics {
  const bundle = row.bundles[category] ?? row.bundles.all;
  if (!bundle) {
    return summarizeMetrics({
      total: null,
      registered: 0,
      played: 0,
      totalPlays: 0,
      weekly: Array.from({ length: 8 }, () => ({ played: 0, totalPlays: 0 })),
    });
  }

  return summarizeMetrics(bundleForWeek(bundle, week));
}

export function institutionRowsForCategory(rows: ChildRow[], category: Category) {
  if (category === "all") {
    return rows;
  }
  return rows.filter((row) => row.kind !== "institution" || row.category === category);
}
