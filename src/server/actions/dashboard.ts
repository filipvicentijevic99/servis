"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  courtIdSchema,
  createCourtSchema,
  openingHoursSchema,
  updateCourtSchema,
  type CreateCourtInput,
  type OpeningHoursInput,
  type UpdateCourtInput,
} from "@/lib/validations/dashboard";

export type DashboardActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

const NOT_FOUND = "Klub ne postoji.";

function invalid(error: z.ZodError): DashboardActionResult {
  return {
    ok: false,
    error: "Proveri unete podatke.",
    fieldErrors: z.flattenError(error).fieldErrors,
  };
}

function revalidateClub(slug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/klub/${slug}`);
  revalidatePath("/klubovi");
}

/** Every action re-checks ownership on the server: owners can only touch their own clubs. */
async function ownedClub(clubId: string, ownerId: string) {
  return prisma.club.findFirst({
    where: { id: clubId, ownerId },
    select: { id: true, slug: true },
  });
}

async function ownedCourt(courtId: string, ownerId: string) {
  return prisma.court.findFirst({
    where: { id: courtId, club: { ownerId } },
    select: { id: true, club: { select: { slug: true } } },
  });
}

export async function createCourt(input: CreateCourtInput): Promise<DashboardActionResult> {
  const owner = await requireRole("CLUB_OWNER");
  const parsed = createCourtSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { clubId, ...data } = parsed.data;

  const club = await ownedClub(clubId, owner.id);
  if (!club) return { ok: false, error: NOT_FOUND };

  const court = await prisma.court.create({ data: { ...data, clubId }, select: { id: true } });
  revalidateClub(club.slug);
  return { ok: true, id: court.id };
}

export async function updateCourt(input: UpdateCourtInput): Promise<DashboardActionResult> {
  const owner = await requireRole("CLUB_OWNER");
  const parsed = updateCourtSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { courtId, ...data } = parsed.data;

  const court = await ownedCourt(courtId, owner.id);
  if (!court) return { ok: false, error: "Teren ne postoji." };

  // Changing the price doesn't affect existing bookings: they keep their totalPrice.
  await prisma.court.update({ where: { id: courtId }, data });
  revalidateClub(court.club.slug);
  return { ok: true, id: courtId };
}

/**
 * Deletes a court that has never been booked. Courts with bookings must be deactivated
 * instead, so booking history and revenue stats stay intact.
 */
export async function deleteCourt(input: { courtId: string }): Promise<DashboardActionResult> {
  const owner = await requireRole("CLUB_OWNER");
  const parsed = courtIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Teren ne postoji." };
  const { courtId } = parsed.data;

  const court = await ownedCourt(courtId, owner.id);
  if (!court) return { ok: false, error: "Teren ne postoji." };

  const bookings = await prisma.booking.count({ where: { courtId } });
  if (bookings > 0) {
    return {
      ok: false,
      error: "Teren ima rezervacije, pa ne može da se obriše. Isključi ga umesto toga.",
    };
  }

  await prisma.court.delete({ where: { id: courtId } });
  revalidateClub(court.club.slug);
  return { ok: true, id: courtId };
}

/** Replaces the club's weekly opening hours. Closed days have no row. */
export async function updateOpeningHours(input: OpeningHoursInput): Promise<DashboardActionResult> {
  const owner = await requireRole("CLUB_OWNER");
  const parsed = openingHoursSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { clubId, days } = parsed.data;

  const club = await ownedClub(clubId, owner.id);
  if (!club) return { ok: false, error: NOT_FOUND };

  const open = days.filter((d) => !d.closed);
  await prisma.$transaction([
    prisma.openingHours.deleteMany({ where: { clubId } }),
    prisma.openingHours.createMany({
      data: open.map(({ dayOfWeek, openTime, closeTime }) => ({
        clubId,
        dayOfWeek,
        openTime,
        closeTime,
      })),
    }),
  ]);

  revalidateClub(club.slug);
  return { ok: true, id: clubId };
}
