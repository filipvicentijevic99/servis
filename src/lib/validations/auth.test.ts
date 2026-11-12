import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth";

const validRegistration = {
  name: "Ana Petrović",
  email: "ana@example.test",
  password: "teniska-lozinka",
  confirmPassword: "teniska-lozinka",
  role: "PLAYER",
};

describe("auth validation", () => {
  it("rejects empty login fields", () => {
    const result = loginSchema.safeParse({ email: "", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["email", "password"]);
    }
  });

  it("does not apply registration password rules to existing accounts", () => {
    expect(loginSchema.safeParse({ email: "ana@example.test", password: "short" }).success).toBe(
      true,
    );
  });

  it.each(["PLAYER", "CLUB_OWNER"])("accepts registration as %s and trims the name", (role) => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      role,
      name: "  Ana Petrović  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Ana Petrović");
  });

  it.each([
    ["name", " "],
    ["email", "invalid-email"],
    ["password", "short"],
    ["password", "x".repeat(129)],
    ["confirmPassword", "different-password"],
    ["role", "ADMIN"],
  ])("reports invalid %s on its own field", (field, value) => {
    const result = registerSchema.safeParse({ ...validRegistration, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
    }
  });
});
