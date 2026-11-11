// TEMPORARY test page for the owner dashboard backend (/dev/dashboard).
// Sign in as vlasnik1@servis.test at /dev/auth first. Delete before deploying.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getClubBookingsForDay, getOwnerClub, getOwnerClubs } from "@/server/queries/dashboard";
import {
  createCourt,
  deleteCourt,
  updateCourt,
  updateOpeningHours,
} from "@/server/actions/dashboard";
import { SURFACES, SURFACE_LABELS, type Surface } from "@/lib/surfaces";
import { DAY_LABELS, formatPrice } from "@/lib/format";
import { formatBelgradeTime, todayInBelgrade } from "@/lib/time";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const back = (clubId: string, msg: string) =>
  redirect(`/dev/dashboard?club=${clubId}&msg=${encodeURIComponent(msg)}`);

function courtFields(formData: FormData) {
  return {
    name: String(formData.get("name")),
    surface: String(formData.get("surface")) as Surface,
    pricePerHour: Number(formData.get("pricePerHour")),
    indoor: formData.get("indoor") === "on",
    isActive: formData.get("isActive") === "on",
  };
}

async function saveCourt(formData: FormData) {
  "use server";
  const clubId = String(formData.get("clubId"));
  const courtId = String(formData.get("courtId") ?? "");
  const intent = String(formData.get("intent"));
  const result =
    intent === "delete"
      ? await deleteCourt({ courtId })
      : courtId
        ? await updateCourt({ courtId, ...courtFields(formData) })
        : await createCourt({ clubId, ...courtFields(formData) });
  back(
    clubId,
    result.ok ? `${intent}: OK` : `${result.error} ${JSON.stringify(result.fieldErrors ?? {})}`,
  );
}

async function saveHours(formData: FormData) {
  "use server";
  const clubId = String(formData.get("clubId"));
  const days = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
    dayOfWeek: d,
    closed: formData.get(`closed-${d}`) === "on",
    openTime: String(formData.get(`open-${d}`)),
    closeTime: String(formData.get(`close-${d}`)),
  }));
  const result = await updateOpeningHours({ clubId, days });
  back(
    clubId,
    result.ok ? "Hours saved" : `${result.error} ${JSON.stringify(result.fieldErrors ?? {})}`,
  );
}

export default async function DevDashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.msg === "string" ? params.msg : null;
  const date = typeof params.date === "string" ? params.date : todayInBelgrade();
  const clubs = await getOwnerClubs();
  const clubId = typeof params.club === "string" ? params.club : clubs[0]?.id;
  const club = clubId ? await getOwnerClub(clubId) : null;
  const bookings = club ? await getClubBookingsForDay(club.id, date) : [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">Owner dashboard test</h1>
      <nav className="flex gap-3">
        {clubs.map((c) => (
          <Link key={c.id} href={`/dev/dashboard?club=${c.id}`} className="underline">
            {c.name} ({c._count.courts})
          </Link>
        ))}
      </nav>
      {message && <p className="rounded border p-2">{message}</p>}
      {!club && <p>No club (or not yours).</p>}

      {club && (
        <>
          <section className="space-y-2">
            <h2 className="font-medium">Courts: {club.name}</h2>
            {[...club.courts, null].map((court) => (
              <form
                key={court?.id ?? "new"}
                action={saveCourt}
                className="flex flex-wrap items-center gap-2 rounded border p-2"
              >
                <input type="hidden" name="clubId" value={club.id} />
                {court && <input type="hidden" name="courtId" value={court.id} />}
                <input
                  name="name"
                  defaultValue={court?.name ?? ""}
                  placeholder="New court"
                  className="w-28 rounded border px-1"
                />
                <select
                  name="surface"
                  defaultValue={court?.surface ?? "CLAY"}
                  className="rounded border px-1"
                >
                  {SURFACES.map((s) => (
                    <option key={s} value={s}>
                      {SURFACE_LABELS[s]}
                    </option>
                  ))}
                </select>
                <input
                  name="pricePerHour"
                  type="number"
                  defaultValue={court?.pricePerHour ?? 1500}
                  className="w-20 rounded border px-1"
                />
                <label>
                  <input type="checkbox" name="indoor" defaultChecked={court?.indoor ?? false} />{" "}
                  indoor
                </label>
                <label>
                  <input type="checkbox" name="isActive" defaultChecked={court?.isActive ?? true} />{" "}
                  active
                </label>
                <button
                  name="intent"
                  value={court ? "update" : "create"}
                  className="rounded border px-2 py-1"
                >
                  {court ? "Save" : "Add"}
                </button>
                {court && (
                  <button
                    name="intent"
                    value="delete"
                    className="rounded border px-2 py-1"
                    title={court.canDelete ? "" : "Has bookings: deactivate instead"}
                  >
                    Delete{court.canDelete ? "" : " (blocked)"}
                  </button>
                )}
              </form>
            ))}
          </section>

          <section className="space-y-2">
            <h2 className="font-medium">Opening hours</h2>
            <form action={saveHours} className="space-y-1">
              <input type="hidden" name="clubId" value={club.id} />
              {club.week.map((d) => (
                <div key={d.dayOfWeek} className="flex items-center gap-2">
                  <span className="w-24">{DAY_LABELS[d.dayOfWeek]}</span>
                  <input
                    name={`open-${d.dayOfWeek}`}
                    defaultValue={d.openTime}
                    className="w-16 rounded border px-1"
                  />
                  <input
                    name={`close-${d.dayOfWeek}`}
                    defaultValue={d.closeTime}
                    className="w-16 rounded border px-1"
                  />
                  <label>
                    <input
                      type="checkbox"
                      name={`closed-${d.dayOfWeek}`}
                      defaultChecked={d.closed}
                    />{" "}
                    closed
                  </label>
                </div>
              ))}
              <button className="rounded border px-2 py-1">Save hours</button>
            </form>
          </section>

          <section className="space-y-2">
            <h2 className="font-medium">
              Bookings on {date} ({bookings.length}) — change with &amp;date=YYYY-MM-DD
            </h2>
            <ul className="space-y-1">
              {bookings.map((b) => (
                <li key={b.id}>
                  {formatBelgradeTime(b.startsAt)} · {b.court.name} · {b.user.name} ({b.user.email})
                  · {formatPrice(b.totalPrice)} · {b.status}
                  {b.openMatch && " · open match"}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
