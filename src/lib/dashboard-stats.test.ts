import { describe, expect, it } from "vitest";
import {
  addDays,
  buildClubStats,
  lastDays,
  statsWindowStart,
  type StatsBooking,
  type StatsOpeningHours,
} from "./dashboard-stats";
import { belgradeToUtc } from "./time";

// Saturday 14 Nov 2026, 12:00 in Belgrade.
const now = belgradeToUtc("2026-11-14", 12 * 60);
const courts = [
  { id: "c1", name: "Teren 1" },
  { id: "c2", name: "Teren 2" },
];
// Open 08:00–18:00 (10 slots) every day.
const openingHours: StatsOpeningHours[] = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  openTime: "08:00",
  closeTime: "18:00",
}));

function booking(
  date: string,
  hour: number,
  courtId = "c1",
  totalPrice = 2000,
  status: StatsBooking["status"] = "CONFIRMED",
): StatsBooking {
  const startsAt = belgradeToUtc(date, hour * 60);
  return { courtId, startsAt, endsAt: belgradeToUtc(date, hour * 60 + 60), totalPrice, status };
}

describe("date helpers", () => {
  it("adds days across month boundaries", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("returns the last 30 days ending today, oldest first", () => {
    const days = lastDays("2026-11-14");
    expect(days).toHaveLength(30);
    expect(days[0]).toBe("2026-10-16");
    expect(days.at(-1)).toBe("2026-11-14");
  });

  it("starts the window at the 1st of the month when that is earlier", () => {
    expect(statsWindowStart("2026-11-14")).toBe("2026-10-16");
    expect(statsWindowStart("2026-10-31")).toBe("2026-10-01");
  });
});

describe("buildClubStats", () => {
  it("sums revenue per day and fills empty days with zeros", () => {
    const stats = buildClubStats({
      bookings: [
        booking("2026-11-14", 9),
        booking("2026-11-14", 10, "c2", 1500),
        booking("2026-11-10", 9),
      ],
      courts,
      openingHours,
      now,
    });
    expect(stats.revenueByDay).toHaveLength(30);
    expect(stats.revenueByDay.at(-1)).toMatchObject({
      date: "2026-11-14",
      revenue: 3500,
      bookings: 2,
    });
    expect(stats.revenueByDay.find((d) => d.date === "2026-11-10")?.revenue).toBe(2000);
    expect(stats.revenueByDay.find((d) => d.date === "2026-11-11")?.revenue).toBe(0);
  });

  it("ignores cancelled bookings in revenue but counts them as cancellations", () => {
    const stats = buildClubStats({
      bookings: [booking("2026-11-14", 9), booking("2026-11-13", 9, "c1", 2000, "CANCELLED")],
      courts,
      openingHours,
      now,
    });
    expect(stats.summary).toMatchObject({
      revenueThisMonth: 2000,
      bookingsThisMonth: 1,
      cancellationsThisMonth: 1,
    });
  });

  it("counts only this calendar month in the summary", () => {
    const stats = buildClubStats({
      bookings: [booking("2026-10-31", 9), booking("2026-11-01", 9)],
      courts,
      openingHours,
      now,
    });
    expect(stats.summary.revenueThisMonth).toBe(2000);
    expect(stats.revenueByDay.find((d) => d.date === "2026-10-31")?.revenue).toBe(2000);
  });

  it("leaves future bookings out of revenue", () => {
    const stats = buildClubStats({
      bookings: [booking("2026-11-20", 9)],
      courts,
      openingHours,
      now,
    });
    expect(stats.summary.revenueThisMonth).toBe(0);
    expect(stats.revenueByDay.every((d) => d.revenue === 0)).toBe(true);
  });

  it("computes occupancy per court from open hours", () => {
    // 30 days × 10 slots = 300 open hours per court; 30 booked hours = 10 %.
    const bookings = lastDays("2026-11-14").map((d) => booking(d, 9));
    const stats = buildClubStats({ bookings, courts, openingHours, now });
    expect(stats.occupancyByCourt[0]).toMatchObject({
      bookedHours: 30,
      openHours: 300,
      occupancy: 10,
    });
    expect(stats.occupancyByCourt[1]).toMatchObject({ bookedHours: 0, occupancy: 0 });
    expect(stats.summary.averageOccupancy).toBe(5);
  });

  it("returns zero occupancy for a club with no opening hours", () => {
    const stats = buildClubStats({ bookings: [], courts, openingHours: [], now });
    expect(stats.summary.averageOccupancy).toBe(0);
    expect(stats.occupancyByCourt.every((c) => c.occupancy === 0)).toBe(true);
  });

  it("groups bookings by local hour and weekday", () => {
    const stats = buildClubStats({
      bookings: [booking("2026-11-14", 18), booking("2026-11-13", 18), booking("2026-11-13", 9)],
      courts,
      openingHours,
      now,
    });
    expect(stats.bookingsByHour).toEqual([
      { hour: "09:00", bookings: 1 },
      { hour: "18:00", bookings: 2 },
    ]);
    // 13 Nov is a Friday, 14 Nov a Saturday.
    expect(stats.bookingsByWeekday.map((d) => d.day)).toEqual([
      "Pon",
      "Uto",
      "Sre",
      "Čet",
      "Pet",
      "Sub",
      "Ned",
    ]);
    expect(stats.bookingsByWeekday.find((d) => d.day === "Pet")?.bookings).toBe(2);
    expect(stats.bookingsByWeekday.find((d) => d.day === "Sub")?.bookings).toBe(1);
  });
});
