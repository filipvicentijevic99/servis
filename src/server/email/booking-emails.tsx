import "server-only";
import { render, toPlainText } from "react-email";
import prisma from "@/lib/prisma";
import { emailConfigFromEnv, myBookingsUrl, resendPayload } from "@/lib/booking-email";
import {
  BookingEmail,
  BOOKING_EMAIL_SUBJECTS,
  type BookingEmailVariant,
} from "@/emails/_components/booking-email";

/**
 * Emails the booking's player a confirmation or cancellation.
 *
 * Best effort: it never throws, so a failed email can't undo or block a booking.
 * Without RESEND_API_KEY it only logs that email is disabled.
 * Call it through `after()` so the user doesn't wait for the email API.
 */
export async function sendBookingEmail(bookingId: string, variant: BookingEmailVariant) {
  const config = emailConfigFromEnv(process.env);
  if (!config) {
    console.info(
      `[email] RESEND_API_KEY not set, skipping ${variant} email for booking ${bookingId}`,
    );
    return;
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        startsAt: true,
        endsAt: true,
        totalPrice: true,
        user: { select: { email: true } },
        court: { select: { name: true, club: { select: { name: true } } } },
      },
    });
    if (!booking) return;

    const html = await render(
      <BookingEmail
        variant={variant}
        clubName={booking.court.club.name}
        courtName={booking.court.name}
        startsAt={booking.startsAt}
        endsAt={booking.endsAt}
        totalPrice={booking.totalPrice}
        bookingUrl={myBookingsUrl(config.appOrigin)}
      />,
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        // Resend ignores a repeated request with the same key, e.g. on a retry.
        "Idempotency-Key": `booking-${variant}-${bookingId}`,
      },
      body: JSON.stringify(
        resendPayload({
          from: config.from,
          to: booking.user.email,
          subject: BOOKING_EMAIL_SUBJECTS[variant],
          html,
          text: toPlainText(html),
        }),
      ),
    });

    if (!response.ok) {
      console.error(
        `[email] Resend ${response.status} for booking ${bookingId}: ${await response.text()}`,
      );
    }
  } catch (error) {
    console.error(`[email] ${variant} email for booking ${bookingId} failed`, error);
  }
}
