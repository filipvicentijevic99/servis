import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toWeek } from "@/lib/opening-hours";
import type { OwnerClub } from "@/server/queries/dashboard";

const mocks = vi.hoisted(() => ({ clubs: vi.fn(), club: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/server/queries/dashboard", () => ({
  getOwnerClubs: mocks.clubs,
  getOwnerClub: mocks.club,
}));
vi.mock("@/server/actions/dashboard", () => ({
  createCourt: vi.fn(),
  updateCourt: vi.fn(),
  deleteCourt: vi.fn(),
  updateOpeningHours: vi.fn(),
}));
import DashboardPage from "@/app/dashboard/page";
import DashboardLoading from "@/app/dashboard/loading";
import DashboardError from "@/app/dashboard/error";
import { CourtManagement } from "./court-management";
import { OpeningHoursForm } from "./opening-hours-form";

const club: OwnerClub = {
  id: "club-1",
  name: "Test klub",
  slug: "test-klub",
  city: "Beograd",
  address: "Adresa 1",
  openingHours: [{ dayOfWeek: 1, openTime: "08:00", closeTime: "22:00" }],
  courts: [
    {
      id: "court-1",
      name: "Teren 1",
      surface: "CLAY",
      pricePerHour: 1800,
      indoor: false,
      isActive: true,
      canDelete: false,
    },
    {
      id: "court-2",
      name: "Teren 2",
      surface: "HARD",
      pricePerHour: 2000,
      indoor: true,
      isActive: false,
      canDelete: true,
    },
  ],
  week: toWeek([{ dayOfWeek: 1, openTime: "08:00", closeTime: "22:00" }]),
};
const actions = { createCourt: vi.fn(), updateCourt: vi.fn(), deleteCourt: vi.fn() };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.clubs.mockResolvedValue([{ ...club, _count: { courts: 2 } }]);
  mocks.club.mockResolvedValue(club);
});

describe("owner dashboard", () => {
  it("loads the selected owner club from the URL, including after refresh", async () => {
    const html = renderToStaticMarkup(
      await DashboardPage({
        searchParams: Promise.resolve({ klub: "club-2" }),
        params: Promise.resolve({}),
      }),
    );
    expect(mocks.club).toHaveBeenCalledWith("club-2");
    expect(html).toContain("Upravljanje klubom");
  });
  it("selects the first club by default", async () => {
    await DashboardPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) });
    expect(mocks.club).toHaveBeenCalledWith("club-1");
  });
  it("offers a URL-based switcher for multiple clubs", async () => {
    mocks.clubs.mockResolvedValue([club, { ...club, id: "club-2", name: "Drugi klub" }]);
    const html = renderToStaticMarkup(
      await DashboardPage({
        searchParams: Promise.resolve({ klub: "club-2" }),
        params: Promise.resolve({}),
      }),
    );
    expect(html).toContain('action="/dashboard"');
    expect(html).toContain('name="klub"');
    expect(html).toContain('value="club-2" selected=""');
  });
  it("handles an owner without clubs and an unavailable club without exposing data", async () => {
    mocks.clubs.mockResolvedValue([]);
    mocks.club.mockResolvedValue(null);
    expect(
      renderToStaticMarkup(
        await DashboardPage({ searchParams: Promise.resolve({}), params: Promise.resolve({}) }),
      ),
    ).toContain("Još nemaš klubova");
    expect(mocks.club).not.toHaveBeenCalled();
    mocks.clubs.mockResolvedValue([{ ...club, _count: { courts: 2 } }]);
    const html = renderToStaticMarkup(
      await DashboardPage({
        searchParams: Promise.resolve({ klub: "other-owner" }),
        params: Promise.resolve({}),
      }),
    );
    expect(html).toContain("Klub nije dostupan");
    expect(html).not.toContain("Teren 1");
  });
  it("renders both court statuses, surfaces, prices and accessible actions", () => {
    const html = renderToStaticMarkup(<CourtManagement club={club} actions={actions} />);
    for (const text of [
      "Šljaka",
      "Tvrda podloga",
      "1.800 RSD",
      "2.000 RSD",
      "Aktivan",
      "Neaktivan",
      "Otvoreni",
      "Zatvoreni",
      'aria-label="Izmeni teren Teren 1"',
      'aria-label="Obriši teren Teren 1"',
    ])
      expect(html).toContain(text);
    expect(actions.deleteCourt).not.toHaveBeenCalled();
  });
  it("renders an invitation to add the first court", () => {
    expect(
      renderToStaticMarkup(<CourtManagement club={{ ...club, courts: [] }} actions={actions} />),
    ).toContain("Dodaj prvi teren");
  });
  it("renders all seven days with closed-day controls and labelled times", () => {
    const html = renderToStaticMarkup(
      <OpeningHoursForm clubId={club.id} week={club.week} saveAction={vi.fn()} />,
    );
    for (const label of ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"])
      expect(html).toContain(`aria-label="${label} zatvoreno"`);
    expect(html.match(/type="time"/g)).toHaveLength(14);
    expect(html.match(/checked=""/g)).toHaveLength(6);
    expect(html).toContain("Europe/Belgrade");
  });
  it("announces loading and offers error recovery without leaking server errors", () => {
    expect(renderToStaticMarkup(<DashboardLoading />)).toContain('role="status"');
    expect(renderToStaticMarkup(<DashboardError retry={vi.fn()} />)).toContain("Pokušaj ponovo");
  });
});
