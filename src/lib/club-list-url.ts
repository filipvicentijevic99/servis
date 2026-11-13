import { SURFACE_SLUGS } from "./surfaces";
import type { ClubFilters } from "./validations/clubs";

export function clubListUrl(filters: ClubFilters, page = filters.page): string {
  const params = new URLSearchParams();
  if (filters.city) params.set("grad", filters.city);
  if (filters.surface) params.set("podloga", SURFACE_SLUGS[filters.surface]);
  if (filters.maxPrice !== undefined) params.set("cena", String(filters.maxPrice));
  if (page > 1) params.set("strana", String(page));
  return `/klubovi${params.size ? `?${params}` : ""}`;
}
