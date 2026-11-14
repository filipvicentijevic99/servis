import { BookingEmail, type BookingEmailData } from "./_components/booking-email";
import { previewBooking } from "./_fixtures/booking";

export default function BookingConfirmationEmail(props: BookingEmailData) {
  return <BookingEmail {...props} variant="confirmed" />;
}

BookingConfirmationEmail.PreviewProps = previewBooking;
