// Client service for the booking diary + day-arc. Talks to the real API
// (Phase 4): availability from GET /api/availability, bookings via
// POST /api/bookings. Data shape for availability is unchanged from the mock —
// { [dayOffset]: [{ s:'HH:MM', e:'HH:MM', label }] } — so the diary's rendering
// logic does not change.

export type SlotBooking = { s: string; e: string; label: string };
export type Availability = Record<number, SlotBooking[]>;

export type BookingPayload = {
  name: string;
  email: string;
  dateISO: string;
  startHour: number;
  hours: number;
};

export type BookingResult = {
  ok: boolean;
  reference?: string;
  amountPence?: number;
  error?: string;
};

export async function fetchAvailability(): Promise<Availability> {
  try {
    const res = await fetch("/api/availability", { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as Availability;
  } catch {
    return {};
  }
}

export async function createBooking(
  payload: BookingPayload,
): Promise<BookingResult> {
  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, company: "" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "error" };
    return {
      ok: true,
      reference: data.reference,
      amountPence: data.amountPence,
    };
  } catch {
    return { ok: false, error: "network" };
  }
}
