import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ default: { openMatch: { findMany: mocks.find } } }));
import { getOpenMatches } from "./matches";

const host = { id: "host", name: "Ana", image: null };
const participant = { id: "player", name: "Milan", image: null };
const fullMatch = {
  id: "match",
  type: "SINGLES",
  level: "BEGINNER",
  note: null,
  booking: {
    startsAt: new Date("2026-12-15T12:00:00Z"),
    endsAt: new Date("2026-12-15T13:00:00Z"),
    status: "CONFIRMED",
    user: host,
    court: { name: "Teren 1", surface: "CLAY", club: { name: "Klub", slug: "klub", city: "Niš" } },
  },
  participants: [{ user: host }, { user: participant }],
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockResolvedValue([fullMatch]);
});

describe("full match visibility", () => {
  it.each([null, { user: { id: "outsider" } }])(
    "hides full matches from guests and nonparticipants (%s)",
    async (session) => {
      mocks.session.mockResolvedValue(session);
      expect(await getOpenMatches({}, new Date("2026-12-14T12:00:00Z"))).toEqual([]);
    },
  );
  it("returns a participant's full match after refresh with leave eligibility", async () => {
    mocks.session.mockResolvedValue({ user: participant });
    expect(await getOpenMatches({}, new Date("2026-12-14T12:00:00Z"))).toMatchObject([
      { id: "match", spotsLeft: 0, isJoined: true, isOrganizer: false, canJoin: false },
    ]);
  });
  it("preserves the organizer's existing restriction on leaving", async () => {
    mocks.session.mockResolvedValue({ user: host });
    expect(await getOpenMatches({}, new Date("2026-12-14T12:00:00Z"))).toMatchObject([
      { id: "match", spotsLeft: 0, isJoined: true, isOrganizer: true, canJoin: false },
    ]);
  });
});
