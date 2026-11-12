"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/server/actions/auth";

type LoginFormProps = {
  googleEnabled: boolean;
  callbackUrl: string | null;
  googleError: boolean;
};

export function LoginForm({ googleEnabled, callbackUrl, googleError }: LoginFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(input: LoginInput) {
    clearErrors("root");
    try {
      const result = await loginAction(input, callbackUrl);
      if (!result.ok) {
        for (const name of ["email", "password"] as const) {
          const message = result.fieldErrors?.[name]?.[0];
          if (message) setError(name, { type: "server", message }, { shouldFocus: true });
        }
        setError("root", { message: result.error });
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setError("root", { message: "Prijava nije uspela. Proveri vezu i pokušaj ponovo." });
    }
  }

  return (
    <div className="space-y-6">
      {googleError && (
        <p role="alert" className="text-sm text-destructive">
          Google prijava nije uspela. Pokušaj ponovo ili koristi email i lozinku.
        </p>
      )}
      <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <legend className="sr-only">Prijava putem email adrese</legend>
          <AuthField
            id="login-email"
            label="Email adresa"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            error={errors.email?.message}
            {...register("email")}
          />
          <AuthField
            id="login-password"
            label="Lozinka"
            type="password"
            autoComplete="current-password"
            required
            error={errors.password?.message}
            {...register("password")}
          />
          {errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" className="min-h-11 w-full" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
            {isSubmitting ? "Prijavljivanje…" : "Prijavi se"}
          </Button>
        </fieldset>
      </form>
      <p className="text-center text-sm text-muted-foreground">ili</p>
      <GoogleSignInButton
        enabled={googleEnabled}
        disabled={isSubmitting}
        callbackUrl={callbackUrl}
      />
    </div>
  );
}
