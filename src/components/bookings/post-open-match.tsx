"use client";

import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createOpenMatchSchema, type CreateOpenMatchInput } from "@/lib/validations/matches";
import { MATCH_TYPES, MATCH_TYPE_LABELS, SKILL_LEVELS, SKILL_LEVEL_LABELS } from "@/lib/matches";
import type { createOpenMatch } from "@/server/actions/matches";

export function PostOpenMatch({
  bookingId,
  clubName,
  courtName,
  action,
  onPosted,
}: {
  bookingId: string;
  clubName: string;
  courtName: string;
  action: typeof createOpenMatch;
  onPosted: () => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const inFlight = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<CreateOpenMatchInput>({
    resolver: zodResolver(createOpenMatchSchema),
    defaultValues: { bookingId, type: "SINGLES", level: "BEGINNER", note: "" },
  });

  async function submit(values: CreateOpenMatchInput) {
    if (inFlight.current) return;
    inFlight.current = true;
    clearErrors("root");
    try {
      const result = await action(values);
      if (!result.ok) {
        for (const field of ["type", "level", "note"] as const) {
          const message = result.fieldErrors?.[field]?.[0];
          if (message) setError(field, { type: "server", message });
        }
        setError("root", { message: result.error });
        toast.error(result.error);
        return;
      }
      toast.success("Meč je uspešno objavljen.");
      setOpen(false);
      onPosted();
    } catch {
      const message =
        "Potvrda objavljivanja nije primljena. Osveži rezervacije pre ponovnog pokušaja.";
      setError("root", { message });
      toast.error(message);
    } finally {
      inFlight.current = false;
    }
  }
  const control =
    "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <>
      <Button
        variant="outline"
        className="min-h-11"
        onClick={() => {
          clearErrors();
          setOpen(true);
        }}
      >
        Objavi meč
      </Button>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!inFlight.current) setOpen(value);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        >
          <DialogTitle>Objavi otvoreni meč</DialogTitle>
          <DialogDescription>
            {clubName} · {courtName}. Pozovi druge igrače da se priključe tvom terminu.
          </DialogDescription>
          <form
            onSubmit={(event) => {
              void handleSubmit(submit)(event);
            }}
            noValidate
            aria-busy={isSubmitting}
          >
            <input type="hidden" {...register("bookingId")} />
            <fieldset disabled={isSubmitting} className="space-y-4">
              <legend className="sr-only">Detalji otvorenog meča</legend>
              <div className="space-y-2">
                <Label htmlFor={`${id}-type`}>Tip meča</Label>
                <select
                  id={`${id}-type`}
                  className={control}
                  aria-invalid={Boolean(errors.type)}
                  aria-describedby={errors.type ? `${id}-type-error` : undefined}
                  {...register("type")}
                >
                  {MATCH_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {MATCH_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                {errors.type && (
                  <p id={`${id}-type-error`} role="alert" className="text-sm text-destructive">
                    {errors.type.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-level`}>Nivo igre</Label>
                <select
                  id={`${id}-level`}
                  className={control}
                  aria-invalid={Boolean(errors.level)}
                  aria-describedby={errors.level ? `${id}-level-error` : undefined}
                  {...register("level")}
                >
                  {SKILL_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {SKILL_LEVEL_LABELS[level]}
                    </option>
                  ))}
                </select>
                {errors.level && (
                  <p id={`${id}-level-error`} role="alert" className="text-sm text-destructive">
                    {errors.level.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-note`}>Napomena (opciono)</Label>
                <textarea
                  id={`${id}-note`}
                  rows={3}
                  className="w-full resize-y rounded-lg border border-input bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-invalid={Boolean(errors.note)}
                  aria-describedby={`${id}-note-hint${errors.note ? ` ${id}-note-error` : ""}`}
                  {...register("note")}
                />
                <p id={`${id}-note-hint`} className="text-xs text-muted-foreground">
                  Najviše 200 karaktera.
                </p>
                {errors.note && (
                  <p id={`${id}-note-error`} role="alert" className="text-sm text-destructive">
                    {errors.note.message}
                  </p>
                )}
              </div>
              {errors.root && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}
              <DialogFooter>
                <DialogClose
                  render={<Button variant="outline" className="min-h-11" disabled={isSubmitting} />}
                >
                  Odustani
                </DialogClose>
                <Button type="submit" className="min-h-11" disabled={isSubmitting}>
                  {isSubmitting ? "Objavljivanje…" : "Objavi meč"}
                </Button>
              </DialogFooter>
            </fieldset>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
