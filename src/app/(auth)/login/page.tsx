import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { authRedirectFor, safeAuthCallback } from "@/lib/auth-redirect";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Prijava | Servis",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const callbackUrl = safeAuthCallback(
    typeof params.callbackUrl === "string" ? params.callbackUrl : null,
  );
  const session = await getSession();
  if (session) redirect(authRedirectFor(session.user.role, callbackUrl));

  const registrationHref = callbackUrl
    ? `/registracija?${new URLSearchParams({ callbackUrl })}`
    : "/registracija";

  return (
    <AuthCard
      title="Prijavi se"
      description="Prijavi se i pronađi termin za sledeći meč."
      footerText="Nemaš nalog?"
      linkLabel="Registruj se"
      linkHref={registrationHref}
    >
      <LoginForm
        googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}
        callbackUrl={callbackUrl}
        googleError={params.greska === "google"}
      />
    </AuthCard>
  );
}
