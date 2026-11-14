import type { BookingEmailData } from "../_components/booking-email";

/** Preview data only. The reusable template never supplies fallback booking data. */
export const previewBooking = {
  clubName: "Ada Tennis Club",
  courtName: "Teren 2 · Šljaka",
  startsAt: new Date("2026-11-21T16:00:00Z"),
  endsAt: new Date("2026-11-21T17:00:00Z"),
  totalPrice: 2400,
  bookingUrl: "http://localhost:3000/igrac/rezervacije",
} satisfies BookingEmailData;
