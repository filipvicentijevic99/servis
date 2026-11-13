import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), find: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({ default: { booking: { findMany: mocks.find } } }));
import { getMyBookings } from "./bookings";

beforeEach(() => vi.resetAllMocks());
describe("my bookings query", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  it("requires authentication with the correct return path before database access", async () => {
    mocks.user.mockRejectedValue(new Error("redirect to login"));
    await expect(getMyBookings(now)).rejects.toThrow("redirect to login");
    expect(mocks.user).toHaveBeenCalledWith("/igrac/rezervacije");
    expect(mocks.find).not.toHaveBeenCalled();
  });
  it("scopes both lists to the user and preserves backend sort and status filters", async () => {
    mocks.user.mockResolvedValue({ id: "player-1" });
    mocks.find.mockResolvedValue([]);
    expect(await getMyBookings(now)).toEqual({ upcoming: [], past: [] });
    expect(mocks.find.mock.calls[0][0]).toMatchObject({
      where: { userId: "player-1", status: "CONFIRMED", endsAt: { gt: now } },
      orderBy: { startsAt: "asc" },
    });
    expect(mocks.find.mock.calls[1][0]).toMatchObject({
      where: { userId: "player-1", OR: [{ status: "CANCELLED" }, { endsAt: { lte: now } }] },
      orderBy: { startsAt: "desc" },
    });
  });
  it("returns cancellation eligibility and the open-match warning flag", async () => {
    mocks.user.mockResolvedValue({ id: "player-1" });
    const row = {
      id: "booking-1",
      startsAt: new Date("2026-11-14T12:00:00Z"),
      endsAt: new Date("2026-11-14T13:00:00Z"),
      status: "CONFIRMED",
      totalPrice: 1600,
      openMatch: { id: "match-1" },
      court: {
        id: "court-1",
        name: "Teren 1",
        surface: "CLAY",
        club: { name: "Klub", slug: "klub", city: "Niš", address: "Adresa" },
      },
    };
    mocks.find.mockResolvedValueOnce([row]).mockResolvedValueOnce([]);
    expect((await getMyBookings(now)).upcoming[0]).toMatchObject({
      id: row.id,
      canCancel: true,
      hasOpenMatch: true,
      court: { name: "Teren 1" },
      club: { slug: "klub" },
    });
  });
});
