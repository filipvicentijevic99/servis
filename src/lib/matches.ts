// Open match rules and labels, shared by server and client (no Prisma import).

export const MATCH_TYPES = ["SINGLES", "DOUBLES"] as const;
export type MatchType = (typeof MATCH_TYPES)[number];

export const SKILL_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  SINGLES: "Singl",
  DOUBLES: "Dubl",
};

export const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "Početnik",
  INTERMEDIATE: "Srednji nivo",
  ADVANCED: "Napredni",
};

/** Values used in the URL, e.g. /mecevi?tip=dubl&nivo=srednji */
export const MATCH_TYPE_SLUGS: Record<MatchType, string> = { SINGLES: "singl", DOUBLES: "dubl" };
export const SKILL_LEVEL_SLUGS: Record<SkillLevel, string> = {
  BEGINNER: "pocetnik",
  INTERMEDIATE: "srednji",
  ADVANCED: "napredni",
};

/** Total number of players, including the organizer. */
export function matchCapacity(type: MatchType): number {
  return type === "DOUBLES" ? 4 : 2;
}

export type JoinCheck = {
  type: MatchType;
  bookingStatus: string;
  startsAt: Date;
  organizerId: string;
  participantIds: string[];
};

/**
 * Why a user can't join a match, or null if they can.
 * Used by joinMatch (authoritative check) and by queries (to show/hide the button).
 */
export function joinBlocker(
  match: JoinCheck,
  userId: string,
  now: Date = new Date(),
): string | null {
  if (match.bookingStatus !== "CONFIRMED") return "Meč je otkazan.";
  if (match.startsAt <= now) return "Meč je već počeo.";
  if (match.organizerId === userId || match.participantIds.includes(userId)) {
    return "Već si u ovom meču.";
  }
  if (match.participantIds.length >= matchCapacity(match.type)) return "Meč je popunjen.";
  return null;
}
