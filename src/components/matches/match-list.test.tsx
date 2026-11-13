import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { MatchList } from "./match-list";
import type { OpenMatchItem } from "@/server/queries/matches";

const host = { id: "host", name: "Ana Petrović", image: null };
const match: OpenMatchItem = {
  id: "match",
  type: "DOUBLES",
  level: "INTERMEDIATE",
  note: "Ponesi loptice",
  startsAt: new Date("2026-12-15T12:00:00Z"),
  endsAt: new Date("2026-12-15T13:00:00Z"),
  club: { name: "Test klub", slug: "test-klub", city: "Niš" },
  court: { name: "Teren 1", surface: "CLAY" },
  organizer: host,
  players: [host],
  capacity: 4,
  spotsLeft: 3,
  isJoined: false,
  isOrganizer: false,
  canJoin: true,
};
const action = vi.fn();
describe("match cards", () => {
  it("renders match details and a safe login link for guests", () => {
    const html = renderToStaticMarkup(
      <MatchList matches={[match]} user={null} joinAction={action} leaveAction={action} />,
    );
    for (const value of [
      "Test klub",
      "Teren 1",
      "13:00",
      "14:00",
      "Dubl",
      "Srednji nivo",
      "1",
      "4",
      "Ana Petrović",
      "AP",
      "/login?callbackUrl=%2Fmecevi",
    ])
      expect(html).toContain(value);
  });
  it("does not offer leave or join to the organizer", () => {
    const html = renderToStaticMarkup(
      <MatchList
        matches={[{ ...match, isOrganizer: true, isJoined: true, canJoin: false }]}
        user={host}
        joinAction={action}
        leaveAction={action}
      />,
    );
    expect(html).toContain("Ti si organizator");
    expect(html).not.toContain("Napusti meč");
    expect(html).not.toContain("Priključi se");
  });
  it("does not render full matches and provides an empty state", () => {
    const html = renderToStaticMarkup(
      <MatchList
        matches={[{ ...match, spotsLeft: 0 }]}
        user={host}
        joinAction={action}
        leaveAction={action}
      />,
    );
    expect(html).toContain("Nema otvorenih mečeva");
    expect(html).not.toContain("Test klub");
  });
  it("renders a participant's photo when present", () => {
    const html = renderToStaticMarkup(
      <MatchList
        matches={[{ ...match, players: [{ ...host, image: "https://example.test/avatar.jpg" }] }]}
        user={null}
        joinAction={action}
        leaveAction={action}
      />,
    );
    expect(html).toContain('src="https://example.test/avatar.jpg"');
  });
});
