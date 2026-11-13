import { getAvailableSlots } from "@/server/queries/availability";
import { isValidDate, todayInBelgrade } from "@/lib/time";
import { isWithinBookingWindow } from "@/lib/booking-rules";

export async function GET(request: Request, { params }: { params: Promise<{ courtId: string }> }) {
  const date = new URL(request.url).searchParams.get("datum") ?? "";
  const headers = { "Cache-Control": "no-store" };
  if (!isValidDate(date) || !isWithinBookingWindow(date, todayInBelgrade())) {
    return Response.json(
      { ok: false, error: "Izaberi datum od danas do narednih 14 dana, po vremenu u Srbiji." },
      { status: 400, headers },
    );
  }
  try {
    const result = await getAvailableSlots((await params).courtId, date);
    return Response.json(result, { status: result.ok ? 200 : 404, headers });
  } catch {
    return Response.json(
      { ok: false, error: "Termine trenutno nije moguće učitati. Pokušaj ponovo." },
      { status: 500, headers },
    );
  }
}
