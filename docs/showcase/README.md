# Showcase assets

These are Chrome captures of the application's existing pages and components, not design mockups or generated images.

## Source and scope

- Source: `main` at `4a096a7698163eb23e5ed6181e22fd1ca53c5e15` (2026-11-14).
- Captured pages: home, `/klub/[slug]` with the first court's date/slot picker expanded, `/mecevi`, and `/dashboard`.
- The captures render the original page functions, Navbar, Footer, shadcn components and compiled Tailwind styles. A temporary local browser harness replaces database queries, session lookups and mutation actions with isolated adapters. Next Link/Form/Image have browser-only adapters for navigation markup and local image assets; this is not a deployed Next.js end-to-end session.
- All clubs, users, matches, prices and opening hours shown are **showcase fixtures**. Names containing “demo” are intentional. No personal data, auth cookies or database credentials were used.
- The clock is fixed to 2026-11-14 11:00 in Europe/Belgrade. The animation changes the date to November 15 and chooses 18:00–19:00 at 1,800 RSD.
- The club has no supplied photos, so the original gallery fallback is preserved. Home uses the repository's existing illustrative images under `public/clubs/`; those are not claimed to depict the fixture clubs.
- The existing dark CSS variant is applied by setting the root `dark` class in the capture harness. No theme-switcher code from PR #60 is imported.

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

## Pending PRs

PRs [#57](https://github.com/filipvicentijevic99/servis/pull/57), [#58](https://github.com/filipvicentijevic99/servis/pull/58), [#59](https://github.com/filipvicentijevic99/servis/pull/59) and [#60](https://github.com/filipvicentijevic99/servis/pull/60) were open at capture time. Their implementations have not been copied into this branch. Refresh the relevant images after those changes merge; the current dashboard intentionally has no analytics charts and Navbar has no theme toggle.

## Encoding and verification

- Screenshots: 1280 px wide, full page, WebP quality 86. Each light/dark pair uses identical fixtures and viewport settings.
- GIF: 800 × 600, six frames, 9.5-second loop, 128-color palette, no dithering.
- Combined media size: approximately 625 KiB. No external image hosting is required.
- Captures were checked for browser runtime errors, horizontal overflow and successful local image/font loads. The GIF checks confirmed the changed date, simulated action completion, success toast and refreshed availability. All eight screenshots and the six animation frames were visually inspected.
- These checks do not exercise production authentication, real mutation actions or pending PR functionality.

| Asset                                    | Dimensions  | Size (bytes) |
| ---------------------------------------- | ----------- | -----------: |
| [Home, light](home-light.webp)           | 1280 × 1864 |       99,046 |
| [Home, dark](home-dark.webp)             | 1280 × 1864 |       99,218 |
| [Club, light](club-light.webp)           | 1280 × 1848 |       59,878 |
| [Club, dark](club-dark.webp)             | 1280 × 1848 |       60,962 |
| [Matches, light](matches-light.webp)     | 1280 × 960  |       39,796 |
| [Matches, dark](matches-dark.webp)       | 1280 × 960  |       40,718 |
| [Dashboard, light](dashboard-light.webp) | 1280 × 1636 |       64,026 |
| [Dashboard, dark](dashboard-dark.webp)   | 1280 × 1636 |       64,498 |
| [Booking walkthrough](booking-flow.gif)  | 800 × 600   |      111,564 |

[Back to the project README](../../README.md)
