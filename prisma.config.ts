import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Same order as Next.js: .env.local takes precedence over .env.
config({ path: [".env.local", ".env"], quiet: true });

// Migrations use the direct (unpooled) connection; the app uses the pooled DATABASE_URL.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set in .env.local");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url,
  },
});
