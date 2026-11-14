import { beforeEach, describe, expect, it, vi } from "vitest";
import { belgradeToUtc } from "@/lib/time";

const mocks = vi.hoisted(() => ({ role: vi.fn(), club: vi.fn(), bookings: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ requireRole: mocks.role }));
vi.mock("@/lib/prisma", () => ({
  default: { club: { findFirst: mocks.club }, booking: { findMany: mocks.bookings } },
}));
import { getClubStats } from "./dashboard-stats";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.role.mockResolvedValue({ id: "owner-1" });
});
describe("owner statistics query", () => {
  it("checks the server-side owner and never loads another club's bookings", async () => {
    mocks.club.mockResolvedValue(null);
    expect(await getClubStats("not-owned")).toBeNull();
    expect(mocks.role).toHaveBeenCalledWith("CLUB_OWNER", "/dashboard");
    expect(mocks.club).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "not-owned", ownerId: "owner-1" } }),
    );
    expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it("includes a whole calendar month when it starts before the 30-day chart window", async () => {
    mocks.club.mockResolvedValue({
      courts: [{ id: "court-1", name: "Teren 1" }],
      openingHours: [],
    });
    mocks.bookings.mockResolvedValue([
      {
        courtId: "court-1",
        startsAt: belgradeToUtc("2026-10-01", 600),
        endsAt: belgradeToUtc("2026-10-01", 660),
        status: "CONFIRMED",
        totalPrice: 1800,
      },
      {
        courtId: "court-1",
        startsAt: belgradeToUtc("2026-10-31", 600),
        endsAt: belgradeToUtc("2026-10-31", 660),
        status: "CANCELLED",
        totalPrice: 3000,
      },
    ]);
    const result = await getClubStats("club-1", belgradeToUtc("2026-10-31", 720));
    expect(mocks.bookings).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          court: { clubId: "club-1" },
          startsAt: { gte: belgradeToUtc("2026-10-01", 0), lt: belgradeToUtc("2026-10-31", 1440) },
        },
      }),
    );
    expect(result?.summary.revenueThisMonth).toBe(1800);
    expect(result?.summary.bookingsThisMonth).toBe(1);
    expect(result?.revenueByDay.every((day) => day.revenue === 0)).toBe(true);
  });
});
