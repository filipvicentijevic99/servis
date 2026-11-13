import type { Metadata } from "next";
import { getMyBookings } from "@/server/queries/bookings";
import { cancelBooking } from "@/server/actions/bookings";
import { MyBookings } from "@/components/bookings/my-bookings";

export const metadata: Metadata = {
  title: "Moje rezervacije | Servis",
  robots: { index: false, follow: false },
};

export default async function MyBookingsPage() {
  const bookings = await getMyBookings();
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:py-16">
      <header>
        <h1 className="text-3xl font-bold">Moje rezervacije</h1>
        <p className="mt-3 text-muted-foreground">
          Pregledaj svoje termine i upravljaj rezervacijama.
        </p>
      </header>
      <MyBookings {...bookings} cancelAction={cancelBooking} />
    </main>
  );
}
