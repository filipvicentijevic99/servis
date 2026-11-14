"use client";

import { useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs } from "@base-ui/react/tabs";
import { Tooltip } from "@base-ui/react/tooltip";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import type { MyBooking } from "@/server/queries/bookings";
import type { cancelBooking } from "@/server/actions/bookings";
import { bookingDateLabel, bookingTimeLabel } from "@/lib/my-bookings";
import { formatPrice } from "@/lib/format";
import { SURFACE_LABELS } from "@/lib/surfaces";

type Props = { upcoming: MyBooking[]; past: MyBooking[]; cancelAction: typeof cancelBooking };
const limitMessage = "Rezervaciju možeš otkazati najkasnije 24 sata pre početka termina.";

function Cancellation({
  booking,
  action,
  onSuccess,
}: {
  booking: MyBooking;
  action: typeof cancelBooking;
  onSuccess: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const explanationId = useId();
  const router = useRouter();

  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await action({ bookingId: booking.id });
      if (result.ok) {
        toast.success("Rezervacija je otkazana.");
        setOpen(false);
        onSuccess(booking.id);
      } else {
        setError(result.error);
        toast.error(result.error);
        router.refresh();
      }
    } catch {
      const message = "Potvrda otkazivanja nije primljena. Osveži listu pre ponovnog pokušaja.";
      setError(message);
      toast.error(message);
      router.refresh();
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (!booking.canCancel)
    return (
      <div className="space-y-2">
        <Tooltip.Root>
          <Tooltip.Trigger
            render={
              <span
                tabIndex={0}
                aria-describedby={explanationId}
                className="inline-block rounded-lg focus-visible:outline-2 focus-visible:outline-ring"
              />
            }
          >
            <Button disabled>Otkaži</Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner sideOffset={8}>
              <Tooltip.Popup
                role="tooltip"
                className="z-50 max-w-64 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-md"
              >
                {limitMessage}
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </Tooltip.Root>
        <p id={explanationId} className="text-xs text-muted-foreground">
          {limitMessage}
        </p>
      </div>
    );
  return (
    <>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Otkaži
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!submitting.current) setOpen(value);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogTitle>Otkaži rezervaciju?</DialogTitle>
          <DialogDescription>Potvrdi otkazivanje izabranog termina.</DialogDescription>
          <div className="space-y-2">
            <p className="font-semibold">{booking.club.name}</p>
            <p>{booking.court.name}</p>
            <p>
              {bookingDateLabel(booking.startsAt)},{" "}
              {bookingTimeLabel(booking.startsAt, booking.endsAt)}
            </p>
            <p>{formatPrice(booking.totalPrice)}</p>
          </div>
          {booking.hasOpenMatch && (
            <p className="rounded-lg border p-3 text-sm font-medium">
              Otkazivanjem rezervacije biće uklonjen i povezani otvoreni meč.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" className="min-h-11" disabled={pending} />}
            >
              Zadrži rezervaciju
            </DialogClose>
            <Button
              variant="destructive"
              className="min-h-11"
              disabled={pending}
              aria-busy={pending}
              onClick={confirm}
            >
              {pending ? "Otkazivanje…" : "Potvrdi otkazivanje"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function MyBookings({ upcoming, past, cancelAction }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [cancelled, setCancelled] = useState<string[]>([]);
  const active = upcoming.filter((booking) => !cancelled.includes(booking.id));
  const history = [
    ...upcoming
      .filter((booking) => cancelled.includes(booking.id))
      .map((booking): MyBooking => ({ ...booking, status: "CANCELLED", canCancel: false })),
    ...past,
  ];
  function onSuccess(id: string) {
    setCancelled((items) => [...items, id]);
    startRefresh(() => router.refresh());
  }

  function list(items: MyBooking[], isUpcoming: boolean) {
    if (!items.length)
      return (
        <div className="rounded-xl border border-dashed px-4 py-12 text-center">
          <h2 className="text-xl font-semibold">
            {isUpcoming ? "Nema predstojećih rezervacija" : "Nema prošlih rezervacija"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Pronađi klub i izaberi termin za sledeći meč.
          </p>
          <Link
            href="/klubovi"
            className="mt-4 inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
          >
            Pronađi klub
          </Link>
        </div>
      );
    return (
      <ul className="grid gap-4 md:grid-cols-2">
        {items.map((booking) => (
          <li key={booking.id}>
            <Card className="h-full">
              <CardHeader>
                <h2 className="text-xl font-semibold break-words">
                  <Link
                    href={`/klub/${booking.club.slug}`}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {booking.club.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {booking.club.city} · {booking.court.name} ·{" "}
                  {SURFACE_LABELS[booking.court.surface]}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {bookingDateLabel(booking.startsAt)}
                  <br />
                  <span className="text-muted-foreground">
                    {bookingTimeLabel(booking.startsAt, booking.endsAt)} · vreme u Srbiji
                  </span>
                </p>
                <p className="font-semibold">{formatPrice(booking.totalPrice)}</p>
                <p className="text-sm font-medium">
                  {booking.status === "CANCELLED"
                    ? "Otkazana"
                    : isUpcoming
                      ? "Potvrđena"
                      : "Završena"}
                </p>
                {isUpcoming && (
                  <Cancellation booking={booking} action={cancelAction} onSuccess={onSuccess} />
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Tooltip.Provider>
      <Tabs.Root defaultValue="upcoming" className="space-y-6" aria-busy={refreshing}>
        <Tabs.List
          activateOnFocus
          aria-label="Vrsta rezervacija"
          className="flex rounded-lg bg-muted p-1"
        >
          <Tabs.Tab
            value="upcoming"
            className="min-h-11 flex-1 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-background data-active:shadow-sm"
          >
            Predstojeće ({active.length})
          </Tabs.Tab>
          <Tabs.Tab
            value="past"
            className="min-h-11 flex-1 rounded-md px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-background data-active:shadow-sm"
          >
            Prošle ({history.length})
          </Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel
          value="upcoming"
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {list(active, true)}
        </Tabs.Panel>
        <Tabs.Panel
          value="past"
          className="outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {list(history, false)}
        </Tabs.Panel>
      </Tabs.Root>
    </Tooltip.Provider>
  );
}
