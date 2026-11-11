import "server-only";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { toWeek } from "@/lib/opening-hours";
import { belgradeToUtc, isValidDate, todayInBelgrade } from "@/lib/time";

// Read-only data for the club owner dashboard. Every query is scoped to the signed-in owner.

/** The owner's clubs, for the club switcher. */
export async function getOwnerClubs() {
  const owner = await requireRole("CLUB_OWNER", "/dashboard");
  return prisma.club.findMany({
    where: { ownerId: owner.id },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      _count: { select: { courts: true } },
    },
  });
}

/**
 * One of the owner's clubs with all courts (inactive too) and the full week of opening hours.
 * Returns null if the club doesn't exist or belongs to someone else.
 */
export async function getOwnerClub(clubId: string) {
  const owner = await requireRole("CLUB_OWNER", "/dashboard");
  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId: owner.id },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      address: true,
      courts: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          surface: true,
          indoor: true,
          pricePerHour: true,
          isActive: true,
          _count: { select: { bookings: true } },
        },
      },
      openingHours: { select: { dayOfWeek: true, openTime: true, closeTime: true } },
    },
  });
  if (!club) return null;

  return {
    ...club,
    courts: club.courts.map(({ _count, ...court }) => ({
      ...court,
      // Courts that were ever booked can only be deactivated, not deleted.
      canDelete: _count.bookings === 0,
    })),
    week: toWeek(club.openingHours),
  };
}

export type OwnerClub = NonNullable<Awaited<ReturnType<typeof getOwnerClub>>>;

/** All bookings of one club on one local date ("YYYY-MM-DD"), in time order. */
export async function getClubBookingsForDay(clubId: string, date: string = todayInBelgrade()) {
  const owner = await requireRole("CLUB_OWNER", "/dashboard");
  if (!isValidDate(date)) return [];

  return prisma.booking.findMany({
    where: {
      court: { clubId, club: { ownerId: owner.id } },
      startsAt: { gte: belgradeToUtc(date, 0), lt: belgradeToUtc(date, 24 * 60) },
    },
    orderBy: [{ startsAt: "asc" }, { court: { name: "asc" } }],
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      status: true,
      totalPrice: true,
      court: { select: { id: true, name: true } },
      user: { select: { name: true, email: true } },
      openMatch: { select: { id: true } },
    },
  });
}
