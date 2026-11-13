import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Client for browser components (useSession, signOut, Google login).
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

export const { useSession, signOut } = authClient;

export function signInWithGoogle(callbackURL = "/", errorCallbackURL?: string) {
  return authClient.signIn.social({ provider: "google", callbackURL, errorCallbackURL });
}
