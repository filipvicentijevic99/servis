"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { joinBlocker } from "@/lib/matches";
import {
  createOpenMatchSchema,
  matchIdSchema,
  type CreateOpenMatchInput,
  type MatchIdInput,
} from "@/lib/validations/matches";

export type MatchActionResult =
  | { ok: true; matchId: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

/** Error with a message that is safe to show in the UI. */
class UserError extends Error {}

const isUniqueViolation = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";

function revalidateMatches() {
  revalidatePath("/mecevi");
  revalidatePath("/igrac/rezervacije");
}

/** Turns the signed-in user's upcoming booking into an open match they organize. */
export async function createOpenMatch(input: CreateOpenMatchInput): Promise<MatchActionResult> {
  const user = await requireUser();

  const parsed = createOpenMatchSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Proveri unete podatke.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  const { bookingId, type, level, note } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { userId: true, status: true, startsAt: true, openMatch: { select: { id: true } } },
  });
  if (!booking || booking.userId !== user.id) {
    return { ok: false, error: "Rezervacija ne postoji." };
  }
  if (booking.status !== "CONFIRMED") return { ok: false, error: "Rezervacija je otkazana." };
  if (booking.startsAt <= new Date()) return { ok: false, error: "Termin je već počeo." };
  if (booking.openMatch) return { ok: false, error: "Za ovu rezervaciju već postoji meč." };

  try {
    const match = await prisma.openMatch.create({
      data: {
        bookingId,
        type,
        level,
        note: note || null,
        // The organizer is the first participant.
        participants: { create: { userId: user.id } },
      },
      select: { id: true },
    });
    revalidateMatches();
    return { ok: true, matchId: match.id };
  } catch (error) {
    // bookingId is unique: two clicks at the same time can't create two matches.
    if (isUniqueViolation(error)) {
      return { ok: false, error: "Za ovu rezervaciju već postoji meč." };
    }
    console.error(error);
    return { ok: false, error: "Objavljivanje meča nije uspelo. Pokušaj ponovo." };
  }
}

/**
 * Adds the signed-in user to an open match.
 *
 * The match row is locked (SELECT ... FOR UPDATE) for the duration of the transaction,
 * so concurrent joins to the same match run one after another and the player limit
 * can't be exceeded. The unique (matchId, userId) index stops double joins.
 */
export async function joinMatch(input: MatchIdInput): Promise<MatchActionResult> {
  const user = await requireUser();
  const parsed = matchIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Meč ne postoji." };
  const { matchId } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "OpenMatch" WHERE "id" = ${matchId} FOR UPDATE`;
      if (locked.length === 0) throw new UserError("Meč ne postoji.");

      const match = await tx.openMatch.findUniqueOrThrow({
        where: { id: matchId },
        select: {
          type: true,
          booking: { select: { status: true, startsAt: true, userId: true } },
          participants: { select: { userId: true } },
        },
      });

      const blocker = joinBlocker(
        {
          type: match.type,
          bookingStatus: match.booking.status,
          startsAt: match.booking.startsAt,
          organizerId: match.booking.userId,
          participantIds: match.participants.map((p) => p.userId),
        },
        user.id,
      );
      if (blocker) throw new UserError(blocker);

      await tx.matchParticipant.create({ data: { matchId, userId: user.id } });
    });
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    if (isUniqueViolation(error)) return { ok: false, error: "Već si u ovom meču." };
    console.error(error);
    return { ok: false, error: "Priključivanje nije uspelo. Pokušaj ponovo." };
  }

  revalidateMatches();
  return { ok: true, matchId };
}

/** Removes the signed-in user from a match. The organizer cancels the match instead. */
export async function leaveMatch(input: MatchIdInput): Promise<MatchActionResult> {
  const user = await requireUser();
  const parsed = matchIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Meč ne postoji." };
  const { matchId } = parsed.data;

  const match = await prisma.openMatch.findUnique({
    where: { id: matchId },
    select: { booking: { select: { userId: true, startsAt: true } } },
  });
  if (!match) return { ok: false, error: "Meč ne postoji." };
  if (match.booking.userId === user.id) {
    return { ok: false, error: "Ti si organizator. Otkaži meč umesto da ga napuštaš." };
  }
  if (match.booking.startsAt <= new Date()) return { ok: false, error: "Meč je već počeo." };

  const { count } = await prisma.matchParticipant.deleteMany({
    where: { matchId, userId: user.id },
  });
  if (count === 0) return { ok: false, error: "Nisi u ovom meču." };

  revalidateMatches();
  return { ok: true, matchId };
}

/** Lets the organizer take the match down. The booking itself stays. */
export async function cancelOpenMatch(input: MatchIdInput): Promise<MatchActionResult> {
  const user = await requireUser();
  const parsed = matchIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Meč ne postoji." };
  const { matchId } = parsed.data;

  const { count } = await prisma.openMatch.deleteMany({
    where: { id: matchId, booking: { userId: user.id } },
  });
  if (count === 0) return { ok: false, error: "Meč ne postoji." };

  revalidateMatches();
  return { ok: true, matchId };
}
