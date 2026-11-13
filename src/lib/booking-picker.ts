import { BOOKING_WINDOW_DAYS } from "./booking-rules";
import { todayInBelgrade, TIME_ZONE } from "./time";
import type { Slot } from "./availability";

export type PickerSlot = Omit<Slot, "startsAt" | "endsAt"> & { startsAt: string; endsAt: string };
export type PickerAvailability = { ok: true; slots: PickerSlot[] } | { ok: false; error: string };

export function bookingDateRange(now = new Date()) {
  const min = todayInBelgrade(now);
  const last = new Date(`${min}T12:00:00Z`);
  last.setUTCDate(last.getUTCDate() + BOOKING_WINDOW_DAYS);
  return { min, max: last.toISOString().slice(0, 10) };
}

export function formatBookingDate(date: string) {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

export function clubLoginUrl(slug: string) {
  return `/login?${new URLSearchParams({ callbackUrl: `/klub/${encodeURIComponent(slug)}` })}`;
}
