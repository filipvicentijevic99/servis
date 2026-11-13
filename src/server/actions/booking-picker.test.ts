import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), create: vi.fn() }));
vi.mock("@/lib/session", () => ({ getSession: mocks.session }));
vi.mock("./bookings", () => ({ createBooking: mocks.create }));
import { confirmCourtBooking } from "./booking-picker";

beforeEach(() => vi.resetAllMocks());
describe("booking confirmation", () => {
  const input = { courtId: "court-1", startsAt: "2026-11-13T12:00:00Z" };
  it("does not call createBooking when the session has expired", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await confirmCourtBooking(input)).toMatchObject({ ok: false, requiresLogin: true });
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it.each([
    { ok: true, bookingId: "booking-1" },
    { ok: false, error: "Termin je upravo zauzet. Izaberi drugi." },
  ])("preserves the existing booking action outcome", async (result) => {
    mocks.session.mockResolvedValue({ user: { id: "user-1" } });
    mocks.create.mockResolvedValue(result);
    expect(await confirmCourtBooking(input)).toEqual(result);
    expect(mocks.create).toHaveBeenCalledWith(input);
  });
});
