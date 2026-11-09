import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isRole, type Role } from "@/lib/roles";

/** Trenutna sesija ili null. Keširano u okviru jednog zahteva. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** Za stranice i akcije koje traže ulogovanog korisnika. */
export async function requireUser(callbackUrl?: string) {
  const session = await getSession();
  if (!session) {
    const query = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/login${query}`);
  }
  return session.user;
}

/** Za stranice i akcije dostupne samo određenoj ulozi, npr. dashboard vlasnika. */
export async function requireRole(role: Role, callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (!isRole(user.role) || user.role !== role) redirect("/");
  return user;
}
