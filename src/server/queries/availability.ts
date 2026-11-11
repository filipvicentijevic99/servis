import "server-only";
import prisma from "@/lib/prisma";
import { buildSlots, type Slot } from "@/lib/availability";
import { belgradeToUtc, dayOfWeek, isValidDate } from "@/lib/time";

export type AvailabilityResult =
  { ok: true; date: string; slots: Slot[] } | { ok: false; error: string };

/**
 * Slots of one court on one local date ("YYYY-MM-DD", Belgrade time), each marked
 * available, booked or past. Used by the slot picker on the club page.
 */
export async function getAvailableSlots(
  courtId: string,
  date: string,
  now: Date = new Date(),
): Promise<AvailabilityResult> {
  if (!isValidDate(date)) return { ok: false, error: "Neispravan datum." };

  const court = await prisma.court.findUnique({
    where: { id: courtId },
    select: {
      isActive: true,
      club: {
        select: {
          openingHours: {
            where: { dayOfWeek: dayOfWeek(date) },
            select: { openTime: true, closeTime: true },
          },
        },
      },
    },
  });
  if (!court || !court.isActive) return { ok: false, error: "Teren ne postoji." };

  const dayStart = belgradeToUtc(date, 0);
  const dayEnd = belgradeToUtc(date, 24 * 60);
  const bookings = await prisma.booking.findMany({
    where: {
      courtId,
      status: "CONFIRMED",
      startsAt: { lt: dayEnd },
      endsAt: { gt: dayStart },
    },
    select: { startsAt: true, endsAt: true },
  });

  const slots = buildSlots({
    date,
    openingHours: court.club.openingHours[0] ?? null,
    bookings,
    now,
  });
  return { ok: true, date, slots };
}
