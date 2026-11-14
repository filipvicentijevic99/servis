# Booking emails

Presentation-only React Email templates for issue #28; delivery belongs to #25.
No database, auth, delivery SDK or environment variables are read by the templates.

## Browser preview

```sh
npm run email:dev
```

Open http://localhost:3001 and choose `booking-confirmation` or `booking-cancellation`.
The command runs `email dev --dir src/emails --port 3001`; port 3000 stays available for the app.
The `_fixtures` directory contains preview-only data, provided through `PreviewProps`.
Directories beginning with `_` are hidden by the [React Email preview CLI](https://react.email/docs/cli).

## Reuse in #25

Import either default component, or the shared `BookingEmail` with `variant="confirmed" | "cancelled"`.
Both wrappers accept `BookingEmailData` from `_components/booking-email.tsx`:

- `clubName`, `courtName`: stored club and court names.
- `startsAt`, `endsAt`: booking `Date` values from Prisma, stored in UTC.
- `totalPrice`: the booking's saved total in RSD, not today's court price.
- `bookingUrl`: a trusted absolute HTTP(S) app URL, supplied by the sender. Use HTTPS in production.

```tsx
import { render, toPlainText } from "react-email";
import BookingConfirmationEmail from "@/emails/booking-confirmation";
import { BOOKING_EMAIL_SUBJECTS, type BookingEmailData } from "@/emails/_components/booking-email";

// Construct props from the authorized booking and the configured app origin in #25.
const props: BookingEmailData = {
  clubName: booking.court.club.name,
  courtName: booking.court.name,
  startsAt: booking.startsAt,
  endsAt: booking.endsAt,
  totalPrice: booking.totalPrice,
  bookingUrl: new URL("/igrac/rezervacije", appOrigin).href,
};
const subject = BOOKING_EMAIL_SUBJECTS.confirmed;
const html = await render(<BookingConfirmationEmail {...props} />);
const text = toPlainText(html);
```

The same props work with `BookingCancellationEmail` and `BOOKING_EMAIL_SUBJECTS.cancelled`.
The existing app has a bookings list, not a per-booking detail route, so the preview links there.
Cancelled bookings are on its **Prošle** tab; no nonexistent deep link is generated.

The visible logo is the same **Servis** wordmark used by the app navbar. It does not depend on remote
images or web fonts. Layout uses email-safe presentation tables and inline styles, with narrow-screen
and dark-mode enhancements for clients that support media queries. Dates and times reuse the app's
Europe/Belgrade formatters. Subject, preview text, HTML and plain-text rendering are covered by tests.

Only `react-email` (components/render/CLI) and matching `@react-email/ui` (development preview) are added.
No sending is implemented. Browser preview is verified; real Gmail/Outlook delivery is not tested here.
