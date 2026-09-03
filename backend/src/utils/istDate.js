/** Calendar helpers in Asia/Kolkata — review quotas are “questions/day” in IST. */

const TZ = 'Asia/Kolkata';

export const IST_TIMEZONE = TZ;

export function istTodayYmd(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Prisma DATE column value for an IST calendar day (midnight UTC of that YMD). */
export function istDateValue(ymd = istTodayYmd()) {
  return new Date(`${ymd}T00:00:00.000Z`);
}

export function istDayBounds(ymd = istTodayYmd()) {
  const start = new Date(`${ymd}T00:00:00+05:30`);
  const end = new Date(`${ymd}T23:59:59.999+05:30`);
  return { start, end, ymd };
}

export function addIstDays(ymd, delta) {
  const d = new Date(`${ymd}T12:00:00+05:30`);
  d.setTime(d.getTime() + delta * 86_400_000);
  return istTodayYmd(d);
}

export function ymdFromDate(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function recentIstDays(count = 7, fromYmd = istTodayYmd()) {
  const days = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    days.push(addIstDays(fromYmd, -i));
  }
  return days;
}

/** Inclusive IST calendar days from startYmd through endYmd. */
export function istDaysInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd || startYmd > endYmd) return [];
  const days = [];
  let cursor = startYmd;
  while (cursor <= endYmd) {
    days.push(cursor);
    cursor = addIstDays(cursor, 1);
    if (days.length > 366) break;
  }
  return days;
}
