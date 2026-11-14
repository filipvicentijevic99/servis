import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { buildClubStats, type StatsBooking } from "@/lib/dashboard-stats";
import { belgradeToUtc } from "@/lib/time";
import { DashboardAnalytics } from "./dashboard-analytics";
import { AnalyticsLoading } from "./analytics-loading";

const mocks = vi.hoisted(() => ({ stats: vi.fn() }));
vi.mock("@/server/queries/dashboard-stats", () => ({ getClubStats: mocks.stats }));
import { ClubAnalytics } from "./club-analytics";

const booking: StatsBooking = {
  courtId: "court-1",
  startsAt: belgradeToUtc("2026-11-14", 540),
  endsAt: belgradeToUtc("2026-11-14", 600),
  totalPrice: 2500,
  status: "CONFIRMED",
};
const inputs = {
  bookings: [booking],
  courts: [{ id: "court-1", name: "Teren <1>" }],
  openingHours: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    openTime: "09:00",
    closeTime: "10:00",
  })),
  now: belgradeToUtc("2026-11-14", 720),
};
const stats = buildClubStats(inputs);

describe("dashboard analytics", () => {
  it("renders three KPIs and accessible charts with exact data tables", () => {
    const html = renderToStaticMarkup(<DashboardAnalytics stats={stats} />);
    for (const text of [
      "Prihod ovog meseca",
      "2.500 RSD",
      "Broj rezervacija",
      "Prosečna popunjenost",
      "3 %",
      "Prikaži dnevne podatke",
      "Prikaži sate po terenu",
      "Europe/Belgrade",
    ])
      expect(html).toContain(text);
    expect(html.match(/<dt /g)).toHaveLength(3);
    expect(html.match(/role="img"/g)).toHaveLength(2);
    expect(html.match(/<time /g)).toHaveLength(30);
    expect(html).toContain("Teren &lt;1&gt;");
    expect(html).not.toContain("<1>");
  });
  it("shows real zeros and an empty revenue state instead of invented activity", () => {
    const empty = buildClubStats({ ...inputs, bookings: [] });
    const html = renderToStaticMarkup(<DashboardAnalytics stats={empty} />);
    expect(html).toContain("0 RSD");
    expect(html).toContain("Nema potvrđenih rezervacija u poslednjih 30 dana");
    expect(html).not.toContain("<polyline");
    expect(html).toContain("0 %");
  });
  it("distinguishes missing capacity from zero occupancy", () => {
    const html = renderToStaticMarkup(
      <DashboardAnalytics stats={buildClubStats({ ...inputs, openingHours: [] })} />,
    );
    expect(html).toContain("Popunjenost nije dostupna");
    expect(html).toContain("—");
    expect(html).not.toContain("0 %");
  });
  it("handles clubs without active courts and explains current schedule assumptions", () => {
    const html = renderToStaticMarkup(
      <DashboardAnalytics stats={buildClubStats({ ...inputs, courts: [] })} />,
    );
    expect(html).toContain("Nema aktivnih terena");
    expect(html).toContain("istorijske promene nisu evidentirane");
    expect(html).toContain("Otkazane rezervacije i budući datumi nisu uključeni");
  });
  it("preserves bookings with a zero total price as activity", () => {
    const html = renderToStaticMarkup(
      <DashboardAnalytics
        stats={buildClubStats({ ...inputs, bookings: [{ ...booking, totalPrice: 0 }] })}
      />,
    );
    expect(html).toContain("<polyline");
    expect(html).not.toContain("Nema potvrđenih rezervacija");
  });
  it("announces loading while keeping the skeleton decorative", () => {
    const html = renderToStaticMarkup(<AnalyticsLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain("Učitavanje prihoda i popunjenosti");
  });
  it("loads only the selected club through the ownership-protected query", async () => {
    mocks.stats.mockResolvedValue(stats);
    expect(renderToStaticMarkup(await ClubAnalytics({ clubId: "club-1" }))).toContain("2.500 RSD");
    expect(mocks.stats).toHaveBeenCalledWith("club-1");
    mocks.stats.mockResolvedValue(null);
    expect(renderToStaticMarkup(await ClubAnalytics({ clubId: "other-owner" }))).toContain(
      "Statistika ovog kluba nije dostupna",
    );
    mocks.stats.mockRejectedValue(new Error("database failure"));
    await expect(ClubAnalytics({ clubId: "club-1" })).rejects.toThrow("database failure");
  });
});
