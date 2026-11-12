import { describe, expect, it } from "vitest";
import { parseClubFilters } from "./clubs";
import { clubListUrl } from "../club-list-url";

describe("club URL filters", () => {
  it("round-trips combined filters and pagination through a shareable URL", () => {
    const filters = parseClubFilters({
      grad: " Niš ",
      podloga: "sljaka",
      cena: "1800",
      strana: "2",
    });
    const params = new URL(clubListUrl(filters), "https://example.test").searchParams;
    expect(parseClubFilters(Object.fromEntries(params))).toEqual(filters);
    expect(filters).toEqual({ city: "Niš", surface: "CLAY", maxPrice: 1800, page: 2 });
  });

  it("uses the first repeated parameter and safely ignores invalid values", () => {
    expect(
      parseClubFilters({
        grad: ["Beograd", "Niš"],
        podloga: "invalid",
        cena: "-10",
        strana: "1001",
      }),
    ).toEqual({ city: "Beograd", surface: undefined, maxPrice: undefined, page: 1 });
  });

  it("clears filters and resets pagination for an empty form submission", () => {
    expect(parseClubFilters({ grad: "", podloga: "", cena: "" })).toEqual({
      city: undefined,
      surface: undefined,
      maxPrice: undefined,
      page: 1,
    });
  });
});
