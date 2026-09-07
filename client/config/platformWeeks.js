export const PLATFORM_WEEKS = [
  {
    id: 1,
    key: "week-1",
    start_date: "2026-09-06",
    end_date: "2026-09-12",
    name: "Week 1",
    description: "Platform launch week for taluka leaderboard play.",
  },
  {
    id: 2,
    key: "week-2",
    start_date: "2026-09-13",
    end_date: "2026-09-19",
    name: "Week 2",
    description: "Second competition week across school, college, and citizen categories.",
  },
  {
    id: 3,
    key: "week-3",
    start_date: "2026-09-20",
    end_date: "2026-09-26",
    name: "Week 3",
    description: "Mid-campaign leaderboard and participation push.",
  },
  {
    id: 4,
    key: "week-4",
    start_date: "2026-09-27",
    end_date: "2026-10-03",
    name: "Week 4",
    description: "Penultimate week for taluka-wise competition.",
  },
  {
    id: 5,
    key: "week-5",
    start_date: "2026-10-04",
    end_date: "2026-10-10",
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
