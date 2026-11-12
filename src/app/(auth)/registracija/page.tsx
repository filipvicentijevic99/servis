import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
import { authRedirectFor, safeAuthCallback } from "@/lib/auth-redirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Registracija | Servis",
  robots: { index: false, follow: false },
};

export default async function RegisterPage({ searchParams }: PageProps<"/registracija">) {
  const params = await searchParams;
  const callbackUrl = safeAuthCallback(
    typeof params.callbackUrl === "string" ? params.callbackUrl : null,
  );
  const session = await getSession();
  if (session) redirect(authRedirectFor(session.user.role, callbackUrl));

  const loginHref = callbackUrl ? `/login?${new URLSearchParams({ callbackUrl })}` : "/login";

  return (
    <AuthCard
      title="Kreiraj nalog"
      description="Pridruži se kao igrač ili vlasnik teniskog kluba."
      footerText="Već imaš nalog?"
      linkLabel="Prijavi se"
      linkHref={loginHref}
    >
      <RegisterForm
        googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
        callbackUrl={callbackUrl}
      />
    </AuthCard>
  );
}
