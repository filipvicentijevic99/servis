// Court surfaces, safe to import in client components (no Prisma import).
// Values match the `Surface` enum in prisma/schema.prisma.
export const SURFACES = ["CLAY", "HARD", "GRASS", "CARPET"] as const;
export type Surface = (typeof SURFACES)[number];

/** Labels shown in the UI. */
export const SURFACE_LABELS: Record<Surface, string> = {
  CLAY: "Šljaka",
  HARD: "Tvrda podloga",
  GRASS: "Trava",
  CARPET: "Tepih",
};

/** Values used in the URL, e.g. /klubovi?podloga=sljaka */
export const SURFACE_SLUGS: Record<Surface, string> = {
  CLAY: "sljaka",
  HARD: "tvrda",
  GRASS: "trava",
  CARPET: "tepih",
};

export function surfaceFromSlug(slug: string | undefined): Surface | undefined {
  return SURFACES.find((surface) => SURFACE_SLUGS[surface] === slug);
}
