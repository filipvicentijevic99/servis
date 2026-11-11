import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isRole, type Role } from "@/lib/roles";

/** Current session or null. Cached per request. */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

/** For pages and actions that require a signed-in user. */
export async function requireUser(callbackUrl?: string) {
  const session = await getSession();
  if (!session) {
    const query = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/login${query}`);
  }
  return session.user;
}

/** For pages and actions limited to one role, e.g. the club owner dashboard. */
export async function requireRole(role: Role, callbackUrl?: string) {
  const user = await requireUser(callbackUrl);
  if (!isRole(user.role) || user.role !== role) redirect("/");
  return user;
}
