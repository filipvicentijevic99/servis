// Small display helpers shared by server and client components.

const priceFormatter = new Intl.NumberFormat("sr-RS");

/** 1800 -> "1.800 RSD" */
export function formatPrice(rsd: number): string {
  return `${priceFormatter.format(rsd)} RSD`;
}

/** Index = dayOfWeek from the database (0 = Sunday). */
export const DAY_LABELS = [
  "Nedelja",
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
] as const;
