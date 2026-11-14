import { useId } from "react";
import { Banknote, CalendarCheck, ChartNoAxesColumn } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPrice } from "@/lib/format";
import type { ClubStats } from "@/lib/dashboard-stats";
import {
  revenueChartGeometry,
  REVENUE_CHART_HEIGHT,
  REVENUE_CHART_WIDTH,
} from "@/lib/dashboard-charts";

const axisNumber = new Intl.NumberFormat("sr-Latn-RS", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const percent = (value: number) => `${value} %`;
const summaryClass =
  "min-h-11 cursor-pointer py-3 text-sm font-medium underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring";

export function DashboardAnalytics({ stats }: { stats: ClubStats }) {
  const id = useId();
  const hasCapacity = stats.occupancyByCourt.some((court) => court.openHours > 0);
  const hasBookings = stats.revenueByDay.some((day) => day.bookings > 0);
  const { maximum, points, area } = revenueChartGeometry(stats.revenueByDay);
  const ticks = [maximum, maximum / 2, 0];
  const dates = stats.revenueByDay.filter(
    (_, index, days) =>
      index === 0 || index === Math.floor((days.length - 1) / 2) || index === days.length - 1,
  );

  return (
    <section className="min-w-0 space-y-5" aria-labelledby={`${id}-title`}>
      <header className="space-y-1">
        <h3 id={`${id}-title`} className="text-xl font-semibold">
          Pregled poslovanja
        </h3>
        <p className="text-sm text-muted-foreground">Potvrđene rezervacije · Europe/Belgrade</p>
      </header>
      <dl className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Prihod ovog meseca",
            value: formatPrice(stats.summary.revenueThisMonth),
            note: "Od prvog dana meseca do danas",
            Icon: Banknote,
          },
          {
            label: "Broj rezervacija",
            value: stats.summary.bookingsThisMonth.toLocaleString("sr-RS"),
            note: "Potvrđene ovog meseca do danas",
            Icon: CalendarCheck,
          },
          {
            label: "Prosečna popunjenost",
            value: hasCapacity ? percent(stats.summary.averageOccupancy) : "—",
            note: "Aktivni tereni · poslednjih 30 dana",
            Icon: ChartNoAxesColumn,
          },
        ].map(({ label, value, note, Icon }) => (
          <Card key={label}>
            <dt className="flex items-start justify-between gap-2 px-4 text-sm text-muted-foreground">
              {label}
              <Icon aria-hidden="true" className="size-5 shrink-0" />
            </dt>
            <dd className="space-y-3 px-4">
              <span className="block text-2xl font-semibold break-words tabular-nums lg:text-3xl">
                {value}
              </span>
              <span className="block text-xs text-muted-foreground">{note}</span>
            </dd>
          </Card>
        ))}
      </dl>
      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <h4 id={`${id}-revenue-title`} className="font-semibold">
              Prihod po danima
            </h4>
            <p className="text-sm text-muted-foreground">
              Poslednjih 30 dana, uključujući danas · RSD
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasBookings ? (
              <figure aria-labelledby={`${id}-revenue-title`}>
                <div className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-2">
                  <div
                    aria-hidden="true"
                    className="flex h-44 flex-col justify-between text-right text-xs text-muted-foreground sm:h-52"
                  >
                    {ticks.map((value, index) => (
                      <span key={index}>{axisNumber.format(value)}</span>
                    ))}
                  </div>
                  <svg
                    role="img"
                    aria-labelledby={`${id}-revenue-svg-title ${id}-revenue-desc`}
                    viewBox={`0 0 ${REVENUE_CHART_WIDTH} ${REVENUE_CHART_HEIGHT}`}
                    preserveAspectRatio="none"
                    className="h-44 w-full overflow-visible sm:h-52"
                  >
                    <title id={`${id}-revenue-svg-title`}>Prihod za poslednjih 30 dana u RSD</title>
                    <desc id={`${id}-revenue-desc`}>
                      Linija prikazuje dnevni zbir cena potvrđenih rezervacija. Tačne vrednosti
                      dostupne su u tabeli ispod grafikona.
                    </desc>
                    {[0, REVENUE_CHART_HEIGHT / 2, REVENUE_CHART_HEIGHT].map((y) => (
                      <line
                        key={y}
                        x1={0}
                        y1={y}
                        x2={REVENUE_CHART_WIDTH}
                        y2={y}
                        className="stroke-border"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <polygon points={area} className="fill-primary/10" />
                    <polyline
                      points={points}
                      fill="none"
                      className="stroke-primary"
                      strokeWidth={2}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  <div
                    aria-hidden="true"
                    className="col-start-2 mt-3 flex justify-between gap-1 text-xs text-muted-foreground"
                  >
                    {dates.map((day) => (
                      <span key={day.date}>{day.label}</span>
                    ))}
                  </div>
                </div>
                <figcaption className="sr-only">
                  Otkazane rezervacije nisu uključene u prihod.
                </figcaption>
              </figure>
            ) : (
              <p className="flex min-h-52 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
                Nema potvrđenih rezervacija u poslednjih 30 dana.
              </p>
            )}
            {hasBookings && (
              <details>
                <summary className={summaryClass}>Prikaži dnevne podatke</summary>
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">
                    Dnevni prihod i broj potvrđenih rezervacija za poslednjih 30 dana
                  </caption>
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="py-2 font-medium">
                        Datum
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">
                        Rezervacije
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Prihod
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.revenueByDay.map((day) => (
                      <tr key={day.date} className="border-b last:border-0">
                        <th scope="row" className="py-2 font-normal">
                          <time dateTime={day.date}>{day.label}</time>
                        </th>
                        <td className="px-2 py-2 text-right tabular-nums">{day.bookings}</td>
                        <td className="py-2 text-right break-words tabular-nums">
                          {formatPrice(day.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <h4 id={`${id}-occupancy-title`} className="font-semibold">
              Popunjenost po terenu
            </h4>
            <p className="text-sm text-muted-foreground">Aktivni tereni · poslednjih 30 dana</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {!stats.occupancyByCourt.length ? (
              <p className="flex min-h-52 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
                Nema aktivnih terena za obračun popunjenosti.
              </p>
            ) : !hasCapacity ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                Popunjenost nije dostupna jer prema trenutnom radnom vremenu nema raspoloživih
                termina u ovom periodu.
              </p>
            ) : (
              <figure aria-labelledby={`${id}-occupancy-title`} className="space-y-5">
                <div
                  aria-hidden="true"
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>0 %</span>
                  <span>50 %</span>
                  <span>100 %</span>
                </div>
                {stats.occupancyByCourt.map((court) => (
                  <div key={court.courtId} className="space-y-2">
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 font-medium break-words">{court.court}</span>
                      <span className="shrink-0 tabular-nums">
                        {court.openHours > 0 ? percent(court.occupancy) : "—"}
                      </span>
                    </div>
                    <svg
                      role="img"
                      aria-label={`${court.court}: ${court.openHours > 0 ? percent(court.occupancy) : "popunjenost nije dostupna"}`}
                      viewBox="0 0 100 12"
                      preserveAspectRatio="none"
                      className="h-5 w-full overflow-hidden rounded"
                    >
                      <rect width={100} height={12} className="fill-muted" />
                      <rect width={court.occupancy} height={12} className="fill-primary" />
                    </svg>
                  </div>
                ))}
                <figcaption className="text-xs text-muted-foreground">
                  Odnos rezervisanih i raspoloživih sati prema trenutnom radnom vremenu.
                </figcaption>
              </figure>
            )}
            {!!stats.occupancyByCourt.length && (
              <details>
                <summary className={summaryClass}>Prikaži sate po terenu</summary>
                <table className="w-full table-fixed text-left text-sm">
                  <caption className="sr-only">
                    Rezervisani i raspoloživi sati po aktivnom terenu
                  </caption>
                  <thead>
                    <tr className="border-b">
                      <th scope="col" className="py-2 font-medium">
                        Teren
                      </th>
                      <th scope="col" className="px-2 py-2 text-right font-medium">
                        Rezervisano (h)
                      </th>
                      <th scope="col" className="py-2 text-right font-medium">
                        Kapacitet (h)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.occupancyByCourt.map((court) => (
                      <tr key={court.courtId} className="border-b last:border-0">
                        <th scope="row" className="py-2 font-normal break-words">
                          {court.court}
                        </th>
                        <td className="px-2 py-2 text-right tabular-nums">
                          {court.bookedHours.toLocaleString("sr-RS", { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {court.openHours.toLocaleString("sr-RS")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </CardContent>
        </Card>
      </div>
      <details className="rounded-xl border px-4 py-2 text-sm">
        <summary className={summaryClass}>Kako se računaju pokazatelji?</summary>
        <div className="space-y-3 pb-3 text-muted-foreground">
          <p>
            Prihod i broj rezervacija obuhvataju potvrđene rezervacije prema datumu početka termina,
            od prvog dana meseca do danas, uključujući sve današnje termine. Prihod je zbir
            sačuvanih cena rezervacija, uključujući trenutno neaktivne terene. Otkazane rezervacije
            i budući datumi nisu uključeni.
          </p>
          <p>
            Popunjenost je odnos potvrđenih rezervisanih sati i raspoloživih jednosatnih termina na
            aktivnim terenima tokom poslednjih 30 kalendarskih dana, uključujući ceo današnji dan.
            Prosek je odnos ukupnih rezervisanih i raspoloživih sati svih aktivnih terena.
          </p>
          <p>
            Kapacitet se procenjuje prema trenutnom radnom vremenu i trenutnom spisku aktivnih
            terena; istorijske promene nisu evidentirane. Bez raspoloživih termina procenat se ne
            prikazuje. Svi datumi koriste vremensku zonu Europe/Belgrade.
          </p>
        </div>
      </details>
    </section>
  );
}
