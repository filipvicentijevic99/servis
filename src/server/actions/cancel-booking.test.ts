import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  find: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  transaction: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/prisma", () => ({
  default: {
    booking: { findUnique: mocks.find, update: mocks.update },
    openMatch: { deleteMany: mocks.remove },
    $transaction: mocks.transaction,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { cancelBooking } from "./bookings";

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-13T12:00:00Z"));
  mocks.user.mockResolvedValue({ id: "player-1" });
});
afterEach(() => vi.useRealTimers());
const row = {
  userId: "player-1",
  status: "CONFIRMED",
  startsAt: new Date("2026-11-14T12:00:00Z"),
  court: { club: { slug: "test-klub" } },
};
describe("cancellation server checks", () => {
  it("cancels at the inclusive 24-hour boundary and refreshes both affected pages", async () => {
    mocks.find.mockResolvedValue(row);
    mocks.transaction.mockResolvedValue([]);
    expect(await cancelBooking({ bookingId: "booking-1" })).toEqual({
      ok: true,
      bookingId: "booking-1",
    });
    expect(mocks.remove).toHaveBeenCalledWith({ where: { bookingId: "booking-1" } });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "booking-1" },
      data: { status: "CANCELLED" },
    });
    expect(mocks.revalidate).toHaveBeenCalledWith("/igrac/rezervacije");
    expect(mocks.revalidate).toHaveBeenCalledWith("/klub/test-klub");
  });
  it("rejects cancellation below 24 hours", async () => {
    mocks.find.mockResolvedValue({ ...row, startsAt: new Date("2026-11-14T11:59:59Z") });
    expect(await cancelBooking({ bookingId: "booking-1" })).toMatchObject({ ok: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects a booking belonging to another user", async () => {
    mocks.find.mockResolvedValue({ ...row, userId: "another-user" });
    expect(await cancelBooking({ bookingId: "booking-1" })).toMatchObject({ ok: false });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("does not mutate anything after a lost session", async () => {
    mocks.user.mockRejectedValue(new Error("login redirect"));
    await expect(cancelBooking({ bookingId: "booking-1" })).rejects.toThrow("login redirect");
    expect(mocks.find).not.toHaveBeenCalled();
  });
});
