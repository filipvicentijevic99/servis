import { describe, expect, it } from "vitest";
import { canPostOpenMatch } from "./post-open-match";
import { createOpenMatchSchema } from "./validations/matches";

describe("post open match eligibility", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  const booking = {
    status: "CONFIRMED" as const,
    startsAt: new Date("2026-11-14T12:00:00Z"),
    hasOpenMatch: false,
  };
  it("offers posting only for future confirmed bookings without a match", () => {
    expect(canPostOpenMatch(booking, now)).toBe(true);
    expect(canPostOpenMatch({ ...booking, status: "CANCELLED" }, now)).toBe(false);
    expect(canPostOpenMatch({ ...booking, startsAt: now }, now)).toBe(false);
    expect(canPostOpenMatch({ ...booking, startsAt: new Date("2026-11-12T12:00:00Z") }, now)).toBe(
      false,
    );
    expect(canPostOpenMatch({ ...booking, hasOpenMatch: true }, now)).toBe(false);
  });
  it.each(["SINGLES", "DOUBLES"])(
    "uses the existing schema for %s and trims optional notes",
    (type) => {
      expect(
        createOpenMatchSchema.parse({
          bookingId: "booking",
          type,
          level: "INTERMEDIATE",
          note: "  Ponesi loptice  ",
        }).note,
      ).toBe("Ponesi loptice");
      expect(
        createOpenMatchSchema.safeParse({ bookingId: "booking", type, level: "BEGINNER" }).success,
      ).toBe(true);
    },
  );
  it("reports invalid levels, types and overlong notes on their fields", () => {
    const result = createOpenMatchSchema.safeParse({
      bookingId: "booking",
      type: "INVALID",
      level: "INVALID",
      note: "x".repeat(201),
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["type", "level", "note"]);
  });
});
