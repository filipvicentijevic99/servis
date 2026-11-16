import type { CSSProperties } from "react";
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "react-email";
import { bookingDateLabel, bookingTimeLabel } from "../../lib/my-bookings";
import { formatPrice } from "../../lib/format";

export type BookingEmailData = {
  clubName: string;
  courtName: string;
  startsAt: Date;
  endsAt: Date;
  /** The stored booking total in RSD, not the court's current hourly price. */
  totalPrice: number;
  /** Absolute URL supplied by the sender; currently /igrac/rezervacije on the app origin. */
  bookingUrl: string;
};
export type BookingEmailVariant = "confirmed" | "cancelled";
export type BookingEmailProps = BookingEmailData & { variant: BookingEmailVariant };

export const BOOKING_EMAIL_SUBJECTS = {
  confirmed: "Potvrda rezervacije | Servis",
  cancelled: "Otkazivanje rezervacije | Servis",
} as const;

const copy = {
  confirmed: {
    status: "Potvrđeno",
    title: "Tvoj termin je potvrđen.",
    description: "Sve je spremno za izlazak na teren. Sačuvaj detalje svoje rezervacije.",
    note: "Detalje termina možeš da pogledaš u svojim rezervacijama.",
  },
  cancelled: {
    status: "Otkazano",
    title: "Rezervacija je otkazana.",
    description: "Ova rezervacija više nije aktivna. Detalji otkazane rezervacije su u nastavku.",
    note: "Otkazanu rezervaciju možeš da pronađeš na kartici „Prošle“ u svojim rezervacijama.",
  },
} as const;

function safeBookingUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("bookingUrl must be an absolute HTTP(S) URL without credentials.");
  }
  return url;
}

