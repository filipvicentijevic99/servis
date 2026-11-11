// TEMPORARY test page for the availability query (/dev/slots) until the slot picker exists.
// Try: /dev/slots?slug=ada-tennis-club&date=2026-11-12
// Delete before deploying.
import { getClub } from "@/server/queries/clubs";
import { getAvailableSlots } from "@/server/queries/availability";
import { todayInBelgrade } from "@/lib/time";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DevSlotsPage({ searchParams }: Props) {
  const params = await searchParams;
  const slug = typeof params.slug === "string" ? params.slug : "ada-tennis-club";
  const date = typeof params.date === "string" ? params.date : todayInBelgrade();

  const club = await getClub(slug);
  if (!club) return <main className="p-8">Club &quot;{slug}&quot; not found.</main>;

  const results = await Promise.all(
    club.courts.map(async (court) => ({ court, result: await getAvailableSlots(court.id, date) })),
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">
        Slots: {club.name}, {date}
      </h1>
      {results.map(({ court, result }) => (
        <section key={court.id} className="space-y-2">
          <h2 className="font-medium">{court.name}</h2>
          {result.ok ? (
            <div className="flex flex-wrap gap-2">
              {result.slots.length === 0 && <span>Closed</span>}
              {result.slots.map((slot) => (
                <span
                  key={slot.label}
                  className={
                    slot.status === "available"
                      ? "rounded border px-2 py-1"
                      : "rounded border px-2 py-1 line-through opacity-40"
                  }
                  title={slot.status}
                >
                  {slot.label}
                </span>
              ))}
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </section>
      ))}
    </main>
  );
}
