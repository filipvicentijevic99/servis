@AGENTS.md

# Servis: tennis court booking

Full-stack app: clubs publish their courts and opening hours, players book slots and find partners through open matches, and club owners get a dashboard. A team of two works through GitHub issues and pull requests.

## Language

- Code, comments, commit messages, branch names, PRs, issues and docs: **English**.
- Everything the user sees in the app (labels, buttons, messages, errors, emails) and the URLs: **Serbian, Latin script**.

## Stack

- Next.js 16 (App Router, `src/` directory), TypeScript strict, React 19
- Tailwind CSS + shadcn/ui (`src/components/ui`), icons from `lucide-react`
- PostgreSQL (Neon) + Prisma 7: schema in `prisma/schema.prisma`, client generated into `src/generated/prisma`
- Environment variables live in `.env.local` (never committed); the full list is in `.env.example`
- Better Auth (email/password + Google), roles `PLAYER` and `CLUB_OWNER`
- Zod 4 for validation, React Hook Form for forms
- date-fns for dates, Recharts (via shadcn `chart`) for charts
- Prettier with the Tailwind plugin for formatting

## Commands

- `npm run dev`: dev server at http://localhost:3000
- `npm run lint`, `npm run typecheck`, `npm run format`: run before every commit
- `npx prisma migrate dev --name <name>`, then `npx prisma generate`: after changing the schema (Prisma 7 does not regenerate the client after a migration)
- `npm run db:seed`: reset and fill the database with test data (test accounts use the password `lozinka123`)
- `npx prisma studio`: browse the database

## Structure

```
src/
  app/                 routes (App Router)
    (public)/          home, clubs, klub/[id], mecevi
    (auth)/            login, registration
    igrac/             protected: signed-in users only
    dashboard/         protected: CLUB_OWNER only
    api/auth/[...all]/ Better Auth handler (do not change)
  components/
    ui/                shadcn components (add with `npx shadcn@latest add <name>`)
    <area>/            feature components, e.g. clubs/, booking/, matches/
  lib/
    prisma.ts          the only Prisma client: `import prisma from "@/lib/prisma"`
    auth.ts            Better Auth config (server only)
    auth-client.ts     browser client: useSession, signOut, signInWithGoogle
    session.ts         getSession, requireUser, requireRole (server only)
    roles.ts           ROLES, ROLE_LABELS, homeForRole
    validations/       Zod schemas shared by forms and server actions
    surfaces.ts        court surfaces: SURFACES, SURFACE_LABELS, URL slugs
    format.ts          display helpers: formatPrice, DAY_LABELS
  server/
    queries/           read-only data functions for Server Components (e.g. getClubs, getClub)
    actions/           server actions for mutations ("use server")
  proxy.ts             route protection (Next.js 16 name for middleware)
prisma/
  schema.prisma        data model
  seed.ts              test data
```

## Rules

### Code

- Server Components by default; `"use client"` only when you need state, effects or event handlers.
- Database access only on the server. Reads go in `src/server/queries` and are called from Server Components; mutations go in `src/server/actions`. Never import `@/lib/prisma` or `@/lib/auth` in a client component.
- Every server action: (1) checks the user with `requireUser()` / `requireRole()`, (2) validates input with a Zod schema from `src/lib/validations`, (3) returns an `ActionResult` (`{ ok: true, ... }` or `{ ok: false, error, fieldErrors? }`) instead of throwing to the UI.
- Never trust a role sent by the client; read it from the server session.
- Use the same Zod schema for the form (`zodResolver`) and the server action; never duplicate validation.
- Prices are `Int` in RSD. Display: `new Intl.NumberFormat("sr-RS").format(price) + " RSD"`.
- Store times in UTC and display them in `Europe/Belgrade`; format with date-fns and the `sr-Latn` locale.
- Don't hand-edit `src/generated/` or `src/components/ui/` unless that is the task.
- Don't add npm packages without asking in the issue or PR.

### UI

- Tailwind classes and shadcn components only; no separate CSS files.
- Mobile first: every page must work at 375 px width.
- Every list has a loading state (skeleton) and an empty state.
- Support light and dark themes: use shadcn tokens (`bg-background`, `text-muted-foreground`, ...), never hard-coded colors.

### Git

- Never commit directly to `main`. One branch per issue: `feature/<number>-short-description`, `fix/<number>-...`, `chore/<number>-...`.
- Conventional Commits in English: `feat: add club filters`, `fix: ...`, `chore: ...`, `docs: ...`, `refactor: ...`.
- Small PRs (about 300 lines max) with `Closes #<number>` in the description and screenshots for UI changes. Squash and merge.

## Working with AI

- One issue = one session. Start by reading the issue and its acceptance criteria and propose a plan before writing code.
- After making changes, run `npm run lint` and `npm run typecheck` and fix any errors.
- Explain what you changed and why, so the PR author can answer review questions.
- If something in the issue is unclear, ask instead of guessing.
