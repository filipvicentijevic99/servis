import { describe, expect, it } from "vitest";
import { bookingDateLabel, bookingTimeLabel } from "./my-bookings";
import { canCancel } from "./booking-rules";

describe("booking presentation", () => {
  it("uses the Belgrade date rather than the UTC date", () => {
    expect(bookingDateLabel(new Date("2026-11-13T23:30:00Z"))).toBe("14. novembar 2026.");
  });
  it("formats winter and summer slot times in the same time zone", () => {
    expect(
      bookingTimeLabel(new Date("2026-11-13T12:00:00Z"), new Date("2026-11-13T13:00:00Z")),
    ).toBe("13:00–14:00");
    expect(
      bookingTimeLabel(new Date("2026-07-13T12:00:00Z"), new Date("2026-07-13T13:00:00Z")),
    ).toBe("14:00–15:00");
  });
  it("uses the existing cancellation rule at the exact 24-hour boundary", () => {
    const booking = { status: "CONFIRMED", startsAt: new Date("2026-11-15T12:00:00Z") };
    expect(canCancel(booking, new Date("2026-11-14T12:00:00Z"))).toBe(true);
    expect(canCancel(booking, new Date("2026-11-14T12:00:00.001Z"))).toBe(false);
  });
});
