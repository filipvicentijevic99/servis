import { z } from "zod";
import { SURFACES } from "@/lib/surfaces";
import { isValidOpeningWindow } from "@/lib/opening-hours";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Court fields edited by the club owner. The same schema powers the add and edit forms. */
export const courtSchema = z.object({
  name: z.string().trim().min(1, "Unesi naziv terena.").max(40, "Naziv je predugačak."),
  surface: z.enum(SURFACES, "Izaberi podlogu."),
  indoor: z.boolean(),
  pricePerHour: z.coerce
    .number("Unesi cenu.")
    .int("Cena mora biti ceo broj.")
    .min(100, "Cena mora biti bar 100 RSD.")
    .max(100_000, "Cena je prevelika."),
  isActive: z.boolean(),
});

export const createCourtSchema = courtSchema.extend({ clubId: z.string().min(1) });
export const updateCourtSchema = courtSchema.extend({ courtId: z.string().min(1) });
export const courtIdSchema = z.object({ courtId: z.string().min(1) });

const dayHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    closed: z.boolean(),
    openTime: z.string().regex(TIME, "Vreme mora biti u formatu HH:MM."),
    closeTime: z.string().regex(TIME, "Vreme mora biti u formatu HH:MM."),
  })
  .refine((d) => d.closed || isValidOpeningWindow(d.openTime, d.closeTime), {
    message: "Klub mora raditi bar sat vremena, a zatvaranje mora biti posle otvaranja.",
    path: ["closeTime"],
  });

export const openingHoursSchema = z.object({
  clubId: z.string().min(1),
  days: z
    .array(dayHoursSchema)
    .length(7)
    .refine(
      (days) => new Set(days.map((d) => d.dayOfWeek)).size === 7,
      "Svaki dan mora biti tačno jednom.",
    ),
});

export type CourtInput = z.input<typeof courtSchema>;
export type CreateCourtInput = z.input<typeof createCourtSchema>;
export type UpdateCourtInput = z.input<typeof updateCourtSchema>;
export type OpeningHoursInput = z.input<typeof openingHoursSchema>;
