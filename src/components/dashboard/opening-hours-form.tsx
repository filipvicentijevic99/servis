"use client";

import { useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DAY_LABELS } from "@/lib/format";
import type { DayHours } from "@/lib/opening-hours";
import { openingHoursSchema, type OpeningHoursInput } from "@/lib/validations/dashboard";
import type { DashboardActionResult } from "@/server/actions/dashboard";

export function OpeningHoursForm({
  clubId,
  week,
  saveAction,
}: {
  clubId: string;
  week: DayHours[];
  saveAction: (values: OpeningHoursInput) => Promise<DashboardActionResult>;
}) {
  const id = useId();
  const inFlight = useRef(false);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpeningHoursInput>({
    resolver: zodResolver(openingHoursSchema),
    defaultValues: { clubId, days: week },
  });
  const days = useWatch({ control, name: "days" });
  async function submit(values: OpeningHoursInput) {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const result = await saveAction(values);
      if (result.ok) {
        reset(values);
        toast.success("Radno vreme je sačuvano.");
        router.refresh();
      } else {
        setError("root", { message: result.fieldErrors?.days?.[0] ?? result.error });
        toast.error(result.error);
      }
    } catch {
      const message = "Čuvanje radnog vremena nije potvrđeno. Pokušaj ponovo.";
      setError("root", { message });
      toast.error(message);
    } finally {
      inFlight.current = false;
    }
  }
  return (
    <section className="space-y-4" aria-labelledby={`${id}-title`}>
      <div>
        <h3 id={`${id}-title`} className="text-xl font-semibold">
          Radno vreme
        </h3>
        <p className="text-sm text-muted-foreground">
          Europe/Belgrade · zatvaranje u 00:00 označava ponoć.
        </p>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          void handleSubmit(submit)(event);
        }}
        className="space-y-4 dark:scheme-dark"
        aria-busy={isSubmitting}
      >
        <fieldset disabled={isSubmitting} className="divide-y rounded-xl border bg-card px-4">
          <legend className="sr-only">Radno vreme po danima</legend>
          {week.map((day, index) => {
            const error = errors.days?.[index];
            const message = error?.openTime?.message ?? error?.closeTime?.message;
            return (
              <div
                key={day.dayOfWeek}
                className="grid gap-3 py-4 sm:grid-cols-[minmax(8rem,1fr)_auto_2fr] sm:items-center"
              >
                <span className="font-medium">{DAY_LABELS[day.dayOfWeek]}</span>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked={day.closed}
                    role="switch"
                    className="size-5 accent-primary"
                    {...register(`days.${index}.closed`)}
                    aria-label={`${DAY_LABELS[day.dayOfWeek]} zatvoreno`}
                  />
                  Zatvoreno
                </label>
                <fieldset
                  disabled={days[index]?.closed}
                  className="grid min-w-0 grid-cols-2 gap-3 disabled:opacity-50"
                >
                  <legend className="sr-only">{DAY_LABELS[day.dayOfWeek]}</legend>
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor={`${id}-${index}-open`}>Od</Label>
                    <Input
                      id={`${id}-${index}-open`}
                      type="time"
                      defaultValue={day.openTime}
                      step={60}
                      className="h-11"
                      {...register(`days.${index}.openTime`)}
                      aria-label={`${DAY_LABELS[day.dayOfWeek]} otvaranje`}
                      aria-invalid={!!message}
                      aria-describedby={message ? `${id}-${index}-error` : undefined}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <Label htmlFor={`${id}-${index}-close`}>Do</Label>
                    <Input
                      id={`${id}-${index}-close`}
                      type="time"
                      defaultValue={day.closeTime}
                      step={60}
                      className="h-11"
                      {...register(`days.${index}.closeTime`)}
                      aria-label={`${DAY_LABELS[day.dayOfWeek]} zatvaranje`}
                      aria-invalid={!!message}
                      aria-describedby={message ? `${id}-${index}-error` : undefined}
                    />
                  </div>
                </fieldset>
                {message && (
                  <p
                    role="alert"
                    id={`${id}-${index}-error`}
                    className="text-sm text-destructive sm:col-span-3"
                  >
                    {message}
                  </p>
                )}
              </div>
            );
          })}
        </fieldset>
        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button disabled={isSubmitting} type="submit" className="min-h-11">
          {isSubmitting ? "Čuvanje…" : "Sačuvaj radno vreme"}
        </Button>
      </form>
    </section>
  );
}
