"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { homeForRole, isRole } from "@/lib/roles";
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from "@/lib/validations/auth";

export type ActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<string, string[]>> };

// Prevodimo najčešće greške Better Auth-a na srpski.
function toMessage(error: unknown): string {
  if (error instanceof APIError) {
    const code = String((error.body as { code?: string } | undefined)?.code ?? "");
    if (code === "USER_ALREADY_EXISTS" || code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
      return "Nalog sa ovom email adresom već postoji.";
    }
    if (code === "INVALID_EMAIL_OR_PASSWORD") return "Pogrešan email ili lozinka.";
    if (error.message) return error.message;
  }
  console.error(error);
  return "Nešto nije u redu. Pokušaj ponovo.";
}

// Dozvoljavamo samo relativne putanje unutar aplikacije (zaštita od open redirect-a).
function safeCallback(callbackUrl?: string | null): string | null {
  return callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
    ? callbackUrl
    : null;
}

export async function registerAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Proveri unete podatke.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const { name, email, password, role } = parsed.data;
  try {
    await auth.api.signUpEmail({
      body: { name, email, password, role },
      headers: await headers(),
    });
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  return { ok: true, redirectTo: homeForRole(role) };
}

export async function loginAction(
  input: LoginInput,
  callbackUrl?: string | null,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Proveri unete podatke.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  let role: unknown;
  try {
    const result = await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
    role = (result.user as { role?: unknown }).role;
  } catch (error) {
    return { ok: false, error: toMessage(error) };
  }

  const fallback = isRole(role) ? homeForRole(role) : "/";
  return { ok: true, redirectTo: safeCallback(callbackUrl) ?? fallback };
}

export async function logoutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
