import { beforeEach, describe, expect, it, vi } from "vitest";
import { APIError } from "better-auth/api";
import type { RegisterInput } from "@/lib/validations/auth";

const api = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  signUpEmail: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { loginAction, registerAction } from "./auth";

const credentials = { email: "ana@example.test", password: "teniska-lozinka" };
const registration: RegisterInput = {
  ...credentials,
  name: "Ana Petrović",
  confirmPassword: credentials.password,
  role: "PLAYER",
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("loginAction", () => {
  it("returns field errors without calling auth for invalid input", async () => {
    const result = await loginAction({ email: "invalid", password: "" });
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { email: expect.any(Array), password: expect.any(Array) },
    });
    expect(api.signInEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["PLAYER", undefined, "/"],
    ["CLUB_OWNER", undefined, "/dashboard"],
    ["PLAYER", "/igrac/rezervacije", "/igrac/rezervacije"],
    ["CLUB_OWNER", "https://example.com", "/dashboard"],
    ["PLAYER", "//example.com", "/"],
    ["PLAYER", "/\\example.com", "/"],
    ["PLAYER", "/a/..//example.com", "/"],
  ])("uses the authenticated role %s and callback %s", async (role, callback, redirectTo) => {
    api.signInEmail.mockResolvedValue({ user: { role } });
    expect(await loginAction(credentials, callback)).toEqual({ ok: true, redirectTo });
    expect(api.signInEmail).toHaveBeenCalledWith({
      body: credentials,
      headers: expect.any(Headers),
    });
  });

  it("returns a Serbian error for incorrect credentials", async () => {
    api.signInEmail.mockRejectedValue(
      new APIError("UNAUTHORIZED", {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      }),
    );
    expect(await loginAction(credentials)).toEqual({
      ok: false,
      error: "Pogrešan email ili lozinka.",
    });
  });
});

describe("auth error messages", () => {
  it("does not expose untranslated or internal API errors to the form", async () => {
    api.signInEmail.mockRejectedValue(
      new APIError("BAD_REQUEST", {
        code: "UNKNOWN_AUTH_ERROR",
        message: "Internal provider failure",
      }),
    );
    expect(await loginAction(credentials)).toEqual({
      ok: false,
      error: "Nešto nije u redu. Pokušaj ponovo.",
    });
  });
});

describe("registerAction", () => {
  it.each([
    ["/klub/ada-tennis-club", "/klub/ada-tennis-club"],
    ["https://example.com", "/"],
    ["//example.com", "/"],
    ["/\\example.com", "/"],
  ])(
    "preserves only a safe post-registration booking callback: %s",
    async (callback, redirectTo) => {
      api.signUpEmail.mockResolvedValue({ user: { role: "PLAYER" } });
      expect(await registerAction(registration, callback)).toEqual({ ok: true, redirectTo });
    },
  );
  it("rejects a password mismatch before calling auth", async () => {
    expect(await registerAction({ ...registration, confirmPassword: "different" })).toMatchObject({
      ok: false,
      fieldErrors: { confirmPassword: expect.any(Array) },
    });
    expect(api.signUpEmail).not.toHaveBeenCalled();
  });

  it("rejects a role outside the supported registration roles", async () => {
    const input = { ...registration, role: "ADMIN" } as unknown as RegisterInput;
    expect(await registerAction(input)).toMatchObject({
      ok: false,
      fieldErrors: { role: expect.any(Array) },
    });
    expect(api.signUpEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["PLAYER", "/"],
    ["CLUB_OWNER", "/dashboard"],
  ] as const)(
    "registers %s and returns the existing role destination",
    async (role, redirectTo) => {
      api.signUpEmail.mockResolvedValue({ user: { role } });
      expect(await registerAction({ ...registration, role })).toEqual({ ok: true, redirectTo });
      expect(api.signUpEmail).toHaveBeenCalledWith({
        body: { name: registration.name, ...credentials, role },
        headers: expect.any(Headers),
      });
    },
  );

  it("returns a Serbian error for an existing account", async () => {
    api.signUpEmail.mockRejectedValue(
      new APIError("BAD_REQUEST", {
        code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
        message: "User already exists",
      }),
    );
    expect(await registerAction(registration)).toEqual({
      ok: false,
      error: "Nalog sa ovom email adresom već postoji.",
    });
  });
});
