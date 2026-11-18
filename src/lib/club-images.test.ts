import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cloudinaryConfigFromEnv,
  clubImagePrefix,
  imageFileError,
  isClubImageUrl,
  MAX_IMAGE_BYTES,
} from "./club-images";
import { cloudinarySignature } from "./cloudinary-signature";

describe("cloudinaryConfigFromEnv", () => {
  it("requires all three values", () => {
    expect(cloudinaryConfigFromEnv({})).toBeNull();
    expect(
      cloudinaryConfigFromEnv({ CLOUDINARY_CLOUD_NAME: "demo", CLOUDINARY_API_KEY: "123" }),
    ).toBeNull();
    expect(
      cloudinaryConfigFromEnv({
        CLOUDINARY_CLOUD_NAME: "demo",
        CLOUDINARY_API_KEY: "123",
        CLOUDINARY_API_SECRET: "secret",
      }),
    ).toEqual({ cloudName: "demo", apiKey: "123", apiSecret: "secret" });
  });
});

describe("cloudinarySignature", () => {
  it("signs the params sorted by name with the secret appended", () => {
    const expected = createHash("sha1")
      .update("public_id=servis/clubs/c1/a&timestamp=1700000000secret")
      .digest("hex");
    expect(
      cloudinarySignature({ timestamp: "1700000000", public_id: "servis/clubs/c1/a" }, "secret"),
    ).toBe(expected);
  });
});

describe("isClubImageUrl", () => {
  const base = "https://res.cloudinary.com/demo/image/upload/v1/";

  it("accepts an image in the club's folder on our account", () => {
    expect(isClubImageUrl(`${base}${clubImagePrefix("c1")}/abc.jpg`, "demo", "c1")).toBe(true);
  });

  it("rejects other clubs, accounts, hosts and schemes", () => {
    expect(isClubImageUrl(`${base}${clubImagePrefix("c2")}/abc.jpg`, "demo", "c1")).toBe(false);
    expect(
      isClubImageUrl(
        "https://res.cloudinary.com/other/image/upload/v1/servis/clubs/c1/a.jpg",
        "demo",
        "c1",
      ),
    ).toBe(false);
    expect(
      isClubImageUrl("https://evil.test/demo/image/upload/servis/clubs/c1/a.jpg", "demo", "c1"),
    ).toBe(false);
    expect(
      isClubImageUrl(
        `http://res.cloudinary.com/demo/image/upload/v1/servis/clubs/c1/a.jpg`,
        "demo",
        "c1",
      ),
    ).toBe(false);
    expect(isClubImageUrl("not a url", "demo", "c1")).toBe(false);
  });
});

describe("imageFileError", () => {
  it("allows JPG, PNG and WebP up to 5 MB", () => {
    expect(imageFileError({ type: "image/webp", size: 1000 })).toBeNull();
    expect(imageFileError({ type: "image/gif", size: 1000 })).toMatch(/JPG/);
    expect(imageFileError({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toMatch(/5 MB/);
  });
});
