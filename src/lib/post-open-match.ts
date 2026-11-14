import type { MyBooking } from "../server/queries/bookings";

export function canPostOpenMatch(
  booking: Pick<MyBooking, "status" | "startsAt" | "hasOpenMatch">,
  now: Date,
) {
  return booking.status === "CONFIRMED" && !booking.hasOpenMatch && booking.startsAt > now;
}
