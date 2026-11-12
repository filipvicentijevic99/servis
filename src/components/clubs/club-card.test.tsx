import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ClubListItem } from "@/server/queries/clubs";
import { ClubCard } from "./club-card";
import { ClubFiltersForm } from "./club-filters";
import { ClubListLoading } from "./club-list-loading";
import ClubListError from "@/app/klubovi/error";

const club: ClubListItem = {
  id: "test-club",
  slug: "test-klub",
  name: "Test klub",
  city: "Beograd",
  address: "Adresa 1",
  image: null,
  surfaces: ["CLAY", "HARD"],
  indoor: false,
  courtCount: 2,
  minPrice: 1600,
};

describe("club cards", () => {
  it("renders the club data, surface labels, price per hour and detail link", () => {
    const html = renderToStaticMarkup(<ClubCard club={club} />);
    for (const text of [
      "Test klub",
      "Beograd",
      "Šljaka",
      "Tvrda podloga",
      "1.600 RSD",
      "/ sat",
      'href="/klub/test-klub"',
    ]) {
      expect(html).toContain(text);
    }
  });

  it("renders a supplied photo with descriptive alternative text", () => {
    const image = "https://example.test/court.jpg";
    const html = renderToStaticMarkup(<ClubCard club={{ ...club, image }} />);
    expect(html).toContain(`src="${image}"`);
    expect(html).toContain('alt="Teniski tereni kluba Test klub"');
    expect(html).not.toContain("Fotografija nije dostupna");
  });

  it("handles missing photos, prices and courts without misleading values", () => {
    const html = renderToStaticMarkup(
      <ClubCard club={{ ...club, surfaces: [], minPrice: null }} />,
    );
    expect(html).toContain("Fotografija nije dostupna");
    expect(html).toContain("Cena nije dostupna");
    expect(html).toContain("Nema dostupnih podloga");
    expect(html).not.toContain("RSD");
  });

  it("does not confuse a zero price with a missing price", () => {
    expect(renderToStaticMarkup(<ClubCard club={{ ...club, minPrice: 0 }} />)).toContain("0 RSD");
  });

  it("escapes club content rather than rendering it as HTML", () => {
    const html = renderToStaticMarkup(
      <ClubCard club={{ ...club, name: '<script>alert("x")</script>' }} />,
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("club filters and states", () => {
  it("restores all URL filters and starts a fresh search without a page parameter", () => {
    const html = renderToStaticMarkup(
      <ClubFiltersForm
        filters={{ city: "Niš", surface: "CLAY", maxPrice: 1800, page: 3 }}
        cities={["Beograd"]}
      />,
    );
    expect(html).toContain('value="Niš" selected=""');
    expect(html).toContain('value="sljaka" selected=""');
    expect(html).toContain('value="1800"');
    expect(html).not.toContain('name="strana"');
    expect(html).toContain('href="/klubovi"');
    expect(html).toContain('action="/klubovi"');
  });

  it("provides an accessible loading announcement without announcing skeletons", () => {
    const html = renderToStaticMarkup(<ClubListLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("Učitavanje klubova…");
  });

  it("renders a retry action without exposing internal error details", () => {
    const html = renderToStaticMarkup(<ClubListError reset={() => {}} />);
    expect(html).toContain("Klubove trenutno nije moguće učitati");
    expect(html).toContain("Pokušaj ponovo");
    expect(html).toContain("<button");
  });
});
