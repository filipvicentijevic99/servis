import { describe, expect, it } from "vitest";
import { authRedirectFor, safeAuthCallback } from "./auth-redirect";

describe("safeAuthCallback", () => {
  it("preserves a local destination with query parameters and a fragment", () => {
    expect(safeAuthCallback("/igrac/rezervacije?status=predstojece#termin")).toBe(
      "/igrac/rezervacije?status=predstojece#termin",
    );
  });

  it.each([
    undefined,
    null,
    "",
    "https://example.com",
    "//example.com",
    "javascript:alert(1)",
    "/\\example.com",
    "/\t/example.com",
    "/\n/example.com",
    "/a/..//example.com",
    "/%2e%2e//example.com",
  ])("rejects unsafe or missing destination %s", (value) => {
    expect(safeAuthCallback(value)).toBeNull();
  });

  it("normalizes local dot segments", () => {
    expect(safeAuthCallback("/igrac/../klubovi?grad=Novi%20Sad")).toBe("/klubovi?grad=Novi%20Sad");
  });
});

describe("authRedirectFor", () => {
  it("uses the server role when no safe callback is provided", () => {
    expect(authRedirectFor("PLAYER")).toBe("/");
    expect(authRedirectFor("CLUB_OWNER")).toBe("/dashboard");
    expect(authRedirectFor("CLUB_OWNER", "//example.com")).toBe("/dashboard");
    expect(authRedirectFor("unknown")).toBe("/");
  });

  it("prefers a safe callback over the role's default destination", () => {
    expect(authRedirectFor("CLUB_OWNER", "/klubovi")).toBe("/klubovi");
    expect(authRedirectFor("PLAYER", "/igrac/rezervacije")).toBe("/igrac/rezervacije");
  });

  it.each([
    "/login",
    "/registracija?callbackUrl=/",
    "/prijava/povratak/",
    "/prijava/povratak#sesija",
  ])("avoids returning to an authentication page: %s", (callback) => {
    expect(authRedirectFor("CLUB_OWNER", callback)).toBe("/dashboard");
  });
});
