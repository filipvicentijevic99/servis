"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CourtForm } from "./court-form";
import { formatPrice } from "@/lib/format";
import { SURFACE_LABELS } from "@/lib/surfaces";
import type { OwnerClub } from "@/server/queries/dashboard";
import type {
  createCourt,
  deleteCourt,
  updateCourt,
  DashboardActionResult,
} from "@/server/actions/dashboard";

type Actions = {
  createCourt: typeof createCourt;
  updateCourt: typeof updateCourt;
  deleteCourt: typeof deleteCourt;
};
type Target = { kind: "form"; id?: string } | { kind: "delete"; id: string };

export function CourtManagement({ club, actions }: { club: OwnerClub; actions: Actions }) {
  const router = useRouter();
  const [target, setTarget] = useState<Target | null>(null);
  const [pending, setPending] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const court = club.courts.find((item) => item.id === target?.id);
  const missingCourt = !!target?.id && !court;
  const busy = pending || refreshing;
  function refresh() {
    startTransition(() => router.refresh());
  }
  function saved(message: string) {
    setTarget(null);
    toast.success(message);
    refresh();
  }
  async function run(action: () => Promise<DashboardActionResult>) {
    try {
      const result = await action();
      if (!result.ok) toast.error(result.error);
      return result;
    } catch {
      const result = {
        ok: false as const,
        error: "Izmena nije potvrđena. Proveri stanje terena pre ponovnog pokušaja.",
      };
      toast.error(result.error);
      refresh();
      return result;
    }
  }
  async function remove(deactivate: boolean) {
    if (!court || inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await run(() =>
        deactivate
          ? actions.updateCourt({ ...court, courtId: court.id, isActive: false })
          : actions.deleteCourt({ courtId: court.id }),
      );
      if (result.ok) saved(deactivate ? "Teren je deaktiviran." : "Teren je obrisan.");
      else {
        setError(result.error);
        refresh();
      }
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          setTarget(null);
          setError(null);
        }
      }}
    >
      <section className="space-y-4" aria-labelledby="courts-title" aria-busy={busy}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="courts-title" className="text-xl font-semibold">
              Tereni
            </h3>
            <p className="text-sm text-muted-foreground">
              Ukupno terena: {club.courts.length} · cene po satu
            </p>
          </div>
          <DialogTrigger
            disabled={busy}
            onClick={() => setTarget({ kind: "form" })}
            render={<Button className="min-h-11" />}
          >
            <Plus aria-hidden="true" />
            Dodaj teren
          </DialogTrigger>
        </div>
        {!club.courts.length ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            Nema terena. Dodaj prvi teren da bi igrači mogli da rezervišu termine.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full text-left text-sm max-sm:block">
              <caption className="sr-only">Tereni kluba {club.name}</caption>
              <thead className="bg-muted/50 max-sm:sr-only">
                <tr>
                  {["Naziv", "Podloga", "Cena / sat", "Status", "Akcije"].map((label) => (
                    <th key={label} scope="col" className="p-4 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y max-sm:block">
                {club.courts.map((item) => (
                  <tr
                    key={item.id}
                    className="max-sm:grid max-sm:grid-cols-2 max-sm:gap-3 max-sm:p-4"
                  >
                    <th
                      scope="row"
                      className="min-w-0 p-4 font-medium break-words max-sm:col-span-2 max-sm:p-0"
                    >
                      {item.name}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {item.indoor ? "Zatvoreni" : "Otvoreni"} teren
                      </span>
                    </th>
                    <td className="p-4 max-sm:p-0">
                      <span className="mb-1 block text-xs text-muted-foreground sm:hidden">
                        Podloga
                      </span>
                      {SURFACE_LABELS[item.surface]}
                    </td>
                    <td className="p-4 max-sm:p-0">
                      <span className="mb-1 block text-xs text-muted-foreground sm:hidden">
                        Cena / sat
                      </span>
                      {formatPrice(item.pricePerHour)}
                    </td>
                    <td className="p-4 max-sm:col-span-2 max-sm:p-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.isActive ? "Aktivan" : "Neaktivan"}
                      </span>
                    </td>
                    <td className="p-4 max-sm:col-span-2 max-sm:p-0">
                      <div className="flex flex-wrap gap-2">
                        <DialogTrigger
                          disabled={busy}
                          aria-label={`Izmeni teren ${item.name}`}
                          onClick={() => setTarget({ kind: "form", id: item.id })}
                          render={<Button variant="outline" className="min-h-11" />}
                        >
                          Izmeni
                        </DialogTrigger>
                        <DialogTrigger
                          disabled={busy}
                          aria-label={`Obriši teren ${item.name}`}
                          onClick={() => {
                            setError(null);
                            setTarget({ kind: "delete", id: item.id });
                          }}
                          render={<Button variant="destructive" className="min-h-11" />}
                        >
                          Obriši
                        </DialogTrigger>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {refreshing && (
          <p role="status" className="text-sm text-muted-foreground">
            Osvežavanje terena…
          </p>
        )}
      </section>
      {target && (
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        >
          <DialogTitle>
            {missingCourt
              ? "Teren više nije dostupan"
              : target.kind === "form"
                ? court
                  ? "Izmeni teren"
                  : "Dodaj teren"
                : court?.canDelete
                  ? "Obriši teren?"
                  : "Teren ima rezervacije"}
          </DialogTitle>
          <DialogDescription>
            {missingCourt
              ? "Teren je u međuvremenu uklonjen. Zatvori dijalog i proveri osveženi spisak terena."
              : target.kind === "form"
                ? "Podaci o terenu i dostupnosti za rezervisanje."
                : court?.canDelete
                  ? `Teren „${court.name}“ biće trajno obrisan. Ova radnja ne može da se poništi.`
                  : "Teren sa rezervacijama ne može da se obriše. Deaktivacija sprečava nove rezervacije i čuva postojeće."}
          </DialogDescription>
          {missingCourt ? (
            <DialogFooter>
              <DialogClose render={<Button variant="outline" className="min-h-11" />}>
                Zatvori
              </DialogClose>
            </DialogFooter>
          ) : target.kind === "form" ? (
            <CourtForm
              court={court}
              onPendingChange={setPending}
              onSaved={() => saved(court ? "Teren je ažuriran." : "Teren je dodat.")}
              saveAction={(values) =>
                run(() =>
                  court
                    ? actions.updateCourt({ ...values, courtId: court.id })
                    : actions.createCourt({ ...values, clubId: club.id }),
                )
              }
            />
          ) : (
            court && (
              <>
                <p className="font-medium break-words">{court.name}</p>
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
                {!court.canDelete && !court.isActive && (
                  <p className="text-sm text-muted-foreground">Ovaj teren je već deaktiviran.</p>
                )}
                <DialogFooter>
                  <DialogClose
                    disabled={pending}
                    render={<Button variant="outline" className="min-h-11" />}
                  >
                    Odustani
                  </DialogClose>
                  {court.isActive && (
                    <Button
                      disabled={busy}
                      variant="outline"
                      className="min-h-11"
                      onClick={() => {
                        void remove(true);
                      }}
                    >
                      {pending ? "Obrada…" : "Deaktiviraj teren"}
                    </Button>
                  )}
                  {court.canDelete && (
                    <Button
                      disabled={busy}
                      variant="destructive"
                      className="min-h-11"
                      onClick={() => {
                        void remove(false);
                      }}
                    >
                      {pending ? "Obrada…" : "Potvrdi brisanje"}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
