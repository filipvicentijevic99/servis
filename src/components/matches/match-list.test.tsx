import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { MatchList } from "./match-list";
import type { OpenMatchItem } from "@/server/queries/matches";
import { optimisticMembership } from "@/lib/open-match-ui";

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
  it.each([null, { id: "outsider", name: "Drugi igrač", image: null }])(
    "hides full matches from nonparticipants (%s)",
    (user) => {
      const html = renderToStaticMarkup(
        <MatchList
          matches={[{ ...match, spotsLeft: 0 }]}
          user={user}
          joinAction={action}
          leaveAction={action}
        />,
      );
      expect(html).toContain("Nema otvorenih mečeva");
      expect(html).not.toContain("Test klub");
    },
  );
  it("keeps the last joining participant's full match visible and allows leaving", () => {
    const user = { id: "player", name: "Milan", image: null };
    const single = { ...match, type: "SINGLES" as const, capacity: 2, spotsLeft: 1 };
    const joined = optimisticMembership([single], { matchId: match.id, player: user, join: true });
    expect(joined[0].spotsLeft).toBe(0);
    const joinedHtml = renderToStaticMarkup(
      <MatchList matches={joined} user={user} joinAction={action} leaveAction={action} />,
    );
    expect(joinedHtml).toContain("Test klub");
    expect(joinedHtml).toContain("Napusti meč");
    const left = optimisticMembership(joined, { matchId: match.id, player: user, join: false });
    const leftHtml = renderToStaticMarkup(
      <MatchList matches={left} user={user} joinAction={action} leaveAction={action} />,
    );
    expect(left[0].spotsLeft).toBe(1);
    expect(leftHtml).toContain("Priključi se");
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
