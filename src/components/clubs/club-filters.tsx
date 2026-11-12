import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SURFACES, SURFACE_LABELS, SURFACE_SLUGS } from "@/lib/surfaces";
import type { ClubFilters } from "@/lib/validations/clubs";

const selectClass =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ClubFiltersForm({ filters, cities }: { filters: ClubFilters; cities: string[] }) {
  // Keep a city from a shared URL visible even when it is not in the current city list.
  const cityOptions =
    filters.city && !cities.includes(filters.city) ? [filters.city, ...cities] : cities;
  return (
    <Form
      action="/klubovi"
      key={JSON.stringify(filters)}
      className="rounded-xl border bg-card p-4 sm:p-6"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Filtriraj teniske klubove</legend>
        <div className="space-y-2">
          <Label htmlFor="club-city">Grad</Label>
          <select
            id="club-city"
            name="grad"
            defaultValue={filters.city ?? ""}
            className={selectClass}
          >
            <option value="">Svi gradovi</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-surface">Podloga</Label>
          <select
            id="club-surface"
            name="podloga"
            defaultValue={filters.surface ? SURFACE_SLUGS[filters.surface] : ""}
            className={selectClass}
          >
            <option value="">Sve podloge</option>
            {SURFACES.map((surface) => (
              <option key={surface} value={SURFACE_SLUGS[surface]}>
                {SURFACE_LABELS[surface]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-price">Maksimalna cena (RSD / sat)</Label>
          <Input
            id="club-price"
            name="cena"
            type="number"
            min={1}
            max={100000}
            step={1}
            defaultValue={filters.maxPrice ?? ""}
            placeholder="Bez ograničenja"
            className="h-11"
          />
        </div>
        <div className="flex items-end gap-3">
          <Button type="submit" className="h-11 flex-1">
            Primeni filtere
          </Button>
          <Link
            href="/klubovi"
            className="rounded-sm py-3 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Poništi
          </Link>
        </div>
      </fieldset>
    </Form>
  );
}
