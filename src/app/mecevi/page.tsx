import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getOpenMatches } from "@/server/queries/matches";
import { joinMatch, leaveMatch } from "@/server/actions/matches";
import { parseMatchFilters } from "@/lib/validations/matches";
import { MatchList } from "@/components/matches/match-list";
import { MatchFiltersForm } from "@/components/matches/match-filters";

export const metadata: Metadata = {
  title: "Otvoreni mečevi | Servis",
  description: "Pronađi partnera za singl ili dubl i priključi se otvorenom teniskom meču.",
};
export default async function MatchesPage({ searchParams }: PageProps<"/mecevi">) {
  const filters = parseMatchFilters(await searchParams);
  const [matches, session] = await Promise.all([getOpenMatches(filters), getSession()]);
  const user = session
    ? { id: session.user.id, name: session.user.name, image: session.user.image ?? null }
    : null;
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:py-16">
      <header>
        <h1 className="text-3xl font-bold sm:text-4xl">Otvoreni mečevi</h1>
        <p className="mt-3 text-muted-foreground">Pronađi društvo za sledeći meč.</p>
      </header>
      <MatchFiltersForm filters={filters} />
      <MatchList
        key={JSON.stringify(filters)}
        matches={matches}
        user={user}
        joinAction={joinMatch}
        leaveAction={leaveMatch}
      />
    </main>
  );
}
