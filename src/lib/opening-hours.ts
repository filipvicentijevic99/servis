import { parseTime } from "./time";

// Opening hours helpers shared by the dashboard form, its validation and the queries.

/** Days in the order shown in the UI: Monday first. Values are OpeningHours.dayOfWeek (0 = Sunday). */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

export type DayHours = {
  dayOfWeek: number;
  closed: boolean;
  openTime: string;
  closeTime: string;
};

const DEFAULT_OPEN = "08:00";
const DEFAULT_CLOSE = "22:00";

/** Turns database rows (one per open day) into a full Monday–Sunday week; missing days are closed. */
export function toWeek(
  rows: { dayOfWeek: number; openTime: string; closeTime: string }[],
): DayHours[] {
  return WEEK_ORDER.map((dayOfWeek) => {
    const row = rows.find((r) => r.dayOfWeek === dayOfWeek);
    return row
      ? { dayOfWeek, closed: false, openTime: row.openTime, closeTime: row.closeTime }
      : { dayOfWeek, closed: true, openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE };
  });
}

/** Minutes for a closing time, where "00:00" means midnight at the end of the day. */
export function closingMinutes(closeTime: string): number {
  const minutes = parseTime(closeTime);
  return minutes === 0 ? 24 * 60 : minutes;
}

/** True if the club is open at least one full hour between the two times. */
export function isValidOpeningWindow(openTime: string, closeTime: string): boolean {
  try {
    return closingMinutes(closeTime) - parseTime(openTime) >= 60;
  } catch {
    return false;
  }
}
