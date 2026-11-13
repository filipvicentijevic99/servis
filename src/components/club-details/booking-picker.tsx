"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { SlotGrid } from "./slot-grid";
import { clubLoginUrl, formatBookingDate, type PickerSlot } from "@/lib/booking-picker";
import { formatBelgradeTime } from "@/lib/time";
import { formatPrice } from "@/lib/format";
import { confirmCourtBooking } from "@/server/actions/booking-picker";

type Props = {
  courtId: string;
  courtName: string;
  clubName: string;
  slug: string;
  price: number;
  minDate: string;
  maxDate: string;
  signedIn: boolean;
};

export function BookingPicker({
  courtId,
  courtName,
  clubName,
  slug,
  price,
  minDate,
  maxDate,
  signedIn,
}: Props) {
  const id = useId();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [date, setDate] = useState(minDate);
  const [selected, setSelected] = useState<PickerSlot | null>(null);
  const [version, setVersion] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(!signedIn);
  const [message, setMessage] = useState<string | null>(null);
  const inFlight = useRef(false);
  function refreshSlots() {
    setSelected(null);
    setVersion((value) => value + 1);
  }

  async function book() {
    if (!selected || pending || inFlight.current || needsLogin) return;
    inFlight.current = true;
    setPending(true);
    setMessage(null);
    try {
      const result = await confirmCourtBooking({ courtId, startsAt: selected.startsAt });
      if (result.ok) {
        toast.success("Termin je uspešno rezervisan.");
        router.refresh();
      } else {
        setMessage(result.error);
        toast.error(result.error);
        if (result.requiresLogin) setNeedsLogin(true);
      }
    } catch {
      const error =
        "Potvrda rezervacije nije primljena. Proveri svoje rezervacije pre ponovnog pokušaja.";
      setMessage(error);
      toast.error(error);
    } finally {
      setConfirming(false);
      refreshSlots();
      setPending(false);
      inFlight.current = false;
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        aria-expanded={expanded}
        aria-controls={`${id}-picker`}
        className="min-h-11"
        onClick={() => setExpanded((value) => !value)}
        disabled={pending}
      >
        {expanded ? "Sakrij termine" : "Izaberi termin"}
      </Button>
      {expanded && (
        <div id={`${id}-picker`} className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor={`${id}-date`}>Datum termina</Label>
            <Input
              id={`${id}-date`}
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              disabled={pending}
              className="h-11 w-full"
              onChange={(event) => {
                setDate(event.target.value);
                setSelected(null);
                setMessage(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              Od danas do narednih 14 dana · Europe/Belgrade
            </p>
          </div>
          {date >= minDate && date <= maxDate ? (
            <SlotGrid
              key={`${date}-${version}`}
              courtId={courtId}
              date={date}
              selected={selected?.startsAt ?? null}
              onSelect={setSelected}
              disabled={pending || needsLogin}
              onRetry={refreshSlots}
            />
          ) : (
            <p role="alert" className="text-sm text-destructive">
              Izaberi datum unutar ponuđenog perioda.
            </p>
          )}
          {needsLogin ? (
            <p className="text-sm">
              <Link
                href={clubLoginUrl(slug)}
                className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
              >
                Prijavi se da rezervišeš termin
              </Link>
            </p>
          ) : (
            <Button
              className="min-h-11 w-full"
              disabled={!selected || pending}
              onClick={() => setConfirming(true)}
            >
              Rezerviši
            </Button>
          )}
          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
        </div>
      )}
      <Dialog
        open={confirming}
        onOpenChange={(open) => {
          if (!inFlight.current) setConfirming(open);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogTitle>Potvrdi rezervaciju</DialogTitle>
          <DialogDescription>Proveri detalje pre potvrde. Cena je za jedan sat.</DialogDescription>
          {selected && (
            <dl className="space-y-3">
              <div>
                <dt className="text-muted-foreground">Klub</dt>
                <dd className="font-medium">{clubName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Teren</dt>
                <dd>{courtName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Datum i vreme · Srbija</dt>
                <dd>
                  {formatBookingDate(date)}, {selected.label}–
                  {formatBelgradeTime(new Date(selected.endsAt))}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Cena</dt>
                <dd className="font-semibold">{formatPrice(price)}</dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" className="min-h-11" disabled={pending} />}
            >
              Odustani
            </DialogClose>
            <Button onClick={book} className="min-h-11" disabled={pending} aria-busy={pending}>
              {pending ? "Rezervisanje…" : "Potvrdi rezervaciju"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
