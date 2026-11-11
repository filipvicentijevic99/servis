import { z } from "zod";
import {
  MATCH_TYPES,
  MATCH_TYPE_SLUGS,
  SKILL_LEVELS,
  SKILL_LEVEL_SLUGS,
  type MatchType,
  type SkillLevel,
} from "@/lib/matches";
import { isValidDate } from "@/lib/time";

export const createOpenMatchSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(MATCH_TYPES, "Izaberi singl ili dubl."),
  level: z.enum(SKILL_LEVELS, "Izaberi nivo."),
  note: z.string().trim().max(200, "Napomena može imati najviše 200 karaktera.").optional(),
});

export const matchIdSchema = z.object({ matchId: z.string().min(1) });

export type CreateOpenMatchInput = z.input<typeof createOpenMatchSchema>;
export type MatchIdInput = z.input<typeof matchIdSchema>;

/** Open match list filters from /mecevi?grad=Beograd&tip=dubl&nivo=srednji&datum=2026-11-14 */
export type MatchFilters = {
  city?: string;
  type?: MatchType;
  level?: SkillLevel;
  date?: string;
};

type SearchParams = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/** Turns Next.js `searchParams` into typed filters; invalid values are ignored. */
export function parseMatchFilters(searchParams: SearchParams): MatchFilters {
  const city = first(searchParams.grad);
  const typeSlug = first(searchParams.tip);
  const levelSlug = first(searchParams.nivo);
  const date = first(searchParams.datum);
  return {
    city: city && city.length <= 60 ? city : undefined,
    type: MATCH_TYPES.find((t) => MATCH_TYPE_SLUGS[t] === typeSlug),
    level: SKILL_LEVELS.find((l) => SKILL_LEVEL_SLUGS[l] === levelSlug),
    date: date && isValidDate(date) ? date : undefined,
  };
}
