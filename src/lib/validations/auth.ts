import { z } from "zod";
import { ROLES } from "@/lib/roles";

// The same schemas are used by forms (React Hook Form + zodResolver) and server actions.

export const loginSchema = z.object({
  email: z.email("Unesi ispravnu email adresu."),
  password: z.string().min(1, "Unesi lozinku."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Ime mora imati bar 2 slova.").max(60, "Ime je predugačko."),
    email: z.email("Unesi ispravnu email adresu."),
    password: z
      .string()
      .min(8, "Lozinka mora imati bar 8 karaktera.")
      .max(128, "Lozinka je predugačka."),
    confirmPassword: z.string(),
    role: z.enum(ROLES, "Izaberi ulogu."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Lozinke se ne poklapaju.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
