import type { OpenMatchItem } from "../server/queries/matches";

export type MatchPlayer = OpenMatchItem["players"][number];
export type MembershipChange = { matchId: string; player: MatchPlayer; join: boolean };

export function optimisticMembership(
  matches: OpenMatchItem[],
  change: MembershipChange,
): OpenMatchItem[] {
  return matches.map((match) => {
    if (match.id !== change.matchId) return match;
    const others = match.players.filter((player) => player.id !== change.player.id);
    const players = change.join ? [...others, change.player] : others;
    return {
      ...match,
      players,
      spotsLeft: Math.max(0, match.capacity - players.length),
      isJoined: change.join,
      canJoin: !change.join,
    };
  });
}

export function playerInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => Array.from(word)[0])
      .join("")
      .toLocaleUpperCase("sr-Latn-RS") || "?"
  );
}
