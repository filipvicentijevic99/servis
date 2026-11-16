# Showcase assets

These are Chrome captures of the application's existing pages and components, not design mockups or generated images.

## Source and scope

- Home, club, matches and booking GIF source: `main` at `4a096a7698163eb23e5ed6181e22fd1ca53c5e15`, captured on 2026-11-14. These original captures retain the navigation from that revision.
- Refreshed dashboard source: `main` at `98d0ce0439fa210588a878cacc1a2125195e99d9`, captured on 2026-11-16. The page includes the original KPI cards, revenue line chart, occupancy bars, court management and opening-hours form. Navbar includes the working theme selector.
- The captures render the original page functions, Navbar, Footer, shadcn components and compiled Tailwind styles. A temporary local browser harness replaces database queries, session lookups and mutation actions with isolated adapters. Next Link/Form/Image have browser-only adapters for navigation markup and local image assets; this is not a deployed Next.js end-to-end session.
- All clubs, users, matches, prices and opening hours shown are **showcase fixtures**. Names containing “demo” are intentional. No personal data, auth cookies or database credentials were used.
- The original booking capture clock is fixed to 2026-11-14 11:00 in Europe/Belgrade. The animation changes the date to November 15 and chooses 18:00–19:00 at 1,800 RSD.
- Dashboard statistics are calculated by the existing `buildClubStats` helper from deterministic in-memory booking rows over the 30 days ending November 16. Two active demo courts use the same fixture prices and weekly opening hours as court management. The captured 330,200 RSD, 169 monthly bookings and 40% occupancy describe these fixtures, not real business activity.
- The club has no supplied photos, so the original gallery fallback is preserved. Home uses the repository's existing illustrative images under `public/clubs/`; those are not claimed to depict the fixture clubs.
- The refreshed dashboard uses the real `ThemeProvider` and `ThemeToggle`. Light and dark were selected through the actual Svetla/Tamna menu options and their persisted values were checked. The original non-dashboard dark captures applied the CSS variant in their capture harness.

## Booking recording

The GIF records actual clicks and an input change on `BookingPicker`, including its original confirmation dialog, pending state, toast and availability refresh. Slot fixtures are produced by the existing `buildSlots` helper. A local in-memory confirmation adapter marks the selected slot booked for the next fixture response.

**No real booking action, database connection, reservation or email is involved.** The successful response is simulated. This is UI documentation, not a claim of integration-test coverage.

The six frames show:

1. Expanded date/slot picker.
2. Date changed from November 14 to November 15.
3. The 18:00 slot selected.
4. Club, court, date, time and price in the confirmation dialog.
5. Pending confirmation.
6. Success toast and the selected slot disabled as booked.

## Encoding and verification

- Screenshots: 1280 px wide, full page, WebP quality 86. Each light/dark pair uses identical fixtures and viewport settings.
- GIF: 800 × 600, six frames, 9.5-second loop, 128-color palette, no dithering.
- Combined media size: approximately 697 KiB. No external image hosting is required.
- Captures were checked for browser runtime errors, horizontal overflow and successful local image/font loads. The GIF checks confirmed the changed date, simulated action completion, success toast and refreshed availability. All eight screenshots and the six animation frames were visually inspected.
- Refreshed dashboard checks confirmed KPI/chart rendering, persistent theme changes, loaded fonts, no runtime errors and no horizontal overflow at 1280 px or 375 px. Both final WebP files were visually inspected and contain no EXIF/XMP metadata.
- These checks do not exercise production authentication or real mutation actions.

| Asset                                    | Dimensions  | Size (bytes) |
| ---------------------------------------- | ----------- | -----------: |
| [Home, light](home-light.webp)           | 1280 × 1864 |       99,046 |
| [Home, dark](home-dark.webp)             | 1280 × 1864 |       99,218 |
| [Club, light](club-light.webp)           | 1280 × 1848 |       59,878 |
| [Club, dark](club-dark.webp)             | 1280 × 1848 |       60,962 |
| [Matches, light](matches-light.webp)     | 1280 × 960  |       39,796 |
| [Matches, dark](matches-dark.webp)       | 1280 × 960  |       40,718 |
| [Dashboard, light](dashboard-light.webp) | 1280 × 2358 |      100,244 |
| [Dashboard, dark](dashboard-dark.webp)   | 1280 × 2358 |      101,820 |
| [Booking walkthrough](booking-flow.gif)  | 800 × 600   |      111,564 |

## Local setup verification

Checked on 2026-11-16 in a separate, clean clone of `main` at `98d0ce0`, using Node.js 24.14.1 and npm 11.11.0:

- Created `.env.local` before installing, following the README. Both database URLs pointed only to an unused loopback port; no shared Neon connection string or real secrets were copied.
- `npm ci` succeeded and its postinstall generated Prisma Client 7.10.1. No dependencies were added or updated by this review.
- `npm run dev -- --port 3102` started successfully. Port 3102 avoided the existing workspace server; the usual README default remains 3000.
- `/login` returned HTTP 200 with the login form; `/api/auth/get-session` returned HTTP 200 and `null` for a guest. These checks do not require a database session.
- No isolated PostgreSQL instance, Docker or Podman was available. **`prisma migrate dev` and `npm run db:seed` were not executed.** No migration/seed was attempted against a shared or remote database.
- The migration files were inspected for setup requirements: the no-overlap constraint enables `btree_gist`, so the README now states that the development database role needs permission to enable that extension.

The dependency-install and server-start portions are verified; the complete database-backed setup remains unverified until a disposable PostgreSQL database is available. Seed account definitions were checked against `prisma/seed.ts`, not recreated or used against a shared database.

[Back to the project README](../../README.md)
