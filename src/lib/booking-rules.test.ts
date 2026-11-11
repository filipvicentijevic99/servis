import { describe, expect, it } from "vitest";
import { canCancel, isWithinBookingWindow } from "./booking-rules";

describe("isWithinBookingWindow", () => {
  const today = "2026-11-11";

  it("allows today and the next 14 days", () => {
    expect(isWithinBookingWindow("2026-11-11", today)).toBe(true);
    expect(isWithinBookingWindow("2026-11-25", today)).toBe(true);
  });

  it("rejects past days and days beyond the window", () => {
    expect(isWithinBookingWindow("2026-11-10", today)).toBe(false);
    expect(isWithinBookingWindow("2026-11-26", today)).toBe(false);
  });

  it("works across a month boundary", () => {
    expect(isWithinBookingWindow("2026-12-05", "2026-11-28")).toBe(true);
  });
});

describe("canCancel", () => {
  const startsAt = new Date("2026-11-12T17:00:00Z");

  it("allows cancelling 24 hours or more before the start", () => {
    expect(canCancel({ status: "CONFIRMED", startsAt }, new Date("2026-11-11T17:00:00Z"))).toBe(
      true,
    );
    expect(canCancel({ status: "CONFIRMED", startsAt }, new Date("2026-11-10T09:00:00Z"))).toBe(
      true,
    );
  });

  it("rejects cancelling less than 24 hours before the start", () => {
    expect(canCancel({ status: "CONFIRMED", startsAt }, new Date("2026-11-11T17:00:01Z"))).toBe(
      false,
    );
    expect(canCancel({ status: "CONFIRMED", startsAt }, new Date("2026-11-12T18:00:00Z"))).toBe(
      false,
    );
  });

  it("rejects bookings that are already cancelled", () => {
    expect(canCancel({ status: "CANCELLED", startsAt }, new Date("2026-11-01T00:00:00Z"))).toBe(
      false,
    );
  });
});
