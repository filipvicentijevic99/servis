import "server-only";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { buildClubStats, statsWindowStart, type ClubStats } from "@/lib/dashboard-stats";
import { belgradeToUtc, todayInBelgrade } from "@/lib/time";

/**
 * Chart data for one of the signed-in owner's clubs: revenue per day (last 30 days),
 * occupancy per court, popular hours and weekdays, and this month's summary.
 * Returns null if the club doesn't exist or belongs to someone else.
 */
export async function getClubStats(
  clubId: string,
  now: Date = new Date(),
): Promise<ClubStats | null> {
  const owner = await requireRole("CLUB_OWNER", "/dashboard");

  const club = await prisma.club.findFirst({
    where: { id: clubId, ownerId: owner.id },
    select: {
      courts: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      },
      openingHours: { select: { dayOfWeek: true, openTime: true, closeTime: true } },
    },
  });
  if (!club) return null;

  const today = todayInBelgrade(now);
  const bookings = await prisma.booking.findMany({
    where: {
      court: { clubId },
      startsAt: {
        gte: belgradeToUtc(statsWindowStart(today), 0),
        lt: belgradeToUtc(today, 24 * 60),
      },
    },
    select: { courtId: true, startsAt: true, endsAt: true, totalPrice: true, status: true },
  });

  return buildClubStats({ bookings, courts: club.courts, openingHours: club.openingHours, now });
}
