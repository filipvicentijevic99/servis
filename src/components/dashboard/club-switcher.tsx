import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { getOwnerClubs } from "@/server/queries/dashboard";

export function ClubSwitcher({
  clubs,
  selectedId,
}: {
  clubs: Awaited<ReturnType<typeof getOwnerClubs>>;
  selectedId?: string;
}) {
  if (clubs.length < 2 && clubs.some((club) => club.id === selectedId)) return null;
  if (!clubs.length) return null;
  return (
    <form
      action="/dashboard"
      className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 dark:scheme-dark"
    >
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="owner-club">Klub</Label>
        <select
          id="owner-club"
          name="klub"
          defaultValue={selectedId}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
        >
          {!clubs.some((club) => club.id === selectedId) && (
            <option value="" disabled>
              Izaberi klub
            </option>
          )}
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name} · {club.city}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="min-h-11">
        Prikaži klub
      </Button>
    </form>
  );
}
