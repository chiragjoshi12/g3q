export const PLATFORM_WEEKS = [
  {
    id: 1,
    key: "week-1",
    start_date: "2026-09-01",
    end_date: "2026-09-07",
    name: "Week 1",
    description: "Platform launch week for taluka leaderboard play.",
  },
  {
    id: 2,
    key: "week-2",
    start_date: "2026-09-08",
    end_date: "2026-09-14",
    name: "Week 2",
    description: "Second competition week across school, college, and citizen categories.",
  },
  {
    id: 3,
    key: "week-3",
    start_date: "2026-09-15",
    end_date: "2026-09-21",
    name: "Week 3",
    description: "Mid-campaign leaderboard and participation push.",
  },
  {
    id: 4,
    key: "week-4",
    start_date: "2026-09-22",
    end_date: "2026-09-28",
    name: "Week 4",
    description: "Penultimate week for taluka-wise competition.",
  },
  {
    id: 5,
    key: "week-5",
    start_date: "2026-09-29",
    end_date: "2026-10-05",
    name: "Week 5",
    description: "Final active week for the current platform cycle.",
  },
];

function istDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getActivePlatformWeek(date = new Date()) {
  const today = istDateKey(date);
  return (
    PLATFORM_WEEKS.find((week) => week.start_date <= today && today <= week.end_date) ??
    PLATFORM_WEEKS[PLATFORM_WEEKS.length - 1]
  );
}
