# Servis

A tennis court booking platform: find a club, book a court and find a partner for your match.

> Live demo: _coming soon_ · Status: in development

## Features

- Search clubs by city, court surface and price
- Availability calendar and bookings without double-booking
- My bookings, with cancellation up to 24 h before the slot
- Open matches: post a booking that needs a partner, or join someone else's
- Club owner dashboard: courts, opening hours, occupancy and revenue
- Email confirmations, responsive design, light and dark theme

The app is built for the Serbian market, so the UI is in Serbian (Latin script); code, docs and the Git history are in English.

## Tech stack

Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · PostgreSQL (Neon) · Prisma · Better Auth · Zod · Vercel

## Getting started

Requirements: Node.js 22+ and a free [Neon](https://neon.com) Postgres database.

```bash
git clone https://github.com/filipvicentijevic99/servis.git
cd servis
npm install
```

Create `.env.local` from [`.env.example`](.env.example). The easiest way to fill in the database variables is `neon init`, which writes them for you. Then add `BETTER_AUTH_SECRET` (generate it with `npx auth@latest secret`) and run:

```bash
npx prisma migrate dev
npx prisma generate
npm run db:seed
npm run dev
```

The app runs at http://localhost:3000. The seed creates test accounts (password `lozinka123`), e.g. `vlasnik1@servis.test` (club owner) and `igrac1@servis.test` (player).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Type check (generates Next.js route types first) |
| `npm run format` | Format code with Prettier |
| `npm run db:seed` | Fill the database with test data |
| `npx prisma studio` | Browse the database |

## How we work

Every task is a GitHub issue on the [project board](../../projects). Work happens on a feature branch and goes through a pull request, CI and code review; `main` is protected. Conventions are in [CLAUDE.md](CLAUDE.md).

## How we used AI

_To be written at the end of the project: what the AI (Claude Code) did and what we did._

## Team

- [Filip Vicentijević](https://github.com/filipvicentijevic99): architecture, backend, code review
- [Tijana Đuknić](https://github.com/tijana333): frontend, UI
