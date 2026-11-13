import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin, Search, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getClubs } from "@/server/queries/clubs";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Pronađi klub",
    description: "Istraži teniske klubove u svom gradu.",
    icon: Search,
  },
  {
    title: "Izaberi termin",
    description: "Odaberi teren i vreme koje ti odgovara.",
    icon: CalendarDays,
  },
  {
    title: "Uživaj u igri",
    description: "Rezerviši teren i spremi se za meč.",
    icon: Trophy,
  },
];

const fallbackImages = [
  "/clubs/club-beograd.webp",
  "/clubs/club-novi-sad.webp",
  "/clubs/club-nis.webp",
];

export default async function Home() {
  const { items } = await getClubs({
    page: 1,
    surface: undefined,
  });
  const featured = items.slice(0, 3);

  return (
    <main>
      {/* Hero section */}
      <section className="bg-muted/40 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Tvoj sledeći teniski meč počinje ovde.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pronađi teniski teren, rezerviši termin i uživaj u igri.
          </p>

          <form
            action="/klubovi"
            method="get"
            className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="city" className="sr-only">
              Grad
            </label>

            <Input
              id="city"
              name="grad"
              placeholder="Unesi grad, npr. Beograd"
              className="h-11 flex-1"
            />

            <Button type="submit" className="h-11 px-6">
              <Search aria-hidden="true" />
              Pronađi teren
            </Button>
          </form>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold">Kako funkcioniše?</h2>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon aria-hidden="true" className="size-7" />
                </div>

                <h3 className="mt-5 text-xl font-semibold">{step.title}</h3>

                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured clubs from the database */}
      <section className="bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-3xl font-bold">Izdvojeni klubovi</h2>

            <Link
              href="/klubovi"
              className="inline-flex items-center gap-2 font-medium hover:underline"
            >
              Svi klubovi
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-muted-foreground">Trenutno nema dostupnih klubova.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {featured.map((club, index) => (
                <Link
                  key={club.id}
                  href={`/klub/${club.slug}`}
                  className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <Card className="h-full overflow-hidden pt-0 transition-shadow hover:shadow-md">
                    <div className="relative h-44 w-full">
                      <Image
                        src={club.image ?? fallbackImages[index % fallbackImages.length]}
                        alt={
                          club.image
                            ? `Teniski tereni kluba ${club.name}`
                            : "Ilustrativna fotografija teniskog terena"
                        }
                        fill
                        sizes="(max-width: 767px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <CardHeader>
                      <CardTitle className="group-hover:text-primary">{club.name}</CardTitle>

                      <CardDescription className="flex items-center gap-2">
                        <MapPin aria-hidden="true" className="size-4" />
                        {club.city}
                      </CardDescription>
                    </CardHeader>

                    <CardContent>
                      {club.minPrice !== null ? (
                        <p className="font-semibold">Od {formatPrice(club.minPrice)}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Cena nije dostupna</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Club owner CTA */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <Building2 aria-hidden="true" className="mx-auto size-10 text-primary" />

          <h2 className="mt-5 text-3xl font-bold">Imaš teniski klub?</h2>

          <p className="mt-4 text-muted-foreground">
            Predstavi svoj klub novim igračima i olakšaj rezervaciju terena.
          </p>

          <Button nativeButton={false} render={<Link href="/registracija" />} className="mt-6">
            Dodaj svoj klub
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </section>
    </main>
  );
}
