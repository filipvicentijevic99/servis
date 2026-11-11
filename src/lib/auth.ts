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

  // Google login is enabled only when its keys are set in .env.local.
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
      // Users pick their role at sign-up, hence input: true.
      // The hook below validates the allowed values.
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
        // The role cannot be changed through the public profile update API.
        before: async (data) => {
          const rest: Record<string, unknown> = { ...data };
          delete rest.role;
          return { data: rest };
        },
      },
    },
  },

  // Must be the last plugin: sets cookies when auth is called from server actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type SessionUser = Session["user"];
