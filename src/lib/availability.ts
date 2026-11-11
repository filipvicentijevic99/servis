import { belgradeToUtc, formatBelgradeTime, parseTime } from "./time";

// Pure slot logic: no database, no clock. Everything it needs is passed in,
// which makes it easy to unit test (see availability.test.ts).

export const SLOT_MINUTES = 60;

export type SlotStatus = "available" | "booked" | "past";

export type Slot = {
  startsAt: Date;
  endsAt: Date;
  /** Local start time for the UI, e.g. "08:00". */
  label: string;
  status: SlotStatus;
};

export type OpeningWindow = { openTime: string; closeTime: string };
export type BookedInterval = { startsAt: Date; endsAt: Date };

/**
 * All 1-hour slots of a court on a given local date.
 *
 * - Slots start at the opening time and must end by the closing time.
 * - A slot that overlaps a booking is "booked" (half-open intervals: 9–10 and 10–11 don't overlap).
 * - A slot that has already started is "past" (booked takes precedence).
 * - No opening hours for that day (`null`) means the club is closed: no slots.
 */
export function buildSlots({
  date,
  openingHours,
  bookings,
  now,
}: {
  date: string;
  openingHours: OpeningWindow | null;
  bookings: BookedInterval[];
  now: Date;
}): Slot[] {
  if (!openingHours) return [];

  const open = parseTime(openingHours.openTime);
  let close = parseTime(openingHours.closeTime);
  if (close === 0) close = 24 * 60; // "00:00" as closing time means midnight
  if (close <= open) return [];

  const slots: Slot[] = [];
  for (let start = open; start + SLOT_MINUTES <= close; start += SLOT_MINUTES) {
    const startsAt = belgradeToUtc(date, start);
    const endsAt = belgradeToUtc(date, start + SLOT_MINUTES);

    const booked = bookings.some((b) => startsAt < b.endsAt && b.startsAt < endsAt);
    const past = startsAt <= now;

    slots.push({
      startsAt,
      endsAt,
      label: formatBelgradeTime(startsAt),
      status: booked ? "booked" : past ? "past" : "available",
    });
  }
  return slots;
}
