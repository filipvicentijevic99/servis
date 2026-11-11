// TEMPORARY test page for "my bookings" and cancellation (/dev/bookings).
// Sign in at /dev/auth first. Delete before deploying.
import { redirect } from "next/navigation";
import { getMyBookings, type MyBooking } from "@/server/queries/bookings";
import { cancelBooking } from "@/server/actions/bookings";
import { createOpenMatch } from "@/server/actions/matches";
import { formatBelgradeTime, todayInBelgrade } from "@/lib/time";
import { formatPrice } from "@/lib/format";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

async function cancel(formData: FormData) {
  "use server";
  const result = await cancelBooking({ bookingId: String(formData.get("bookingId")) });
  const msg = result.ok ? "Cancelled." : result.error;
  redirect(`/dev/bookings?msg=${encodeURIComponent(msg)}`);
}

async function openMatch(formData: FormData) {
  "use server";
  const result = await createOpenMatch({
    bookingId: String(formData.get("bookingId")),
    type: String(formData.get("type")) as "SINGLES" | "DOUBLES",
    level: String(formData.get("level")) as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    note: String(formData.get("note") ?? ""),
  });
  const msg = result.ok ? `Open match created: ${result.matchId}` : result.error;
  redirect(`/dev/bookings?msg=${encodeURIComponent(msg)}`);
}

function Row({ booking }: { booking: MyBooking }) {
  return (
    <li className="flex items-center justify-between gap-4 rounded border p-2">
      <span>
        {todayInBelgrade(booking.startsAt)} {formatBelgradeTime(booking.startsAt)} ·{" "}
        {booking.club.name}, {booking.court.name} · {formatPrice(booking.totalPrice)} ·{" "}
        {booking.status}
        {booking.hasOpenMatch && " · OPEN MATCH"}
      </span>
      {booking.status === "CONFIRMED" && !booking.hasOpenMatch && booking.endsAt > new Date() && (
        <form action={openMatch} className="flex gap-1">
          <input type="hidden" name="bookingId" value={booking.id} />
          <select name="type" className="rounded border px-1">
            <option value="DOUBLES">Doubles</option>
            <option value="SINGLES">Singles</option>
          </select>
          <select name="level" className="rounded border px-1">
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="BEGINNER">Beginner</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <input name="note" placeholder="Note" className="w-24 rounded border px-1" />
          <button className="rounded border px-2 py-1">Open match</button>
        </form>
      )}
      {booking.status === "CONFIRMED" && (
        <form action={cancel}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <button
            className="rounded border px-2 py-1 disabled:opacity-40"
            disabled={!booking.canCancel}
            title={booking.canCancel ? "" : "Less than 24 h before the slot"}
          >
            Cancel
          </button>
        </form>
      )}
    </li>
  );
}

export default async function DevBookingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = typeof params.msg === "string" ? params.msg : null;
  const { upcoming, past } = await getMyBookings();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8 text-sm">
      <h1 className="text-2xl font-semibold">My bookings test</h1>
      {message && <p className="rounded border p-2">{message}</p>}
      <section className="space-y-2">
        <h2 className="font-medium">Upcoming ({upcoming.length})</h2>
        <ul className="space-y-2">
          {upcoming.map((b) => (
            <Row key={b.id} booking={b} />
          ))}
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-medium">Past and cancelled ({past.length})</h2>
        <ul className="space-y-2">
          {past.map((b) => (
            <Row key={b.id} booking={b} />
          ))}
        </ul>
      </section>
    </main>
  );
}
