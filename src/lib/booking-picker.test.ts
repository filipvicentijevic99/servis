import { describe, expect, it } from "vitest";
import { bookingDateRange, clubLoginUrl, formatBookingDate } from "./booking-picker";
import { authRedirectFor } from "./auth-redirect";

describe("booking picker dates", () => {
  it("returns both supported roles to the club after login", () => {
    const url = new URL(clubLoginUrl("ada-tennis-club"), "https://servis.test");
    for (const role of ["PLAYER", "CLUB_OWNER"]) {
      expect(authRedirectFor(role, url.searchParams.get("callbackUrl"))).toBe(
        "/klub/ada-tennis-club",
      );
    }
  });
  it("uses the Belgrade date even when UTC is still the previous day", () => {
    expect(bookingDateRange(new Date("2026-11-12T23:30:00Z"))).toEqual({
      min: "2026-11-13",
      max: "2026-11-27",
    });
  });
  it("includes 14 calendar days across the spring daylight saving change", () => {
    expect(bookingDateRange(new Date("2026-03-27T12:00:00Z"))).toEqual({
      min: "2026-03-27",
      max: "2026-04-10",
    });
  });
  it("handles month and year boundaries", () => {
    expect(bookingDateRange(new Date("2026-12-28T12:00:00Z"))).toEqual({
      min: "2026-12-28",
      max: "2027-01-11",
    });
  });
  it("formats dates in Serbian Latin script", () => {
    expect(formatBookingDate("2026-11-13")).toContain("novembar");
  });
  it("encodes the return path without allowing query injection or an external callback", () => {
    const target = new URL(
      clubLoginUrl("test?callbackUrl=https://example.com"),
      "https://servis.test",
    );
    expect(target.searchParams.getAll("callbackUrl")).toEqual([
      "/klub/test%3FcallbackUrl%3Dhttps%3A%2F%2Fexample.com",
    ]);
  });
});
