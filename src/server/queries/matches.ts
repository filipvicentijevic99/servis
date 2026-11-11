import "server-only";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { joinBlocker, matchCapacity, type MatchType, type SkillLevel } from "@/lib/matches";
import type { Surface } from "@/lib/surfaces";
import { belgradeToUtc } from "@/lib/time";
import type { Prisma } from "@/generated/prisma/client";
import type { MatchFilters } from "@/lib/validations/matches";

export type OpenMatchItem = {
  id: string;
  type: MatchType;
  level: SkillLevel;
  note: string | null;
  startsAt: Date;
  endsAt: Date;
  club: { name: string; slug: string; city: string };
  court: { name: string; surface: Surface };
  organizer: { id: string; name: string; image: string | null };
  players: { id: string; name: string; image: string | null }[];
  capacity: number;
  spotsLeft: number;
  /** The signed-in user's relation to this match (false when signed out). */
  isOrganizer: boolean;
  isJoined: boolean;
  canJoin: boolean;
};

const MAX_RESULTS = 100;

/**
 * Upcoming open matches with free spots, soonest first, for /mecevi.
 * Full matches are left out.
 */
export async function getOpenMatches(
  filters: MatchFilters = {},
  now: Date = new Date(),
): Promise<OpenMatchItem[]> {
  const session = await getSession();
  const userId = session?.user.id ?? null;

  const startsAt: Prisma.DateTimeFilter = { gt: now };
  if (filters.date) {
    startsAt.gte = belgradeToUtc(filters.date, 0);
    startsAt.lt = belgradeToUtc(filters.date, 24 * 60);
  }

  const matches = await prisma.openMatch.findMany({
    where: {
      ...(filters.type && { type: filters.type }),
      ...(filters.level && { level: filters.level }),
      booking: {
        status: "CONFIRMED",
        startsAt,
        ...(filters.city && {
          court: { club: { city: { equals: filters.city, mode: "insensitive" } } },
        }),
      },
    },
    orderBy: { booking: { startsAt: "asc" } },
    take: MAX_RESULTS,
    select: {
      id: true,
      type: true,
      level: true,
      note: true,
      booking: {
        select: {
          startsAt: true,
          endsAt: true,
          status: true,
          user: { select: { id: true, name: true, image: true } },
          court: {
            select: {
              name: true,
              surface: true,
              club: { select: { name: true, slug: true, city: true } },
            },
          },
        },
      },
      participants: {
        orderBy: { joinedAt: "asc" },
        select: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return matches
    .map((m): OpenMatchItem => {
      const players = m.participants.map((p) => p.user);
      const playerIds = players.map((p) => p.id);
      const capacity = matchCapacity(m.type);
      return {
        id: m.id,
        type: m.type,
        level: m.level,
        note: m.note,
        startsAt: m.booking.startsAt,
        endsAt: m.booking.endsAt,
        club: m.booking.court.club,
        court: { name: m.booking.court.name, surface: m.booking.court.surface },
        organizer: m.booking.user,
        players,
        capacity,
        spotsLeft: Math.max(0, capacity - players.length),
        isOrganizer: userId === m.booking.user.id,
        isJoined: userId !== null && playerIds.includes(userId),
        canJoin:
          userId !== null &&
          joinBlocker(
            {
              type: m.type,
              bookingStatus: m.booking.status,
              startsAt: m.booking.startsAt,
              organizerId: m.booking.user.id,
              participantIds: playerIds,
            },
            userId,
            now,
          ) === null,
      };
    })
    .filter((m) => m.spotsLeft > 0);
}
