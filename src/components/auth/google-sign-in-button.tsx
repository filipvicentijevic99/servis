"use client";

import { useId, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth-client";
import { safeAuthCallback } from "@/lib/auth-redirect";

type GoogleSignInButtonProps = {
  enabled: boolean;
  disabled?: boolean;
  callbackUrl?: string | null;
};

export function GoogleSignInButton({
  enabled,
  disabled = false,
  callbackUrl,
}: GoogleSignInButtonProps) {
  const unavailableId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function handleSignIn() {
    if (!enabled || disabled || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);

    try {
      const callback = safeAuthCallback(callbackUrl);
      const query = new URLSearchParams();
      if (callback) query.set("callbackUrl", callback);
      const suffix = query.size ? `?${query}` : "";
      const result = await signInWithGoogle(
        `/prijava/povratak${suffix}`,
        `/login?greska=google${callback ? `&${query}` : ""}`,
      );
      if (result.error) {
        setError("Google prijava nije uspela. Pokušaj ponovo.");
      }
    } catch {
      setError("Google prijava nije uspela. Proveri vezu i pokušaj ponovo.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11 w-full"
        disabled={!enabled || disabled || pending}
        aria-busy={pending}
        aria-describedby={!enabled ? unavailableId : undefined}
        onClick={handleSignIn}
      >
        {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
        {pending ? "Povezivanje sa Google-om…" : "Nastavi sa Google-om"}
      </Button>
      {!enabled && (
        <p id={unavailableId} className="text-sm text-muted-foreground">
          Google prijava trenutno nije dostupna. Koristi email i lozinku.
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
