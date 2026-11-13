import type { Metadata } from "next";
import { getOwnerClub, getOwnerClubs } from "@/server/queries/dashboard";
import {
  createCourt,
  deleteCourt,
  updateCourt,
  updateOpeningHours,
} from "@/server/actions/dashboard";
import { CourtManagement } from "@/components/dashboard/court-management";
import { OpeningHoursForm } from "@/components/dashboard/opening-hours-form";
import { ClubSwitcher } from "@/components/dashboard/club-switcher";

export const metadata: Metadata = { title: "Upravljanje klubom | Servis" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const clubs = await getOwnerClubs();
  const params = await searchParams;
  const clubId = typeof params.klub === "string" ? params.klub : clubs[0]?.id;
  const club = clubId ? await getOwnerClub(clubId) : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Za vlasnike klubova</p>
        <h1 className="text-3xl font-semibold tracking-tight">Upravljanje klubom</h1>
        <p className="text-muted-foreground">
          Uredi terene, cene i nedeljno radno vreme svog kluba.
        </p>
      </header>
      <ClubSwitcher clubs={clubs} selectedId={clubId} />
      {!clubs.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Još nemaš klubova za upravljanje.
        </p>
      ) : !club ? (
        <p role="alert" className="rounded-xl border p-6">
          Klub nije dostupan. Izaberi jedan od svojih klubova.
        </p>
      ) : (
        <div key={club.id} className="space-y-8">
          <section className="space-y-1">
            <h2 className="text-2xl font-semibold break-words">{club.name}</h2>
            <p className="text-muted-foreground">
              {club.address}, {club.city}
            </p>
          </section>
          <CourtManagement club={club} actions={{ createCourt, updateCourt, deleteCourt }} />
          <OpeningHoursForm clubId={club.id} week={club.week} saveAction={updateOpeningHours} />
        </div>
      )}
    </main>
  );
}
