// TEMPORARY test page for the club queries (/dev/clubs) until the real club pages exist.
// Try: /dev/clubs?grad=Beograd&podloga=sljaka&cena=2000  or  /dev/clubs?slug=ada-tennis-club
// Delete before deploying.
import { getClub, getClubCities, getClubs } from "@/server/queries/clubs";
import { parseClubFilters } from "@/lib/validations/clubs";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DevClubsPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseClubFilters(params);
  const slug = typeof params.slug === "string" ? params.slug : undefined;

  const [clubs, cities, club] = await Promise.all([
    getClubs(filters),
    getClubCities(),
    slug ? getClub(slug) : null,
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">Club queries test</h1>
      <section>
        <h2 className="font-medium">Parsed filters</h2>
        <pre className="overflow-x-auto">{JSON.stringify(filters, null, 2)}</pre>
      </section>
      <section>
        <h2 className="font-medium">getClubCities()</h2>
        <pre className="overflow-x-auto">{JSON.stringify(cities)}</pre>
      </section>
      {slug && (
        <section>
          <h2 className="font-medium">getClub(&quot;{slug}&quot;)</h2>
          <pre className="overflow-x-auto">{JSON.stringify(club, null, 2)}</pre>
        </section>
      )}
      <section>
        <h2 className="font-medium">getClubs(filters)</h2>
        <pre className="overflow-x-auto">{JSON.stringify(clubs, null, 2)}</pre>
      </section>
    </main>
  );
}
