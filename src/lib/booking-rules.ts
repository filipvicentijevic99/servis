// Booking rules as pure functions, shared by server actions, queries and the UI.

/** How many days ahead a slot can be booked (today + 14 days). */
export const BOOKING_WINDOW_DAYS = 14;

/** A booking can be cancelled up to this many hours before it starts. */
export const CANCELLATION_DEADLINE_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** True if `date` ("YYYY-MM-DD") is between `today` and today + BOOKING_WINDOW_DAYS. */
export function isWithinBookingWindow(date: string, today: string): boolean {
  const diffDays = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / DAY_MS;
  return diffDays >= 0 && diffDays <= BOOKING_WINDOW_DAYS;
}

/** True if a confirmed booking can still be cancelled at `now`. */
export function canCancel(
  booking: { status: string; startsAt: Date },
  now: Date = new Date(),
): boolean {
  return (
    booking.status === "CONFIRMED" &&
    booking.startsAt.getTime() - now.getTime() >= CANCELLATION_DEADLINE_HOURS * HOUR_MS
  );
}
