import "server-only";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { canCancel } from "@/lib/booking-rules";
import type { Surface } from "@/lib/surfaces";

export type MyBooking = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  status: "CONFIRMED" | "CANCELLED";
  totalPrice: number;
  canCancel: boolean;
  hasOpenMatch: boolean;
  court: { id: string; name: string; surface: Surface };
  club: { name: string; slug: string; city: string; address: string };
};

const PAST_LIMIT = 50;

/**
 * The signed-in user's bookings for /igrac/rezervacije.
 * Upcoming: confirmed and not finished yet, soonest first.
 * Past: finished or cancelled, newest first (last 50).
 */
export async function getMyBookings(now: Date = new Date()) {
  const user = await requireUser("/igrac/rezervacije");

  const select = {
    id: true,
    startsAt: true,
    endsAt: true,
    status: true,
    totalPrice: true,
    openMatch: { select: { id: true } },
    court: {
      select: {
        id: true,
        name: true,
        surface: true,
        club: { select: { name: true, slug: true, city: true, address: true } },
      },
    },
  } as const;

  const [upcoming, past] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id, status: "CONFIRMED", endsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
      select,
    }),
    prisma.booking.findMany({
      where: {
        userId: user.id,
        OR: [{ status: "CANCELLED" }, { endsAt: { lte: now } }],
      },
      orderBy: { startsAt: "desc" },
      take: PAST_LIMIT,
      select,
    }),
  ]);

  const toMyBooking = (b: (typeof upcoming)[number]): MyBooking => ({
    id: b.id,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    status: b.status,
    totalPrice: b.totalPrice,
    canCancel: canCancel(b, now),
    hasOpenMatch: b.openMatch !== null,
    court: { id: b.court.id, name: b.court.name, surface: b.court.surface },
    club: b.court.club,
  });

  return { upcoming: upcoming.map(toMyBooking), past: past.map(toMyBooking) };
}
