import { describe, expect, it } from "vitest";
import { galleryIndex, phoneHref } from "./club-details";

describe("club details", () => {
  it("wraps carousel navigation in both directions", () => {
    expect(galleryIndex(2, 1, 3)).toBe(0);
    expect(galleryIndex(0, -1, 3)).toBe(2);
    expect(galleryIndex(0, 1, 1)).toBe(0);
    expect(galleryIndex(0, -1, 0)).toBe(0);
  });
  it("builds safe telephone links and rejects unsupported content", () => {
    expect(phoneHref("+381 (11) 123-4567")).toBe("tel:+381111234567");
    expect(phoneHref(null)).toBeNull();
    expect(phoneHref("javascript:alert(1)")).toBeNull();
    expect(phoneHref("")).toBeNull();
  });
});
