import { zodResolver } from "@hookform/resolvers/zod";
import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";

const options = { fields: {}, shouldUseNativeValidation: false };

describe("auth form resolvers", () => {
  it("maps login validation to field errors for React Hook Form", async () => {
    const result = await zodResolver(loginSchema)(
      { email: "invalid", password: "" },
      undefined,
      options,
    );

    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      email: { message: "Unesi ispravnu email adresu." },
      password: { message: "Unesi lozinku." },
    });
  });

  it("maps a cross-field password mismatch to the confirmation field", async () => {
    const result = await zodResolver(registerSchema)(
      {
        name: "Ana Petrović",
        email: "ana@example.test",
        password: "teniska-lozinka",
        confirmPassword: "druga-lozinka",
        role: "PLAYER",
      },
      undefined,
      options,
    );

    expect(result.errors).toMatchObject({
      confirmPassword: { message: "Lozinke se ne poklapaju." },
    });
    expect(result.values).toEqual({});
  });
});
