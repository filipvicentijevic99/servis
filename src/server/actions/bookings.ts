"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { buildSlots } from "@/lib/availability";
import { canCancel, isWithinBookingWindow } from "@/lib/booking-rules";
import { belgradeToUtc, dayOfWeek, todayInBelgrade } from "@/lib/time";
import {
  cancelBookingSchema,
  createBookingSchema,
  type CancelBookingInput,
  type CreateBookingInput,
} from "@/lib/validations/bookings";

export type BookingActionResult =
  | { ok: true; bookingId: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

const SLOT_TAKEN = "Termin je upravo zauzet. Izaberi drugi.";

/** Thrown inside the transaction when the slot is no longer free. */
class SlotTakenError extends Error {}

/**
 * Books a 1-hour slot for the signed-in user.
 *
 * Checks: the court is active, the date is within the booking window, and the slot
 * exists in the club's opening hours and is still available. The insert runs in a
 * transaction, and the Booking_no_overlap constraint in the database is the final
 * guard when two people book the same slot at the same moment.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingActionResult> {
  const user = await requireUser();

  const parsed = createBookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Proveri izabrani termin.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { courtId, startsAt } = parsed.data;
  const now = new Date();

  // The local Belgrade date of the slot, e.g. "2026-11-12".
  const date = todayInBelgrade(startsAt);
  if (!isWithinBookingWindow(date, todayInBelgrade(now))) {
    return { ok: false, error: "Termin možeš rezervisati najviše 14 dana unapred." };
  }

  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: {
      isActive: true,
      pricePerHour: true,
      club: {
        select: {
          slug: true,
          openingHours: {
            where: { dayOfWeek: dayOfWeek(date) },
            select: { openTime: true, closeTime: true },
          },
        },
      },
    },
  });
  if (!court || !court.isActive) return { ok: false, error: "Teren ne postoji." };

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const bookings = await tx.booking.findMany({
        where: {
          courtId,
          status: "CONFIRMED",
          startsAt: { lt: belgradeToUtc(date, 24 * 60) },
          endsAt: { gt: belgradeToUtc(date, 0) },
        },
        select: { startsAt: true, endsAt: true },
      });

      const slot = buildSlots({
        date,
        openingHours: court.club.openingHours[0] ?? null,
        bookings,
        now,
      }).find((s) => s.startsAt.getTime() === startsAt.getTime());

      if (!slot) throw new Error("NOT_A_SLOT");
      if (slot.status !== "available") throw new SlotTakenError();

      return tx.booking.create({
        data: {
          courtId,
          userId: user.id,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          totalPrice: court.pricePerHour,
        },
        select: { id: true },
      });
    });

    revalidatePath("/igrac/rezervacije");
    revalidatePath(`/klub/${court.club.slug}`);
    return { ok: true, bookingId: booking.id };
  } catch (error) {
    if (error instanceof SlotTakenError) return { ok: false, error: SLOT_TAKEN };
    if (error instanceof Error && error.message === "NOT_A_SLOT") {
      return { ok: false, error: "Klub ne radi u tom terminu." };
    }
    // Booking_no_overlap: someone booked the same slot a moment earlier.
    if (/Booking_no_overlap|23P01|exclusion constraint/i.test(String(error))) {
      return { ok: false, error: SLOT_TAKEN };
    }
    console.error(error);
    return { ok: false, error: "Rezervacija nije uspela. Pokušaj ponovo." };
  }
}

/** Cancels the signed-in user's booking, if it starts in 24 hours or more. */
export async function cancelBooking(input: CancelBookingInput): Promise<BookingActionResult> {
  const user = await requireUser();

  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Rezervacija ne postoji." };
  const { bookingId } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      userId: true,
      status: true,
      startsAt: true,
      court: { select: { club: { select: { slug: true } } } },
    },
  });
  // Same message for "doesn't exist" and "not yours", so ids can't be probed.
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Rezervacija ne postoji." };
  }
  if (booking.status === "CANCELLED") return { ok: false, error: "Rezervacija je već otkazana." };
  if (!canCancel(booking)) {
    return { ok: false, error: "Rezervaciju možeš otkazati najkasnije 24 sata pre termina." };
  }

  await prisma.$transaction([
    // An open match on a cancelled booking makes no sense, so it goes too.
    prisma.openMatch.deleteMany({ where: { bookingId } }),
    prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } }),
  ]);

  revalidatePath("/igrac/rezervacije");
  revalidatePath(`/klub/${booking.court.club.slug}`);
  return { ok: true, bookingId };
}
