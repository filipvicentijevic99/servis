"use client";

import { useEffect, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import type { PickerAvailability, PickerSlot } from "@/lib/booking-picker";

export function SlotGrid({
  courtId,
  date,
  selected,
  onSelect,
  disabled,
  onRetry,
  onChooseDate,
}: {
  courtId: string;
  date: string;
  selected: string | null;
  onSelect: (slot: PickerSlot) => void;
  disabled: boolean;
  onRetry: () => void;
  onChooseDate: () => void;
}) {
  const [result, setResult] = useState<PickerAvailability | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(
          `/api/tereni/${encodeURIComponent(courtId)}/termini?${new URLSearchParams({ datum: date })}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data: PickerAvailability = await response.json();
        if (!controller.signal.aborted) setResult(data);
      } catch {
        if (!controller.signal.aborted)
          setResult({
            ok: false,
            error: "Termine nije moguće učitati. Proveri vezu i pokušaj ponovo.",
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [courtId, date]);

  if (!result)
    return (
      <p role="status" className="py-4 text-sm text-muted-foreground">
        Učitavanje termina…
      </p>
    );
  if (!result.ok)
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive">
          {result.error}
        </p>
        <Button variant="outline" className="min-h-11" onClick={onRetry}>
          Pokušaj ponovo
        </Button>
      </div>
    );
  if (!result.slots.length)
    return (
      <div role="status">
        <EmptyState
          icon={CalendarX2}
          heading="h3"
          title="Nema termina za ovaj datum"
          description="Klub je zatvoren ili nema dovoljno vremena za termin."
        >
          <Button variant="outline" className="min-h-11" onClick={onChooseDate}>
            Izaberi drugi datum
          </Button>
        </EmptyState>
      </div>
    );
  return (
    <div className="space-y-3">
      <div
        role="group"
        aria-label="Termini po lokalnom vremenu u Srbiji"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {result.slots.map((slot) => (
          <Button
            key={slot.startsAt}
            variant={selected === slot.startsAt ? "default" : "outline"}
            className="h-auto min-h-11 flex-col py-2"
            disabled={disabled || slot.status !== "available"}
            aria-pressed={selected === slot.startsAt}
            onClick={() => onSelect(slot)}
          >
            <span>{slot.label}</span>
            <span className="text-xs">
              {slot.status === "booked" ? "Zauzet" : slot.status === "past" ? "Prošao" : "Slobodan"}
            </span>
          </Button>
        ))}
      </div>
      {!result.slots.some((slot) => slot.status === "available") && (
        <div role="status">
          <EmptyState
            icon={CalendarX2}
            heading="h3"
            title="Nema slobodnih termina"
            description="Svi termini su zauzeti ili su već prošli. Izaberi datum koji ti odgovara."
          >
            <Button variant="outline" className="min-h-11" onClick={onChooseDate}>
              Izaberi drugi datum
            </Button>
          </EmptyState>
        </div>
      )}
    </div>
  );
}
