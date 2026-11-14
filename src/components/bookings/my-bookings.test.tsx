import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import { MyBookings } from "./my-bookings";
import type { MyBooking } from "@/server/queries/bookings";

const booking: MyBooking = {
  id: "booking-1",
  startsAt: new Date("2026-12-15T12:00:00Z"),
  endsAt: new Date("2026-12-15T13:00:00Z"),
  status: "CONFIRMED",
  totalPrice: 1800,
  canCancel: true,
  hasOpenMatch: true,
  court: { id: "court-1", name: "Teren 1", surface: "CLAY" },
  club: { name: "Test klub", slug: "test-klub", city: "Niš", address: "Adresa" },
};
const action = vi.fn();

describe("my bookings rendering", () => {
  it("renders upcoming data, price, times, status and club link", () => {
    const html = renderToStaticMarkup(
      <MyBookings upcoming={[booking]} past={[]} cancelAction={action} />,
    );
    for (const text of [
      "Test klub",
      "Teren 1",
      "Šljaka",
      "13:00–14:00",
      "1.800 RSD",
      "Potvrđena",
      'href="/klub/test-klub"',
      'role="tab"',
      'role="tabpanel"',
    ])
      expect(html).toContain(text);
    expect(action).not.toHaveBeenCalled();
  });
  it("renders an accessible disabled cancellation explanation", () => {
    const html = renderToStaticMarkup(
      <MyBookings upcoming={[{ ...booking, canCancel: false }]} past={[]} cancelAction={action} />,
    );
    expect(html).toContain("24 sata");
    expect(html).toContain("disabled");
    expect(html).toContain('tabindex="0"');
  });
  it("provides an empty state linking to club discovery", () => {
    const html = renderToStaticMarkup(<MyBookings upcoming={[]} past={[]} cancelAction={action} />);
    expect(html).toContain("Nema predstojećih rezervacija");
    expect(html).toContain('href="/klubovi"');
  });
});
