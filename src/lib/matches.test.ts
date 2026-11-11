import { describe, expect, it } from "vitest";
import { joinBlocker, matchCapacity, type JoinCheck } from "./matches";

const now = new Date("2026-11-11T12:00:00Z");
const base: JoinCheck = {
  type: "DOUBLES",
  bookingStatus: "CONFIRMED",
  startsAt: new Date("2026-11-12T17:00:00Z"),
  organizerId: "org",
  participantIds: ["org"],
};

describe("matchCapacity", () => {
  it("is 2 for singles and 4 for doubles", () => {
    expect(matchCapacity("SINGLES")).toBe(2);
    expect(matchCapacity("DOUBLES")).toBe(4);
  });
});

describe("joinBlocker", () => {
  it("lets a new player join a match with free spots", () => {
    expect(joinBlocker(base, "ana", now)).toBeNull();
    expect(joinBlocker({ ...base, participantIds: ["org", "b", "c"] }, "ana", now)).toBeNull();
  });

  it("blocks a full match", () => {
    expect(joinBlocker({ ...base, participantIds: ["org", "b", "c", "d"] }, "ana", now)).toBe(
      "Meč je popunjen.",
    );
    expect(
      joinBlocker({ ...base, type: "SINGLES", participantIds: ["org", "b"] }, "ana", now),
    ).toBe("Meč je popunjen.");
  });

  it("blocks the organizer and players who already joined", () => {
    expect(joinBlocker(base, "org", now)).toBe("Već si u ovom meču.");
    expect(joinBlocker({ ...base, participantIds: ["org", "ana"] }, "ana", now)).toBe(
      "Već si u ovom meču.",
    );
  });

  it("blocks matches that started or were cancelled", () => {
    expect(joinBlocker({ ...base, startsAt: now }, "ana", now)).toBe("Meč je već počeo.");
    expect(joinBlocker({ ...base, bookingStatus: "CANCELLED" }, "ana", now)).toBe(
      "Meč je otkazan.",
    );
  });
});
