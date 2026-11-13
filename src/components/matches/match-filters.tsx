import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MATCH_TYPES,
  MATCH_TYPE_LABELS,
  MATCH_TYPE_SLUGS,
  SKILL_LEVELS,
  SKILL_LEVEL_LABELS,
  SKILL_LEVEL_SLUGS,
} from "@/lib/matches";
import type { MatchFilters } from "@/lib/validations/matches";

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function MatchFiltersForm({ filters }: { filters: MatchFilters }) {
  return (
    <Form
      action="/mecevi"
      key={JSON.stringify(filters)}
      className="rounded-xl border bg-card p-4 sm:p-6"
    >
      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Filteri otvorenih mečeva</legend>
        <div className="space-y-2">
          <Label htmlFor="match-city">Grad</Label>
          <Input
            id="match-city"
            name="grad"
            maxLength={60}
            defaultValue={filters.city ?? ""}
            placeholder="Svi gradovi"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="match-level">Nivo</Label>
          <select
            id="match-level"
            name="nivo"
            defaultValue={filters.level ? SKILL_LEVEL_SLUGS[filters.level] : ""}
            className={selectClass}
          >
            <option value="">Svi nivoi</option>
            {SKILL_LEVELS.map((level) => (
              <option key={level} value={SKILL_LEVEL_SLUGS[level]}>
                {SKILL_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="match-type">Tip meča</Label>
          <select
            id="match-type"
            name="tip"
            defaultValue={filters.type ? MATCH_TYPE_SLUGS[filters.type] : ""}
            className={selectClass}
          >
            <option value="">Svi tipovi</option>
            {MATCH_TYPES.map((type) => (
              <option key={type} value={MATCH_TYPE_SLUGS[type]}>
                {MATCH_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="match-date">Datum (vreme u Srbiji)</Label>
          <Input
            id="match-date"
            name="datum"
            type="date"
            defaultValue={filters.date ?? ""}
            className="h-11"
          />
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button type="submit" className="min-h-11">
          Primeni filtere
        </Button>
        <Link
          href="/mecevi"
          className="rounded-sm py-2 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Poništi
        </Link>
      </div>
    </Form>
  );
}
