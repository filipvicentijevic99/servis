import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { authRedirectFor, safeAuthCallback } from "@/lib/auth-redirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Prijava | Servis",
  robots: { index: false, follow: false },
};

export default async function AuthReturnPage({ searchParams }: PageProps<"/prijava/povratak">) {
  const params = await searchParams;
  const callback = safeAuthCallback(
    typeof params.callbackUrl === "string" ? params.callbackUrl : null,
  );
  const session = await getSession();

  if (!session) {
    const query = new URLSearchParams({ greska: "google" });
    if (callback) query.set("callbackUrl", callback);
    redirect(`/login?${query}`);
  }

  redirect(authRedirectFor(session.user.role, callback));
}
