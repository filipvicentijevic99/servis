import { BookingEmail, type BookingEmailData } from "./_components/booking-email";
import { previewBooking } from "./_fixtures/booking";

export default function BookingCancellationEmail(props: BookingEmailData) {
  return <BookingEmail {...props} variant="cancelled" />;
}

BookingCancellationEmail.PreviewProps = previewBooking;
