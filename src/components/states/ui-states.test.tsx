import { renderToStaticMarkup } from "react-dom/server";
import { Building2 } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { EmptyState } from "./empty-state";
import NotFound from "@/app/not-found";
import AppError from "@/app/error";
import ClubsLoading from "@/app/klubovi/loading";
import ClubLoading from "@/app/klub/[slug]/loading";
import MatchesLoading from "@/app/mecevi/loading";
import DashboardLoading from "@/app/dashboard/loading";
import BookingsLoading from "@/app/igrac/rezervacije/loading";

describe("shared UI states", () => {
  it("associates empty content with a heading, decorative icon and usable action", () => {
    const html = renderToStaticMarkup(
      <EmptyState icon={Building2} heading="h3" title="Nema terena" description="Dodaj prvi teren.">
        <button>Dodaj teren</button>
      </EmptyState>,
    );
    const labelledBy = /aria-labelledby="([^"]+)"/.exec(html)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`<h3 id="${labelledBy}"`);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("Dodaj prvi teren.");
    expect(html).toContain("<button>Dodaj teren</button>");
  });
  it.each([
    ["clubs", ClubsLoading],
    ["club details", ClubLoading],
    ["matches", MatchesLoading],
    ["dashboard", DashboardLoading],
    ["my bookings", BookingsLoading],
  ] as const)("announces %s loading and respects reduced-motion preferences", (_, Loading) => {
    const html = renderToStaticMarkup(<Loading />);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sr-only"');
    expect(html).toContain("motion-safe:animate-pulse");
    expect(html).not.toMatch(/(?<!motion-safe:)animate-pulse/);
  });
  it("offers working app destinations for unmatched routes", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain("Stranica nije pronađena");
    expect(html).toContain('href="/klubovi"');
    expect(html).toContain('href="/"');
    expect(html).toContain("min-h-11");
    expect(html).toContain('aria-hidden="true"');
  });
  it("shows recovery without exposing server errors", () => {
    const failure = { reset: vi.fn(), error: new Error("private-server-detail-29") };
    const html = renderToStaticMarkup(<AppError {...failure} />);
    expect(html).toContain("Došlo je do greške");
    expect(html).toContain("Pokušaj ponovo");
    expect(html).toContain('role="alert"');
    expect(html).toContain('href="/"');
    expect(html).not.toContain("private-server-detail-29");
    expect(failure.reset).not.toHaveBeenCalled();
  });
});
