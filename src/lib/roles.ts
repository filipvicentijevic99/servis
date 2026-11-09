// Uloge na jednom mestu, da ih koriste i server i klijent (bez uvoza Prisma klijenta u browser).
export const ROLES = ["PLAYER", "CLUB_OWNER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  PLAYER: "Igrač",
  CLUB_OWNER: "Vlasnik kluba",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Gde korisnik ide posle logina ili registracije. */
export function homeForRole(role: Role): string {
  return role === "CLUB_OWNER" ? "/dashboard" : "/";
}
