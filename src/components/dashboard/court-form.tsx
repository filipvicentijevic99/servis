"use client";

import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { courtSchema, type CourtInput } from "@/lib/validations/dashboard";
import { SURFACES, SURFACE_LABELS } from "@/lib/surfaces";
import type { OwnerClub } from "@/server/queries/dashboard";
import type { DashboardActionResult } from "@/server/actions/dashboard";

export function CourtForm({
  court,
  saveAction,
  onPendingChange,
  onSaved,
}: {
  court?: OwnerClub["courts"][number];
  saveAction: (values: CourtInput) => Promise<DashboardActionResult>;
  onPendingChange: (pending: boolean) => void;
  onSaved: () => void;
}) {
  const id = useId();
  const inFlight = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourtInput, unknown, z.output<typeof courtSchema>>({
    resolver: zodResolver(courtSchema),
    defaultValues: court ?? {
      name: "",
      surface: "CLAY",
      pricePerHour: 1500,
      indoor: false,
      isActive: true,
    },
  });

  async function submit(values: z.output<typeof courtSchema>) {
    if (inFlight.current) return;
    inFlight.current = true;
    onPendingChange(true);
    try {
      const result = await saveAction(values);
      if (result.ok) {
        onSaved();
        return;
      }
      setError("root", { message: result.error });
      for (const field of ["name", "surface", "pricePerHour", "indoor", "isActive"] as const) {
        const message = result.fieldErrors?.[field]?.[0];
        if (message) setError(field, { message }, { shouldFocus: true });
      }
    } finally {
      inFlight.current = false;
      onPendingChange(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="space-y-5 dark:scheme-dark"
    >
      <fieldset disabled={isSubmitting} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${id}-name`}>Naziv terena</Label>
          <Input
            id={`${id}-name`}
            className="h-11"
            maxLength={40}
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${id}-name-error` : undefined}
          />
          {errors.name && (
            <p id={`${id}-name-error`} role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-surface`}>Podloga</Label>
          <select
            id={`${id}-surface`}
            {...register("surface")}
            className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
            aria-invalid={!!errors.surface}
            aria-describedby={errors.surface ? `${id}-surface-error` : undefined}
          >
            {SURFACES.map((surface) => (
              <option key={surface} value={surface}>
                {SURFACE_LABELS[surface]}
              </option>
            ))}
          </select>
          {errors.surface && (
            <p id={`${id}-surface-error`} role="alert" className="text-sm text-destructive">
              {errors.surface.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-price`}>Cena po satu (RSD)</Label>
          <Input
            id={`${id}-price`}
            type="number"
            inputMode="numeric"
            min={100}
            max={100000}
            step={1}
            className="h-11"
            {...register("pricePerHour")}
            aria-invalid={!!errors.pricePerHour}
            aria-describedby={errors.pricePerHour ? `${id}-price-error` : undefined}
          />
          {errors.pricePerHour && (
            <p id={`${id}-price-error`} role="alert" className="text-sm text-destructive">
              {errors.pricePerHour.message}
            </p>
          )}
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" {...register("indoor")} className="size-5 accent-primary" />
          Zatvoreni teren
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            role="switch"
            {...register("isActive")}
            className="size-5 accent-primary"
          />
          Aktivan teren
        </label>
        <p className="text-xs text-muted-foreground">
          Neaktivan teren nije dostupan za nove rezervacije. Postojeće rezervacije ostaju sačuvane.
        </p>
      </fieldset>
      {errors.root && (
        <p role="alert" className="text-sm text-destructive">
          {errors.root.message}
        </p>
      )}
      <DialogFooter>
        <DialogClose
          disabled={isSubmitting}
          render={<Button type="button" variant="outline" className="min-h-11" />}
        >
          Odustani
        </DialogClose>
        <Button type="submit" disabled={isSubmitting} className="min-h-11">
          {isSubmitting ? "Čuvanje…" : court ? "Sačuvaj izmene" : "Dodaj teren"}
        </Button>
      </DialogFooter>
    </form>
  );
}
