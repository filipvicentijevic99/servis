import { describe, expect, it } from "vitest";
import { clubListUrl } from "./club-list-url";

describe("clubListUrl", () => {
  it("omits empty filters and the first page", () => {
    expect(clubListUrl({ page: 1, surface: undefined })).toBe("/klubovi");
  });

  it("preserves all filters when changing pages", () => {
    const url = clubListUrl({ city: "Novi Sad", surface: "CLAY", maxPrice: 2000, page: 1 }, 2);
    const params = new URL(url, "https://example.test").searchParams;
    expect(Object.fromEntries(params)).toEqual({
      grad: "Novi Sad",
      podloga: "sljaka",
      cena: "2000",
      strana: "2",
    });
  });

  it("returns to the first page without dropping filters", () => {
    expect(clubListUrl({ city: "Niš", surface: "HARD", page: 3 }, 1)).toBe(
      "/klubovi?grad=Ni%C5%A1&podloga=tvrda",
    );
  });

  it("encodes user input without introducing additional query parameters", () => {
    const params = new URL(
      clubListUrl({ city: "A&B?cena=1", surface: undefined, page: 1 }),
      "https://example.test",
    ).searchParams;
    expect(params.get("grad")).toBe("A&B?cena=1");
    expect(params.has("cena")).toBe(false);
  });
});
