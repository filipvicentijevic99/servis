// Roles in one place, shared by server and client (without importing the Prisma client in the browser).
export const ROLES = ["PLAYER", "CLUB_OWNER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  PLAYER: "Igrač",
  CLUB_OWNER: "Vlasnik kluba",
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Where the user lands after login or sign-up. */
export function homeForRole(role: Role): string {
  return role === "CLUB_OWNER" ? "/dashboard" : "/";
}
