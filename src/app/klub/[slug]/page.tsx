import { notFound } from "next/navigation";
import { MapPin, Phone } from "lucide-react";
import { getClub } from "@/server/queries/clubs";
import { ClubGallery } from "@/components/club-details/gallery";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BookingPicker } from "@/components/club-details/booking-picker";
import { Toaster } from "@/components/ui/sonner";
import { getSession } from "@/lib/session";
import { bookingDateRange } from "@/lib/booking-picker";
import { DAY_LABELS, formatPrice } from "@/lib/format";
import { SURFACE_LABELS } from "@/lib/surfaces";
import { phoneHref } from "@/lib/club-details";

export default async function ClubPage({ params }: PageProps<"/klub/[slug]">) {
  const club = await getClub((await params).slug);
  if (!club) notFound();
  const session = await getSession();
  const dates = bookingDateRange();
  const phone = phoneHref(club.phone);
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Teniski klub · {club.city}</p>
        <h1 className="text-3xl font-bold break-words sm:text-5xl">{club.name}</h1>
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
          {club.address}, {club.city}
        </p>
      </header>
      <ClubGallery
        key={club.id}
        images={club.images.filter((image) => image.trim())}
        name={club.name}
      />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section aria-labelledby="about-club" className="space-y-3">
            <h2 id="about-club" className="text-2xl font-semibold">
              O klubu
            </h2>
            <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
              {club.description?.trim() || "Opis kluba trenutno nije dostupan."}
            </p>
          </section>
          <section aria-labelledby="club-courts" className="space-y-4">
            <h2 id="club-courts" className="text-2xl font-semibold">
              Tereni
            </h2>
            <p id="booking-availability" className="text-sm text-muted-foreground">
              Izaberi datum i slobodan termin. Sva vremena prikazana su po lokalnom vremenu u
              Srbiji.
            </p>
            {club.courts.length ? (
              <ul className="space-y-4">
                {club.courts.map((court) => (
                  <li key={court.id}>
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold">{court.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {SURFACE_LABELS[court.surface]} ·{" "}
                          {court.indoor ? "Zatvoreni teren" : "Otvoreni teren"}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="font-semibold">
                          {formatPrice(court.pricePerHour)}{" "}
                          <span className="font-normal text-muted-foreground">/ sat</span>
                        </p>
                        <BookingPicker
                          courtId={court.id}
                          courtName={court.name}
                          clubName={club.name}
                          slug={club.slug}
                          price={court.pricePerHour}
                          minDate={dates.min}
                          maxDate={dates.max}
                          signedIn={Boolean(session)}
                        />
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-muted-foreground">
                Trenutno nema aktivnih terena.
              </p>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Kontakt</h2>
            </CardHeader>
            <CardContent>
              {phone ? (
                <a
                  href={phone}
                  className="inline-flex min-h-11 items-center gap-2 rounded-sm break-all underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0" />
                  {club.phone}
                </a>
              ) : (
                <p className="text-muted-foreground">
                  {club.phone || "Kontakt telefon nije dostupan."}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Radno vreme</h2>
              <p className="text-sm text-muted-foreground">Lokalno vreme · Srbija</p>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const hours = club.openingHours.find((entry) => entry.dayOfWeek === day);
                  return (
                    <div
                      key={day}
                      className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm"
                    >
                      <dt>{DAY_LABELS[day]}</dt>
                      <dd className="text-muted-foreground">
                        {hours ? `${hours.openTime}–${hours.closeTime}` : "Zatvoreno"}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
      <Toaster containerAriaLabel="Obaveštenja" />
    </main>
  );
}
