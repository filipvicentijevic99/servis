import { z } from "zod";

export const createBookingSchema = z.object({
  courtId: z.string().min(1, "Izaberi teren."),
  // ISO string or Date of the slot start, as returned by getAvailableSlots.
  startsAt: z.coerce.date({ error: "Izaberi termin." }),
});

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
});

export type CreateBookingInput = z.input<typeof createBookingSchema>;
export type CancelBookingInput = z.input<typeof cancelBookingSchema>;
