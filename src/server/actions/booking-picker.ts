"use server";

import { getSession } from "@/lib/session";
import { createBooking, type BookingActionResult } from "./bookings";
import type { CreateBookingInput } from "@/lib/validations/bookings";

export async function confirmCourtBooking(
  input: CreateBookingInput,
): Promise<BookingActionResult & { requiresLogin?: boolean }> {
  // Avoid losing the club callback when a session expires while the picker is open.
  if (!(await getSession()))
    return { ok: false, error: "Prijavi se da rezervišeš termin.", requiresLogin: true };
  return createBooking(input);
}
