import { describe, expect, it } from "vitest";
import { courtSchema, openingHoursSchema } from "./dashboard";
import { toWeek } from "@/lib/opening-hours";

const court = {
  name: " Teren 1 ",
  surface: "CLAY",
  pricePerHour: "1800",
  indoor: false,
  isActive: true,
};

describe("court form validation shared with dashboard actions", () => {
  it("trims names and parses the price supplied by the form", () => {
    expect(courtSchema.parse(court)).toMatchObject({ name: "Teren 1", pricePerHour: 1800 });
  });
  it.each([
    { name: " " },
    { name: "x".repeat(41) },
    { surface: "unknown" },
    { pricePerHour: "" },
    { pricePerHour: 99 },
    { pricePerHour: 100001 },
    { pricePerHour: 100.5 },
  ])("rejects invalid fields: %j", (invalid) => {
    expect(courtSchema.safeParse({ ...court, ...invalid }).success).toBe(false);
  });
  it("allows inactive and indoor courts", () => {
    expect(courtSchema.parse({ ...court, isActive: false, indoor: true })).toMatchObject({
      isActive: false,
      indoor: true,
    });
  });
});

describe("weekly opening hours form validation", () => {
  const days = toWeek([{ dayOfWeek: 1, openTime: "08:00", closeTime: "00:00" }]);
  it("accepts all seven days, closed days and closing at midnight", () => {
    expect(openingHoursSchema.safeParse({ clubId: "club-1", days }).success).toBe(true);
  });
  it("reports an invalid opening window against the day's closing field", () => {
    const result = openingHoursSchema.safeParse({
      clubId: "club-1",
      days: days.map((day, index) => (index === 0 ? { ...day, closeTime: "08:30" } : day)),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(["days", 0, "closeTime"]);
  });
  it("does not validate the opening window of a closed day", () => {
    expect(
      openingHoursSchema.safeParse({
        clubId: "club-1",
        days: days.map((day) => ({ ...day, closed: true, openTime: "22:00", closeTime: "08:00" })),
      }).success,
    ).toBe(true);
  });
  it("rejects missing or duplicate days", () => {
    expect(openingHoursSchema.safeParse({ clubId: "club-1", days: days.slice(1) }).success).toBe(
      false,
    );
    expect(
      openingHoursSchema.safeParse({
        clubId: "club-1",
        days: days.map((day) => ({ ...day, dayOfWeek: 1 })),
      }).success,
    ).toBe(false);
  });
});
