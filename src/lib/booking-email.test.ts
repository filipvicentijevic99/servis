import { describe, expect, it } from "vitest";
import {
  DEFAULT_EMAIL_FROM,
  emailConfigFromEnv,
  myBookingsUrl,
  resendPayload,
} from "./booking-email";

describe("emailConfigFromEnv", () => {
  it("disables email when the API key is missing or blank", () => {
    expect(emailConfigFromEnv({})).toBeNull();
    expect(emailConfigFromEnv({ RESEND_API_KEY: "  " })).toBeNull();
  });

  it("falls back to the Resend test sender and localhost", () => {
    expect(emailConfigFromEnv({ RESEND_API_KEY: "re_test" })).toEqual({
      apiKey: "re_test",
      from: DEFAULT_EMAIL_FROM,
      appOrigin: "http://localhost:3000",
    });
  });

  it("uses EMAIL_FROM and the app URL when set", () => {
    const config = emailConfigFromEnv({
      RESEND_API_KEY: "re_test",
      EMAIL_FROM: "Servis <rezervacije@servis.rs>",
      BETTER_AUTH_URL: "https://servis-teal.vercel.app",
    });
    expect(config?.from).toBe("Servis <rezervacije@servis.rs>");
    expect(config?.appOrigin).toBe("https://servis-teal.vercel.app");
  });
});

describe("myBookingsUrl", () => {
  it("builds an absolute link to the bookings list", () => {
    expect(myBookingsUrl("https://servis-teal.vercel.app")).toBe(
      "https://servis-teal.vercel.app/igrac/rezervacije",
    );
    expect(myBookingsUrl("http://localhost:3000/")).toBe("http://localhost:3000/igrac/rezervacije");
  });
});

describe("resendPayload", () => {
  it("sends to a single recipient with HTML and plain text", () => {
    expect(
      resendPayload({
        from: "a@b.rs",
        to: "igrac@c.rs",
        subject: "S",
        html: "<p>H</p>",
        text: "H",
      }),
    ).toEqual({ from: "a@b.rs", to: ["igrac@c.rs"], subject: "S", html: "<p>H</p>", text: "H" });
  });
});
