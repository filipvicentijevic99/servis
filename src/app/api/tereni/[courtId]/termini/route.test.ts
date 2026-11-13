import { beforeEach, describe, expect, it, vi } from "vitest";
const query = vi.hoisted(() => vi.fn());
vi.mock("@/server/queries/availability", () => ({ getAvailableSlots: query }));
import { GET } from "./route";

const context = { params: Promise.resolve({ courtId: "court-1" }) };
beforeEach(() => {
  vi.resetAllMocks();
  vi.useRealTimers();
});

describe("availability endpoint", () => {
  it.each(["invalid", "2026-02-30", "2026-11-11", "2026-11-27"])(
    "rejects invalid or out-of-window date %s before querying",
    async (date) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
      const response = await GET(new Request(`https://example.test/?datum=${date}`), context);
      expect(response.status).toBe(400);
      expect(query).not.toHaveBeenCalled();
    },
  );
  it.each(["2026-11-12", "2026-11-26"])(
    "accepts the inclusive booking boundary %s",
    async (date) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
      query.mockResolvedValue({ ok: true, slots: [] });
      const response = await GET(new Request(`https://example.test/?datum=${date}`), context);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(query).toHaveBeenCalledWith("court-1", date);
    },
  );
  it("serializes the server slot statuses and instants without recomputing them", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
    query.mockResolvedValue({
      ok: true,
      slots: [
        {
          startsAt: new Date("2026-11-12T12:00:00Z"),
          endsAt: new Date("2026-11-12T13:00:00Z"),
          label: "13:00",
          status: "booked",
        },
      ],
    });
    const response = await GET(new Request("https://example.test/?datum=2026-11-12"), context);
    expect(await response.json()).toMatchObject({
      ok: true,
      slots: [{ startsAt: "2026-11-12T12:00:00.000Z", status: "booked" }],
    });
  });
  it("reports a server failure without exposing database details", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-12T10:00:00Z"));
    query.mockRejectedValue(new Error("private database details"));
    const response = await GET(new Request("https://example.test/?datum=2026-11-12"), context);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("private");
  });
});
