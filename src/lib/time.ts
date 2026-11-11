// Time zone helpers for Europe/Belgrade, built on Intl (no extra dependencies).
// Dates are stored in UTC; opening hours and slots are defined in local Belgrade time.

export const TIME_ZONE = "Europe/Belgrade";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-4]):([0-5]\d)$/;

/** True for a real calendar date in "YYYY-MM-DD" format. */
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const check = new Date(Date.UTC(y, m - 1, d));
  return check.getUTCFullYear() === y && check.getUTCMonth() === m - 1 && check.getUTCDate() === d;
}

/** "08:30" -> minutes since midnight (510). "24:00" and "00:00" as a closing time mean midnight. */
export function parseTime(time: string): number {
  const match = TIME_RE.exec(time);
  if (!match) throw new Error(`Invalid time: ${time}`);
  return Number(match[1]) * 60 + Number(match[2]);
}

/** 0 = Sunday ... 6 = Saturday, for a "YYYY-MM-DD" date (same convention as OpeningHours.dayOfWeek). */
export function dayOfWeek(date: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Offset of Belgrade time from UTC at a given instant, in ms (+1 h in winter, +2 h in summer). */
function offsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return asUtc - Math.floor(instant / 60_000) * 60_000;
}

/**
 * The UTC instant of a local Belgrade date and time.
 * `minutes` is minutes since local midnight and may be 1440 (the next midnight).
 * Correct across daylight saving changes.
 */
export function belgradeToUtc(date: string, minutes: number): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const naive = Date.UTC(y, m - 1, d, 0, minutes);
  const first = naive - offsetMs(naive);
  return new Date(naive - offsetMs(first));
}

/** Today's date in Belgrade as "YYYY-MM-DD". */
export function todayInBelgrade(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

/** "HH:mm" in Belgrade time for an instant. */
export function formatBelgradeTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}
