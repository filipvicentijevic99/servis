import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({
  default: { booking: { findUnique: mocks.find }, openMatch: { create: mocks.create } },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { createOpenMatch } from "./matches";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
  mocks.user.mockResolvedValue({ id: "owner" });
  mocks.find.mockResolvedValue({
    userId: "owner",
    status: "CONFIRMED",
    startsAt: new Date("2026-11-14T12:00:00Z"),
    openMatch: null,
  });
});
afterEach(() => vi.useRealTimers());
describe("create open match action", () => {
  const input = {
    bookingId: "booking",
    type: "DOUBLES" as const,
    level: "BEGINNER" as const,
    note: "Test",
  };
  it("posts using the existing action, includes the organizer and refreshes bookings", async () => {
    mocks.create.mockResolvedValue({ id: "match" });
    expect(await createOpenMatch(input)).toEqual({ ok: true, matchId: "match" });
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "booking",
          participants: { create: { userId: "owner" } },
        }),
      }),
    );
    expect(mocks.revalidate).toHaveBeenCalledWith("/igrac/rezervacije");
  });
  it("rejects an existing match without creating another", async () => {
    mocks.find.mockResolvedValue({
      userId: "owner",
      status: "CONFIRMED",
      startsAt: new Date("2026-11-14T12:00:00Z"),
      openMatch: { id: "existing" },
    });
    expect(await createOpenMatch(input)).toMatchObject({ ok: false });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("returns a safe error when two requests race to create the same match", async () => {
    mocks.create.mockRejectedValue({ code: "P2002" });
    expect(await createOpenMatch(input)).toMatchObject({
      ok: false,
      error: "Za ovu rezervaciju već postoji meč.",
    });
  });
  it("validates the form before database access", async () => {
    expect(await createOpenMatch({ ...input, note: "x".repeat(201) })).toMatchObject({
      ok: false,
      fieldErrors: { note: expect.any(Array) },
    });
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
