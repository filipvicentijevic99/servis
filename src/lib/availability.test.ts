import { describe, expect, it } from "vitest";
import { buildSlots, type BookedInterval } from "./availability";
import { belgradeToUtc, dayOfWeek, isValidDate, todayInBelgrade } from "./time";

const hours = (openTime: string, closeTime: string) => ({ openTime, closeTime });
// A "now" far in the past, so no slot counts as past unless a test says so.
const LONG_AGO = new Date("2000-01-01T00:00:00Z");

describe("time helpers", () => {
  it("converts Belgrade winter time (UTC+1)", () => {
    expect(belgradeToUtc("2026-11-11", 8 * 60).toISOString()).toBe("2026-11-11T07:00:00.000Z");
  });

  it("converts Belgrade summer time (UTC+2)", () => {
    expect(belgradeToUtc("2026-07-01", 8 * 60).toISOString()).toBe("2026-07-01T06:00:00.000Z");
  });

  it("handles the days the clocks change", () => {
    // Clocks go forward on 2026-03-29 and back on 2026-10-25.
    expect(belgradeToUtc("2026-03-28", 8 * 60).toISOString()).toBe("2026-03-28T07:00:00.000Z");
    expect(belgradeToUtc("2026-03-29", 8 * 60).toISOString()).toBe("2026-03-29T06:00:00.000Z");
    expect(belgradeToUtc("2026-10-24", 8 * 60).toISOString()).toBe("2026-10-24T06:00:00.000Z");
    expect(belgradeToUtc("2026-10-25", 8 * 60).toISOString()).toBe("2026-10-25T07:00:00.000Z");
  });

  it("supports the next midnight as 24:00", () => {
    expect(belgradeToUtc("2026-11-11", 24 * 60).toISOString()).toBe("2026-11-11T23:00:00.000Z");
  });

  it("validates dates", () => {
    expect(isValidDate("2026-11-11")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("11.11.2026")).toBe(false);
  });

  it("returns the day of week with Sunday = 0", () => {
    expect(dayOfWeek("2026-11-08")).toBe(0); // Sunday
    expect(dayOfWeek("2026-11-11")).toBe(3); // Wednesday
  });

  it("uses the Belgrade date, not the UTC date, for today", () => {
    // 23:30 UTC on Nov 11 is already 00:30 on Nov 12 in Belgrade.
    expect(todayInBelgrade(new Date("2026-11-11T23:30:00Z"))).toBe("2026-11-12");
  });
});

describe("buildSlots", () => {
  const date = "2026-11-11";

  it("creates hourly slots from opening to closing time", () => {
    const slots = buildSlots({
      date,
      openingHours: hours("08:00", "12:00"),
      bookings: [],
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.label)).toEqual(["08:00", "09:00", "10:00", "11:00"]);
    expect(slots.every((s) => s.status === "available")).toBe(true);
    expect(slots[0]!.startsAt.toISOString()).toBe("2026-11-11T07:00:00.000Z");
    expect(slots[3]!.endsAt.toISOString()).toBe("2026-11-11T11:00:00.000Z");
  });

  it("returns no slots when the club is closed that day", () => {
    expect(buildSlots({ date, openingHours: null, bookings: [], now: LONG_AGO })).toEqual([]);
  });

  it("drops a last partial hour", () => {
    const slots = buildSlots({
      date,
      openingHours: hours("08:00", "10:30"),
      bookings: [],
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.label)).toEqual(["08:00", "09:00"]);
  });

  it("treats 00:00 as closing at midnight", () => {
    const slots = buildSlots({
      date,
      openingHours: hours("22:00", "00:00"),
      bookings: [],
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.label)).toEqual(["22:00", "23:00"]);
  });

  it("marks slots that overlap a booking as booked", () => {
    const bookings: BookedInterval[] = [
      { startsAt: belgradeToUtc(date, 9 * 60), endsAt: belgradeToUtc(date, 10 * 60) },
    ];
    const slots = buildSlots({
      date,
      openingHours: hours("08:00", "11:00"),
      bookings,
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.status)).toEqual(["available", "booked", "available"]);
  });

  it("marks every slot covered by a longer booking", () => {
    const bookings: BookedInterval[] = [
      { startsAt: belgradeToUtc(date, 8 * 60 + 30), endsAt: belgradeToUtc(date, 10 * 60 + 30) },
    ];
    const slots = buildSlots({
      date,
      openingHours: hours("08:00", "12:00"),
      bookings,
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.status)).toEqual(["booked", "booked", "booked", "available"]);
  });

  it("does not treat back-to-back bookings as overlapping", () => {
    const bookings: BookedInterval[] = [
      { startsAt: belgradeToUtc(date, 7 * 60), endsAt: belgradeToUtc(date, 8 * 60) },
      { startsAt: belgradeToUtc(date, 10 * 60), endsAt: belgradeToUtc(date, 11 * 60) },
    ];
    const slots = buildSlots({
      date,
      openingHours: hours("08:00", "10:00"),
      bookings,
      now: LONG_AGO,
    });
    expect(slots.map((s) => s.status)).toEqual(["available", "available"]);
  });

  it("marks slots that have started as past", () => {
    const now = belgradeToUtc(date, 9 * 60 + 15); // 09:15
    const slots = buildSlots({ date, openingHours: hours("08:00", "11:00"), bookings: [], now });
    expect(slots.map((s) => s.status)).toEqual(["past", "past", "available"]);
  });

  it("prefers booked over past", () => {
    const bookings: BookedInterval[] = [
      { startsAt: belgradeToUtc(date, 8 * 60), endsAt: belgradeToUtc(date, 9 * 60) },
    ];
    const now = belgradeToUtc(date, 9 * 60 + 30); // 09:30
    const slots = buildSlots({ date, openingHours: hours("08:00", "11:00"), bookings, now });
    expect(slots.map((s) => s.status)).toEqual(["booked", "past", "available"]);
  });

  it("keeps local times correct on the day clocks go forward", () => {
    const slots = buildSlots({
      date: "2026-03-29",
      openingHours: hours("07:00", "22:00"),
      bookings: [],
      now: LONG_AGO,
    });
    expect(slots).toHaveLength(15);
    expect(slots[0]!.label).toBe("07:00");
    expect(slots[0]!.startsAt.toISOString()).toBe("2026-03-29T05:00:00.000Z");
  });

  it("keeps local times correct on the day clocks go back", () => {
    const slots = buildSlots({
      date: "2026-10-25",
      openingHours: hours("07:00", "22:00"),
      bookings: [],
      now: LONG_AGO,
    });
    expect(slots).toHaveLength(15);
    expect(slots[0]!.startsAt.toISOString()).toBe("2026-10-25T06:00:00.000Z");
    expect(slots.at(-1)!.label).toBe("21:00");
  });
});
