# Dark mode and mobile review (#30)

Base: `origin/main` at `4a096a7`. Viewports: 375 × 900 and 1280 × 900, light and dark.

## Changes

- Added a persistent Light / Dark / System selector, labelled Svetla / Tamna / Sistemska.
- The existing next-themes provider sets the root class and native color scheme; the global Toaster shares it.
- The toggle renders both icons with CSS visibility. Its closed server/client markup is identical, and only the root html element suppresses theme attribute hydration warnings.
- Improved mobile menu spacing, 44 px controls, localized close label, scrolling, and link/button semantics.
- Corrected muted and destructive text contrast, including destructive hover states in both themes.
- Fixed long unbroken names overflowing card headers and dialogs without changing data or business rules.

## Browser coverage

| Area                                                                                    | Verification                                                                                                               |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Home, club list, Ada club details, matches                                              | Live GET reads, both themes and widths, contrast and overflow sweep                                                        |
| Login and registration                                                                  | Both themes/widths, empty-input validation and role selection; no valid submission                                         |
| Auth return, dashboard and my-bookings entry URLs                                       | Guest redirects checked; no shared sessions created                                                                        |
| Dashboard courts and opening hours                                                      | Isolated actual components: add/edit/delete dialogs, pending/error UI, native controls                                     |
| My bookings and match creation                                                          | Isolated actual components: upcoming/past, cancellation and posting dialogs                                                |
| Booking picker and gallery                                                              | Slot selection and confirmation dialog without confirming; carousel with existing static images                            |
| Theme/menu/toast                                                                        | Persistence, System media changes, explicit override, native color-scheme, menu focus return, link dismissal, themed toast |
| Existing /dev/auth, /dev/bookings, /dev/clubs, /dev/dashboard, /dev/matches, /dev/slots | GET-only inspection; no test-page mutations                                                                                |

After fixes, the text-contrast/overflow sweep and browser console/hydration checks passed. Temporary fixtures and copied PR components were removed. Real registration, login session creation, Google OAuth completion and booking/court mutations were deliberately not exercised against the shared database.

## Pending work considered

- [PR #57](https://github.com/filipvicentijevic99/servis/pull/57), revision `de34aba`: charts and expanded data tables reviewed in an isolated temporary preview with the real theme provider. No chart implementation copied into this branch.
- [PR #58](https://github.com/filipvicentijevic99/servis/pull/58), revision `b66078d`: standalone email templates/preview, outside the app provider. Its mobile/dark previews were already verified in #28; no duplicate implementation or dependency added here.
- [PR #59](https://github.com/filipvicentijevic99/servis/pull/59), revision `d240295`: its custom 404 reviewed in an isolated temporary preview. Global states and reduced-motion skeleton fixes remain in that PR.
- Existing [#27](https://github.com/filipvicentijevic99/servis/issues/27) already requires removal of /dev/auth before deployment; no duplicate bug filed.

## Separate bug ready for GitHub

Requested label: `bug`. Issue creation was attempted but the connector returned HTTP 403, `Resource not accessible by integration`. No issue number was assigned. Open/closed issues and PRs #57–59 were checked for duplicates.

### Navbar keeps the sign-in link instead of the authenticated user menu

## Problem

The shared navbar always renders the `Prijava` link, including when a player or club owner is already signed in. The authenticated user menu required by closed issue #7 is missing, so users cannot reach their bookings/dashboard or sign out from the navbar.

## Reproduction

1. Sign in with an existing player or owner account.
2. Open any application page on desktop, or open the mobile navigation sheet.
3. Observe that `Prijava` is still displayed and no user menu or sign-out action is available.

## Expected

Render the authenticated user menu from the actual server session or `useSession()`; expose appropriate account destinations and sign-out. Keep the sign-in link for guests and avoid flashing the guest state while session data is loading.

## Evidence / scope

- `src/components/layout/Navbar.tsx` renders the login link unconditionally in both navigation variants and does not consume session data.
- `src/app/layout.tsx` does not pass a session to Navbar.
- Closed #7 explicitly requires a user menu when signed in.
- Reviewed open issues and PRs #57, #58 and #59: none implements the authenticated navbar menu.
- Found during #30. Theme/mobile fixes stay in #30; authentication navigation belongs in this separate bug.
- No shared database records or sessions were created for this review.
