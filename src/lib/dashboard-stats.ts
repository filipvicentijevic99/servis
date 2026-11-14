import { closingMinutes } from "./opening-hours";
import { dayOfWeek, formatBelgradeTime, parseTime, TIME_ZONE, todayInBelgrade } from "./time";

// Pure aggregation for the owner dashboard charts. No database and no clock:
// getClubStats (src/server/queries/dashboard-stats.ts) loads the rows and passes `now`.
// Every result is plain numbers and strings, ready for Recharts.

export const STATS_DAYS = 30;

/** Short weekday labels, Monday first (index = position in WEEKDAY_ORDER). */
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const WEEKDAY_SHORT: Record<number, string> = {
  0: "Ned",
  1: "Pon",
  2: "Uto",
  3: "Sre",
  4: "Čet",
  5: "Pet",
  6: "Sub",
};

export type StatsBooking = {
  courtId: string;
  startsAt: Date;
  endsAt: Date;
  totalPrice: number;
  status: "CONFIRMED" | "CANCELLED";
};
export type StatsCourt = { id: string; name: string };
export type StatsOpeningHours = { dayOfWeek: number; openTime: string; closeTime: string };

export type ClubStats = {
  /** Calendar month to date (Belgrade time). */
  summary: {
    revenueThisMonth: number;
    bookingsThisMonth: number;
    cancellationsThisMonth: number;
    /** Average occupancy of all active courts over the last 30 days, 0–100. */
    averageOccupancy: number;
  };
  /** One entry per day for the last 30 days, oldest first. */
  revenueByDay: { date: string; label: string; revenue: number; bookings: number }[];
  /** Last 30 days, per active court. */
  occupancyByCourt: {
    courtId: string;
    court: string;
    bookedHours: number;
    openHours: number;
    occupancy: number;
  }[];
  /** Confirmed bookings in the last 30 days by local start hour, only hours with bookings. */
  bookingsByHour: { hour: string; bookings: number }[];
  /** Confirmed bookings in the last 30 days by weekday, Monday first. */
  bookingsByWeekday: { day: string; bookings: number }[];
};

const HOUR_MS = 60 * 60 * 1000;

/** "2026-11-14" plus n days, as "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The last `count` local dates ending today, oldest first. */
export function lastDays(today: string, count: number = STATS_DAYS): string[] {
  return Array.from({ length: count }, (_, i) => addDays(today, i - count + 1));
}

/** The first day of the stats window: 30 days ago or the 1st of this month, whichever is earlier. */
export function statsWindowStart(today: string): string {
  const windowStart = addDays(today, -(STATS_DAYS - 1));
  const monthStart = `${today.slice(0, 7)}-01`;
  return monthStart < windowStart ? monthStart : windowStart;
}

/** Number of bookable 1-hour slots in an opening window (same rule as buildSlots). */
function slotHours(hours: StatsOpeningHours | undefined): number {
  if (!hours) return 0;
  const minutes = closingMinutes(hours.closeTime) - parseTime(hours.openTime);
  return Math.max(0, Math.floor(minutes / 60));
}

const dayLabel = new Intl.DateTimeFormat("sr-Latn-RS", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
});

export function buildClubStats({
  bookings,
  courts,
  openingHours,
  now,
}: {
  bookings: StatsBooking[];
  courts: StatsCourt[];
  openingHours: StatsOpeningHours[];
  now: Date;
}): ClubStats {
  const today = todayInBelgrade(now);
  const days = lastDays(today);
  const inWindow = new Set(days);
  const month = today.slice(0, 7);

  const revenueByDay = new Map(days.map((d) => [d, { revenue: 0, bookings: 0 }]));
  const bookedHoursByCourt = new Map(courts.map((c) => [c.id, 0]));
  const byHour = new Map<string, number>();
  const byWeekday = new Map<number, number>();
  const summary = { revenueThisMonth: 0, bookingsThisMonth: 0, cancellationsThisMonth: 0 };

  for (const b of bookings) {
    const date = todayInBelgrade(b.startsAt);
    const confirmed = b.status === "CONFIRMED";

    if (date.startsWith(month) && date <= today) {
      if (confirmed) {
        summary.revenueThisMonth += b.totalPrice;
        summary.bookingsThisMonth += 1;
      } else {
        summary.cancellationsThisMonth += 1;
      }
    }

    if (!confirmed || !inWindow.has(date)) continue;

    const day = revenueByDay.get(date)!;
    day.revenue += b.totalPrice;
    day.bookings += 1;

    if (bookedHoursByCourt.has(b.courtId)) {
      const hours = (b.endsAt.getTime() - b.startsAt.getTime()) / HOUR_MS;
      bookedHoursByCourt.set(b.courtId, bookedHoursByCourt.get(b.courtId)! + hours);
    }

    const hour = formatBelgradeTime(b.startsAt);
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    const weekday = dayOfWeek(date);
    byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + 1);
  }

  // Open hours per court over the window, from the club's current opening hours.
  const openHoursPerCourt = days.reduce(
    (sum, d) => sum + slotHours(openingHours.find((h) => h.dayOfWeek === dayOfWeek(d))),
    0,
  );

  const occupancyByCourt = courts.map((court) => {
    const bookedHours = bookedHoursByCourt.get(court.id) ?? 0;
    return {
      courtId: court.id,
      court: court.name,
      bookedHours,
      openHours: openHoursPerCourt,
      occupancy:
        openHoursPerCourt > 0
          ? Math.min(100, Math.round((bookedHours / openHoursPerCourt) * 100))
          : 0,
    };
  });

  const totalBooked = occupancyByCourt.reduce((sum, c) => sum + c.bookedHours, 0);
  const totalOpen = openHoursPerCourt * courts.length;

  return {
    summary: {
      ...summary,
      averageOccupancy:
        totalOpen > 0 ? Math.min(100, Math.round((totalBooked / totalOpen) * 100)) : 0,
    },
    revenueByDay: days.map((date) => ({
      date,
      label: dayLabel.format(new Date(`${date}T12:00:00Z`)),
      ...revenueByDay.get(date)!,
    })),
    occupancyByCourt,
    bookingsByHour: [...byHour.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, bookings]) => ({ hour, bookings })),
    bookingsByWeekday: WEEKDAY_ORDER.map((d) => ({
      day: WEEKDAY_SHORT[d]!,
      bookings: byWeekday.get(d) ?? 0,
    })),
  };
}
