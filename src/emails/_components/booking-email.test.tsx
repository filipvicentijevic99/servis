import { describe, expect, it } from "vitest";
import { render, toPlainText } from "react-email";
import BookingConfirmationEmail from "../booking-confirmation";
import BookingCancellationEmail from "../booking-cancellation";
import { BOOKING_EMAIL_SUBJECTS } from "./booking-email";
import { previewBooking } from "../_fixtures/booking";

describe("booking email templates", () => {
  it.each([
    [BookingConfirmationEmail, "Tvoj termin je potvrđen.", BOOKING_EMAIL_SUBJECTS.confirmed],
    [BookingCancellationEmail, "Rezervacija je otkazana.", BOOKING_EMAIL_SUBJECTS.cancelled],
  ] as const)(
    "renders booking details and an absolute CTA in both variants",
    async (Template, title, subject) => {
      const html = await render(<Template {...previewBooking} />);
      for (const value of [
        "Servis",
        title,
        subject,
        "Ada Tennis Club",
        "Teren 2 · Šljaka",
        "21. novembar 2026.",
        "17:00–18:00",
        "2.400 RSD",
        "Pogledaj rezervaciju",
        "Europe/Belgrade",
      ])
        expect(html).toContain(value);
      expect(html).toContain('lang="sr-Latn"');
      expect(html).toContain(`href="${previewBooking.bookingUrl}"`);
      expect(html).not.toContain('src="/');
      const text = toPlainText(html);
      expect(text.toLowerCase()).toContain(title.toLowerCase());
      expect(text).toContain("2.400 RSD");
      expect(text).toContain(previewBooking.bookingUrl);
    },
  );
  it("keeps the cancellation copy distinct and explains where to find cancelled bookings", async () => {
    const html = await render(<BookingCancellationEmail {...previewBooking} />);
    expect(html).not.toContain("Tvoj termin je potvrđen");
    expect(html).toContain("kartici „Prošle“");
    expect(html).not.toMatch(/refund|povraćaj/i);
  });
  it("uses Belgrade summer time rather than the server's timezone", async () => {
    const html = await render(
      <BookingConfirmationEmail
        {...previewBooking}
        startsAt={new Date("2026-07-21T16:00:00Z")}
        endsAt={new Date("2026-07-21T17:00:00Z")}
      />,
    );
    expect(html).toContain("18:00–19:00");
    expect(html).toContain("21. jul 2026.");
  });
  it("shows the local date range for a booking ending at midnight", async () => {
    const html = await render(
      <BookingConfirmationEmail
        {...previewBooking}
        startsAt={new Date("2026-11-21T22:00:00Z")}
        endsAt={new Date("2026-11-21T23:00:00Z")}
      />,
    );
    expect(html).toContain("21. novembar 2026. – 22. novembar 2026.");
    expect(html).toContain("23:00–00:00");
  });
  it("renders a real zero price and escapes content rather than injecting HTML", async () => {
    const html = await render(
      <BookingConfirmationEmail
        {...previewBooking}
        clubName={'<script>alert("x")</script>'}
        totalPrice={0}
      />,
    );
    expect(html).toContain("0 RSD");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "//evil.test",
    "/igrac/rezervacije",
    "https://user:password@example.test/",
  ])("rejects unsafe or relative booking URLs: %s", async (bookingUrl) => {
    await expect(
      render(<BookingConfirmationEmail {...previewBooking} bookingUrl={bookingUrl} />),
    ).rejects.toThrow();
  });
  it("keeps fixture values out of a render supplied by the caller", async () => {
    const html = await render(
      <BookingConfirmationEmail
        {...previewBooking}
        clubName="Drugi klub"
        courtName="Zatvoreni teren"
        bookingUrl="https://servis.example/igrac/rezervacije"
        totalPrice={3100}
      />,
    );
    expect(html).toContain("Drugi klub");
    expect(html).toContain("Zatvoreni teren");
    expect(html).toContain("3.100 RSD");
    expect(html).not.toContain("Ada Tennis Club");
    expect(html).not.toContain("localhost");
  });
});
