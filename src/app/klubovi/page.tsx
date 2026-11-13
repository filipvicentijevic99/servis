import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";
import { ClubCard } from "@/components/clubs/club-card";
import { ClubFiltersForm } from "@/components/clubs/club-filters";
import { ClubListLoading } from "@/components/clubs/club-list-loading";
import { clubListUrl } from "@/lib/club-list-url";
import { parseClubFilters, type ClubFilters } from "@/lib/validations/clubs";
import { getClubs, getClubCities } from "@/server/queries/clubs";

export const metadata: Metadata = {
  title: "Teniski klubovi | Servis",
  description: "Pronađi teniski klub po gradu, podlozi i ceni termina.",
};

async function ClubResults({ filters }: { filters: ClubFilters }) {
  const [result, cities] = await Promise.all([getClubs(filters), getClubCities()]);
  if (filters.page > result.pageCount) redirect(clubListUrl(filters, result.pageCount));

  return (
    <div className="space-y-8">
      <ClubFiltersForm filters={filters} cities={cities} />
      <p className="text-sm text-muted-foreground" role="status">
        Pronađeno klubova: {result.total}
      </p>
      {result.items.length ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed px-4 py-16 text-center">
          <SearchX aria-hidden="true" className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Nema pronađenih klubova</h2>
          <p className="mt-2 text-muted-foreground">
            Pokušaj sa drugim filterima ili pogledaj sve klubove.
          </p>
          <Link
            href="/klubovi"
            className="mt-5 inline-block rounded-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Prikaži sve klubove
          </Link>
        </div>
      )}
      {result.pageCount > 1 && (
        <nav
          aria-label="Stranice liste klubova"
          className="flex flex-wrap items-center justify-center gap-4 text-sm"
        >
          {result.page > 1 && (
            <Link
              href={clubListUrl(filters, result.page - 1)}
              className="rounded-lg border px-4 py-3 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Prethodna
            </Link>
          )}
          <span>
            Strana {result.page} od {result.pageCount}
          </span>
          {result.page < result.pageCount && (
            <Link
              href={clubListUrl(filters, result.page + 1)}
              className="rounded-lg border px-4 py-3 focus-visible:outline-2 focus-visible:outline-ring"
            >
              Sledeća
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

export default async function ClubsPage({ searchParams }: PageProps<"/klubovi">) {
  const filters = parseClubFilters(await searchParams);
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:py-16">
      <header>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Teniski klubovi</h1>
        <p className="mt-3 text-muted-foreground">Pronađi teren za svoj sledeći meč.</p>
      </header>
      <Suspense key={JSON.stringify(filters)} fallback={<ClubListLoading />}>
        <ClubResults filters={filters} />
      </Suspense>
    </main>
  );
}
