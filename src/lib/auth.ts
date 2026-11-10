import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";
import { isRole } from "@/lib/roles";

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },

  // Google login radi tek kad se u .env dodaju ključevi (vidi SETUP.md).
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},

  user: {
    additionalFields: {
      // Korisnik bira ulogu pri registraciji, zato je input: true.
      // Dozvoljene vrednosti proverava hook ispod.
      role: {
        type: "string",
        required: false,
        defaultValue: "PLAYER",
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const role = (user as { role?: unknown }).role ?? "PLAYER";
          if (!isRole(role)) {
            throw new APIError("BAD_REQUEST", { message: "Nepoznata uloga korisnika." });
          }
          return { data: { ...user, role } };
        },
      },
      update: {
        // Uloga se ne menja kroz javni API za izmenu profila.
        before: async (data) => {
          const rest: Record<string, unknown> = { ...data };
          delete rest.role;
          return { data: rest };
        },
      },
    },
  },

  // Mora biti poslednji plugin: postavlja kolačiće kad se auth zove iz server akcija.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
