import { describe, expect, it } from "vitest";
import { optimisticMembership, playerInitials } from "./open-match-ui";
import { parseMatchFilters } from "./validations/matches";
import type { OpenMatchItem } from "../server/queries/matches";

const host = { id: "host", name: "Ana Petrović", image: null };
const player = { id: "player", name: "Milan", image: null };
export const sampleMatch: OpenMatchItem = {
  id: "match-1",
  type: "SINGLES",
  level: "BEGINNER",
  note: null,
  startsAt: new Date("2026-12-15T12:00:00Z"),
  endsAt: new Date("2026-12-15T13:00:00Z"),
  club: { name: "Test klub", slug: "test-klub", city: "Niš" },
  court: { name: "Teren 1", surface: "CLAY" },
  organizer: host,
  players: [host],
  capacity: 2,
  spotsLeft: 1,
  isOrganizer: false,
  isJoined: false,
  canJoin: true,
};
describe("optimistic match membership", () => {
  it("fills the last spot without mutating the server snapshot used for rollback", () => {
    const updated = optimisticMembership([sampleMatch], {
      matchId: sampleMatch.id,
      player,
      join: true,
    });
    expect(updated[0]).toMatchObject({ spotsLeft: 0, isJoined: true, canJoin: false });
    expect(sampleMatch.players).toEqual([host]);
    expect(sampleMatch.spotsLeft).toBe(1);
  });
  it("removes only the leaving participant and restores the free spot", () => {
    const joined = optimisticMembership([sampleMatch], {
      matchId: sampleMatch.id,
      player,
      join: true,
    });
    expect(
      optimisticMembership(joined, { matchId: sampleMatch.id, player, join: false })[0],
    ).toMatchObject({ players: [host], spotsLeft: 1, isJoined: false });
  });
  it("does not add duplicate participants or modify another match", () => {
    const joined = optimisticMembership([sampleMatch], {
      matchId: sampleMatch.id,
      player,
      join: true,
    });
    expect(
      optimisticMembership(joined, { matchId: sampleMatch.id, player, join: true })[0].players,
    ).toHaveLength(2);
    expect(optimisticMembership([sampleMatch], { matchId: "other", player, join: true })[0]).toBe(
      sampleMatch,
    );
  });
});
describe("match filters and avatars", () => {
  it("parses combined URL filters and ignores invalid parameters", () => {
    expect(
      parseMatchFilters({ grad: " Niš ", tip: "dubl", nivo: "srednji", datum: "2026-12-15" }),
    ).toEqual({ city: "Niš", type: "DOUBLES", level: "INTERMEDIATE", date: "2026-12-15" });
    expect(parseMatchFilters({ tip: "invalid", nivo: "invalid", datum: "2026-02-30" })).toEqual({
      city: undefined,
      type: undefined,
      level: undefined,
      date: undefined,
    });
  });
  it("provides useful initials without a photograph", () => {
    expect(playerInitials(" Ana Petrović ")).toBe("AP");
    expect(playerInitials("Đorđe")).toBe("Đ");
    expect(playerInitials("")).toBe("?");
  });
});