/** Presentation only: no database, auth, environment variables or delivery side effects. */
export function BookingEmail({
  variant,
  clubName,
  courtName,
  startsAt,
  endsAt,
  totalPrice,
  bookingUrl,
}: BookingEmailProps) {
  const content = copy[variant];
  const url = safeBookingUrl(bookingUrl);
  const date = bookingDateLabel(startsAt);
  const time = bookingTimeLabel(startsAt, endsAt);
  const endDate = bookingDateLabel(endsAt);
  const dateLabel = date === endDate ? date : `${date} – ${endDate}`;

  return (
    <Html lang="sr-Latn" dir="ltr">
      <Head>
        <title>{BOOKING_EMAIL_SUBJECTS[variant]}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          @media only screen and (max-width: 480px) {
            .email-content { padding: 24px 20px !important; }
            .email-title { font-size: 26px !important; line-height: 34px !important; }
          }
          @media (prefers-color-scheme: dark) {
            .email-body, .email-body > table > tbody > tr > td { background-color: #111411 !important; }
            .email-card { background-color: #1c211d !important; border-color: #3c443d !important; }
            .email-ink { color: #f4f6f2 !important; }
            .email-muted { color: #c2c9c1 !important; }
            .email-rule { border-color: #3c443d !important; }
            .email-cta { background-color: #d9f99d !important; color: #17200d !important; }
          }
        `}</style>
      </Head>
      <Preview>
        {content.status}: {clubName} · {date} · {time}
      </Preview>
      <Body lang="sr-Latn" dir="ltr" className="email-body" style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.brand}>
            <Link
              href={url.origin}
              aria-label="Servis — početna stranica"
              className="email-ink"
              style={styles.logo}
            >
              Servis
            </Link>
            <Text className="email-muted" style={styles.tagline}>
              Tvoj sledeći izlazak na teren.
            </Text>
          </Section>
          <Section className="email-card" style={styles.card}>
            <Section tdClassName="email-content" style={styles.content}>
              <Text
                style={{
                  ...styles.status,
                  ...(variant === "cancelled"
                    ? { backgroundColor: "#eceeeb", color: "#4b554b" }
                    : {}),
                }}
              >
                {content.status}
              </Text>
              <Heading as="h1" className="email-title email-ink" style={styles.title}>
                {content.title}
              </Heading>
              <Text className="email-muted" style={styles.description}>
                {content.description}
              </Text>
              <Hr className="email-rule" style={styles.rule} />
              {[
                ["Klub", clubName],
                ["Teren", courtName],
                ["Datum", dateLabel],
                ["Vreme", time],
              ].map(([label, value]) => (
                <Row key={label} style={styles.detailRow}>
                  <Column className="email-muted" style={styles.label}>
                    {label}
                  </Column>
                  <Column className="email-ink" style={styles.value}>
                    {value}
                  </Column>
                </Row>
              ))}
              <Hr className="email-rule" style={styles.rule} />
              <Row style={styles.detailRow}>
                <Column className="email-muted" style={styles.label}>
                  Cena rezervacije
                </Column>
                <Column
                  className="email-ink"
                  style={{ ...styles.value, fontSize: "22px", fontWeight: 700 }}
                >
                  {formatPrice(totalPrice)}
                </Column>
              </Row>
              <Text className="email-muted" style={styles.timezone}>
                Sva vremena su prikazana za Srbiju (Europe/Belgrade).
              </Text>
              <Section style={styles.action}>
                <Button href={url.href} className="email-cta" style={styles.button}>
                  Pogledaj rezervaciju
                </Button>
              </Section>
              <Text className="email-muted" style={styles.note}>
                {content.note}
              </Text>
              <Hr className="email-rule" style={styles.rule} />
              <Text className="email-muted" style={styles.fallback}>
                Ako dugme ne radi, otvori ovaj link:
                <br />
                <Link href={url.href} className="email-muted" style={styles.fallbackLink}>
                  {url.href}
                </Link>
              </Text>
            </Section>
          </Section>
          <Text className="email-muted" style={styles.footer}>
            Servis · Rezervacije teniskih terena
            <br />
            Ovo je automatsko obaveštenje o tvojoj rezervaciji.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// Email-safe inline styles and presentation tables work without app CSS or web fonts.
const styles = {
  body: {
    margin: 0,
    padding: "24px 12px",
    backgroundColor: "#f4f5f1",
    fontFamily: "Arial, Helvetica, sans-serif",
    color: "#172119",
  },
  container: { width: "100%", maxWidth: "560px", margin: "0 auto" },
  brand: { padding: "8px 0 24px", textAlign: "center" },
  logo: {
    color: "#172119",
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-1.5px",
    textDecoration: "none",
  },
  tagline: { margin: "8px 0 0", color: "#596459", fontSize: "13px", lineHeight: "20px" },
  card: { backgroundColor: "#ffffff", border: "1px solid #dfe4dc", borderRadius: "16px" },
  content: { padding: "32px" },
  status: {
    margin: "0 0 16px",
    color: "#35531c",
    backgroundColor: "#eaf3df",
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1px",
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 14px",
    color: "#172119",
    fontSize: "30px",
    lineHeight: "38px",
    fontWeight: 700,
    letterSpacing: "-0.6px",
  },
  description: { margin: "0 0 24px", color: "#596459", fontSize: "16px", lineHeight: "25px" },
  rule: { border: 0, borderTop: "1px solid #e5e8e1", margin: "20px 0" },
  detailRow: { width: "100%", tableLayout: "fixed" },
  label: {
    width: "32%",
    verticalAlign: "top",
    padding: "9px 0",
    color: "#596459",
    fontSize: "14px",
    lineHeight: "22px",
  },
  value: {
    verticalAlign: "top",
    padding: "9px 0 9px 16px",
    color: "#172119",
    fontSize: "15px",
    lineHeight: "22px",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },
  timezone: { margin: "12px 0 0", color: "#596459", fontSize: "12px", lineHeight: "19px" },
  action: { padding: "28px 0 0" },
  button: {
    backgroundColor: "#21371d",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "16px 24px",
    fontSize: "15px",
    lineHeight: "20px",
    fontWeight: 700,
    textDecoration: "none",
    textAlign: "center",
  },
  note: { margin: "18px 0 0", color: "#596459", fontSize: "13px", lineHeight: "21px" },
  fallback: { margin: 0, color: "#596459", fontSize: "12px", lineHeight: "20px" },
  fallbackLink: { color: "#596459", textDecoration: "underline", wordBreak: "break-all" },
  footer: {
    margin: "24px 8px 0",
    color: "#596459",
    textAlign: "center",
    fontSize: "12px",
    lineHeight: "20px",
  },
} satisfies Record<string, CSSProperties>;
