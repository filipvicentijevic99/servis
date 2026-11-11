import { describe, expect, it } from "vitest";
import { isValidOpeningWindow, toWeek, WEEK_ORDER } from "./opening-hours";

describe("toWeek", () => {
  it("returns Monday to Sunday and marks missing days as closed", () => {
    const week = toWeek([
      { dayOfWeek: 1, openTime: "07:00", closeTime: "22:00" },
      { dayOfWeek: 0, openTime: "09:00", closeTime: "18:00" },
    ]);
    expect(week.map((d) => d.dayOfWeek)).toEqual([...WEEK_ORDER]);
    expect(week[0]).toEqual({ dayOfWeek: 1, closed: false, openTime: "07:00", closeTime: "22:00" });
    expect(week[1]!.closed).toBe(true);
    expect(week[6]).toEqual({ dayOfWeek: 0, closed: false, openTime: "09:00", closeTime: "18:00" });
  });
});

describe("isValidOpeningWindow", () => {
  it("accepts windows of at least one hour", () => {
    expect(isValidOpeningWindow("08:00", "22:00")).toBe(true);
    expect(isValidOpeningWindow("21:00", "22:00")).toBe(true);
  });

  it("treats 00:00 as closing at midnight", () => {
    expect(isValidOpeningWindow("08:00", "00:00")).toBe(true);
  });

  it("rejects windows that are too short, reversed or malformed", () => {
    expect(isValidOpeningWindow("21:30", "22:00")).toBe(false);
    expect(isValidOpeningWindow("22:00", "08:00")).toBe(false);
    expect(isValidOpeningWindow("8", "22:00")).toBe(false);
  });
});
