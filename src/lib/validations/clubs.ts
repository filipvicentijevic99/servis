import { z } from "zod";
import { surfaceFromSlug } from "@/lib/surfaces";

export const CLUBS_PAGE_SIZE = 12;

/**
 * Club list filters, parsed from the URL search params of /klubovi.
 * URL params are in Serbian (user-facing): ?grad=Beograd&podloga=sljaka&cena=2000&strana=2
 * Invalid values are ignored instead of throwing, so a bad link still shows a page.
 */
export const clubFiltersSchema = z.object({
  city: z.string().trim().min(1).max(60).optional().catch(undefined),
  surface: z
    .string()
    .optional()
    .transform((slug) => surfaceFromSlug(slug))
    .catch(undefined),
  maxPrice: z.coerce.number().int().positive().max(100_000).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(1_000).default(1).catch(1),
});

export type ClubFilters = z.infer<typeof clubFiltersSchema>;

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Turns Next.js `searchParams` into typed filters. */
export function parseClubFilters(searchParams: SearchParams): ClubFilters {
  return clubFiltersSchema.parse({
    city: first(searchParams.grad) || undefined,
    surface: first(searchParams.podloga) || undefined,
    maxPrice: first(searchParams.cena) || undefined,
    page: first(searchParams.strana) || undefined,
  });
}
