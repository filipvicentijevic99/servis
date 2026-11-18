// Pure helpers for booking emails (issue #25). Sending lives in src/server/email.

export const DEFAULT_EMAIL_FROM = "Servis <onboarding@resend.dev>";

export type EmailConfig = {
  apiKey: string;
  from: string;
  appOrigin: string;
};

/**
 * Reads the email settings from the environment.
 * Returns null when RESEND_API_KEY is missing, so local development works without email.
 */
export function emailConfigFromEnv(env: Record<string, string | undefined>): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    from: env.EMAIL_FROM?.trim() || DEFAULT_EMAIL_FROM,
    appOrigin: env.BETTER_AUTH_URL?.trim() || "http://localhost:3000",
  };
}

/** Link to the player's bookings list; cancelled bookings are on its "Prošle" tab. */
export function myBookingsUrl(appOrigin: string): string {
  return new URL("/igrac/rezervacije", appOrigin).href;
}

/** Request body for POST https://api.resend.com/emails. */
export function resendPayload({
  from,
  to,
  subject,
  html,
  text,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  return { from, to: [to], subject, html, text };
}
