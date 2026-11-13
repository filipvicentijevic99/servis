import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  club: vi.fn(),
  court: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  revalidate: vi.fn(),
  transaction: vi.fn(),
  lock: vi.fn(),
}));
vi.mock("@/lib/session", () => ({ requireRole: mocks.role }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma", () => ({
  default: {
    club: { findFirst: mocks.club },
    court: {
      findFirst: mocks.court,
      create: mocks.create,
      update: mocks.update,
      delete: mocks.remove,
    },
    booking: { count: mocks.count },
    $transaction: mocks.transaction,
  },
}));
import { createCourt, deleteCourt, updateCourt } from "./dashboard";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.role.mockResolvedValue({ id: "owner-1" });
  mocks.court.mockResolvedValue({ id: "court-1", club: { slug: "test-klub" } });
  mocks.lock.mockResolvedValue([{ id: "court-1" }]);
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      $queryRaw: mocks.lock,
      booking: { count: mocks.count },
      court: { delete: mocks.remove },
    }),
  );
});
describe("dashboard mutations used by court forms", () => {
  it("does not delete a court with any booking history", async () => {
    mocks.count.mockResolvedValue(1);
    expect(await deleteCourt({ courtId: "court-1" })).toMatchObject({
      ok: false,
      error: expect.stringContaining("rezervacije"),
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("deletes an unbooked court and invalidates owner and public pages", async () => {
    mocks.count.mockResolvedValue(0);
    expect(await deleteCourt({ courtId: "court-1" })).toEqual({ ok: true, id: "court-1" });
    expect(mocks.role).toHaveBeenCalledWith("CLUB_OWNER");
    expect(mocks.court).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "court-1", club: { ownerId: "owner-1" } } }),
    );
    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: "court-1" } });
    expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard", "layout");
    expect(mocks.revalidate).toHaveBeenCalledWith("/klub/test-klub");
  });
  it("never deletes another owner's court", async () => {
    mocks.court.mockResolvedValue(null);
    expect(await deleteCourt({ courtId: "not-owned" })).toMatchObject({ ok: false });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("waits for the court lock before checking newly committed bookings", async () => {
    let release!: (rows: { id: string }[]) => void;
    mocks.lock.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const deletion = deleteCourt({ courtId: "court-1" });
    await vi.waitFor(() => expect(mocks.lock).toHaveBeenCalled());
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    mocks.count.mockResolvedValue(1);
    release([{ id: "court-1" }]);
    expect(await deletion).toMatchObject({ ok: false });
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: "ReadCommitted",
    });
    expect(mocks.lock.mock.calls[0][0].join("?")).toContain(
      'SELECT "id" FROM "Court" WHERE "id" = ? FOR UPDATE',
    );
    expect(mocks.lock.mock.calls[0][1]).toBe("court-1");
  });
  it("handles a court deleted before the transaction acquired its lock", async () => {
    mocks.lock.mockResolvedValue([]);
    expect(await deleteCourt({ courtId: "court-1" })).toMatchObject({
      ok: false,
      error: "Teren ne postoji.",
    });
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("uses the update action for deactivation and preserves the other court fields", async () => {
    const fields = {
      name: "Teren 1",
      surface: "CLAY" as const,
      pricePerHour: 1800,
      indoor: false,
      isActive: false,
    };
    expect(await updateCourt({ courtId: "court-1", ...fields })).toMatchObject({ ok: true });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "court-1" }, data: fields });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("returns field errors without writing invalid form input", async () => {
    const result = await createCourt({
      clubId: "club-1",
      name: " ",
      surface: "CLAY",
      pricePerHour: 99,
      indoor: false,
      isActive: true,
    });
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { name: expect.any(Array), pricePerHour: expect.any(Array) },
    });
    expect(mocks.club).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
