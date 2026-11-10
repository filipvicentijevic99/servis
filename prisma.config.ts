import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Isti redosled kao Next.js: .env.local ima prednost nad .env.
config({ path: [".env.local", ".env"], quiet: true });

// Migracije idu preko direktne (unpooled) konekcije, aplikacija koristi pooled DATABASE_URL.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL nije podešen u .env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
