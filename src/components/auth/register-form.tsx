"use client";

import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthField } from "@/components/auth/auth-field";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/server/actions/auth";

type RegisterFormProps = {
  googleEnabled: boolean;
  callbackUrl: string | null;
};

export function RegisterForm({ googleEnabled, callbackUrl }: RegisterFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", role: "PLAYER" },
  });

  async function onSubmit(input: RegisterInput) {
    clearErrors("root");
    try {
      const result = await registerAction(input, callbackUrl);
      if (!result.ok) {
        for (const name of ["name", "email", "password", "confirmPassword", "role"] as const) {
          const message = result.fieldErrors?.[name]?.[0];
          if (message) setError(name, { type: "server", message }, { shouldFocus: true });
        }
        setError("root", { message: result.error });
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setError("root", { message: "Registracija nije uspela. Proveri vezu i pokušaj ponovo." });
    }
  }

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-4">
          <legend className="sr-only">Registracija putem email adrese</legend>
          <AuthField
            id="register-name"
            label="Ime i prezime"
            autoComplete="name"
            required
            error={errors.name?.message}
            {...register("name")}
          />
          <AuthField
            id="register-email"
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
            id="register-password"
            label="Lozinka (najmanje 8 karaktera)"
            type="password"
            autoComplete="new-password"
            required
            error={errors.password?.message}
            {...register("password")}
          />
          <AuthField
            id="register-confirm-password"
            label="Potvrdi lozinku"
            type="password"
            autoComplete="new-password"
            required
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <fieldset
            className="space-y-2"
            aria-describedby={errors.role ? "register-role-error" : undefined}
          >
            <legend className="mb-2 text-sm font-medium">Želim da se registrujem kao</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.map((role) => (
                <label
                  key={role}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-input px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5 has-focus-visible:ring-2 has-focus-visible:ring-ring"
                >
                  <input
                    type="radio"
                    value={role}
                    className="size-4 shrink-0 accent-primary"
                    {...register("role")}
                  />
                  {ROLE_LABELS[role]}
                </label>
              ))}
            </div>
            {errors.role?.message && (
              <p id="register-role-error" role="alert" className="text-sm text-destructive">
                {errors.role.message}
              </p>
            )}
          </fieldset>
          {errors.root?.message && (
            <p role="alert" className="text-sm text-destructive">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" className="min-h-11 w-full" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle aria-hidden="true" className="animate-spin" />}
            {isSubmitting ? "Kreiranje naloga…" : "Registruj se"}
          </Button>
        </fieldset>
      </form>
      <p className="text-center text-sm text-muted-foreground">ili</p>
      <GoogleSignInButton
        enabled={googleEnabled}
        disabled={isSubmitting}
        callbackUrl={callbackUrl}
      />
      {googleEnabled && (
        <p className="text-sm text-muted-foreground">
          Novi Google nalozi registruju se kao igrači. Za nalog vlasnika kluba koristi email i
          lozinku.
        </p>
      )}
    </div>
  );
}
