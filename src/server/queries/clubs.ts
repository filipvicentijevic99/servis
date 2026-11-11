import "server-only";
import { cache } from "react";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { Surface } from "@/lib/surfaces";
import { CLUBS_PAGE_SIZE, type ClubFilters } from "@/lib/validations/clubs";

// Read-only queries for clubs. Call them directly from Server Components:
//   const filters = parseClubFilters(await searchParams);
//   const result = await getClubs(filters);
// They are not server actions: actions are for mutations (bookings, edits).

export type ClubListItem = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  image: string | null;
  surfaces: Surface[];
  indoor: boolean;
  courtCount: number;
  /** Cheapest active court, RSD per hour. Null if the club has no active courts. */
  minPrice: number | null;
};

export type ClubListResult = {
  items: ClubListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function buildWhere({ city, surface, maxPrice }: ClubFilters): Prisma.ClubWhereInput {
  const where: Prisma.ClubWhereInput = {};
  if (city) where.city = { equals: city, mode: "insensitive" };
  // Surface and price must match the same court: "a clay court under 2000 RSD".
  if (surface || maxPrice) {
    where.courts = {
      some: {
        isActive: true,
        ...(surface && { surface }),
        ...(maxPrice && { pricePerHour: { lte: maxPrice } }),
      },
    };
  }
  return where;
}

/** Club list with filters and pagination, for /klubovi. */
export async function getClubs(filters: ClubFilters): Promise<ClubListResult> {
  const where = buildWhere(filters);
  const pageSize = CLUBS_PAGE_SIZE;

  const [total, clubs] = await prisma.$transaction([
    prisma.club.count({ where }),
    prisma.club.findMany({
      where,
      orderBy: [{ city: "asc" }, { name: "asc" }],
      skip: (filters.page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        address: true,
        images: true,
        courts: {
          where: { isActive: true },
          select: { surface: true, indoor: true, pricePerHour: true },
        },
      },
    }),
  ]);

  const items = clubs.map((club): ClubListItem => {
    const prices = club.courts.map((court) => court.pricePerHour);
    return {
      id: club.id,
      slug: club.slug,
      name: club.name,
      city: club.city,
      address: club.address,
      image: club.images[0] ?? null,
      surfaces: [...new Set(club.courts.map((court) => court.surface))],
      indoor: club.courts.some((court) => court.indoor),
      courtCount: club.courts.length,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  return {
    items,
    total,
    page: filters.page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Cities that have at least one club, for the city filter. */
export async function getClubCities(): Promise<string[]> {
  const rows = await prisma.club.findMany({
    distinct: ["city"],
    select: { city: true },
    orderBy: { city: "asc" },
  });
  return rows.map((row) => row.city);
}

/**
 * One club with its active courts and opening hours, for /klub/[slug].
 * Returns null when the club doesn't exist; the page should call notFound().
 * Wrapped in cache() so generateMetadata and the page share one query.
 */
export const getClub = cache(async (slug: string) => {
  return prisma.club.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      city: true,
      address: true,
      phone: true,
      images: true,
      courts: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, surface: true, indoor: true, pricePerHour: true },
      },
      openingHours: {
        orderBy: { dayOfWeek: "asc" },
        select: { dayOfWeek: true, openTime: true, closeTime: true },
      },
    },
  });
});

export type ClubDetails = NonNullable<Awaited<ReturnType<typeof getClub>>>;
