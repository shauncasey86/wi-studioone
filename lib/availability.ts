// Service layer for the booking diary + day-arc. Presentation stays separate
// from data: the diary boots from `fetchAvailability()` and writes back through
// `createBooking()`. Both are MOCKS today (ported from the legacy StudioOne
// service object); in Phase 4 their bodies are swapped for fetch()/POST against
// the Railway backend and nothing in the UI has to change.
//
// Data shape is fixed:
//   { [dayIndex 0..]: [ { s:'HH:MM', e:'HH:MM', label } ] }
// Times may be any clock value; the model rounds each booking out to the whole
// hours it touches and reserves a 1h reset on each side.

export type SlotBooking = { s: string; e: string; label: string };
export type Availability = Record<number, SlotBooking[]>;

export type BookingPayload = {
  name: string;
  email: string;
  ref: string;
  day: string;
  start: string;
  end: string;
  hours: number;
  price: number;
};

export type BookingResult = { ok: boolean; status: "pending"; ref: string };

export const config = {
  apiBase: "",
  rate: 45,
  openHour: 7,
  closeHour: 22,
  minHours: 1,
  maxHours: 8,
  resetHours: 1,
};

// → replace with: fetch(config.apiBase + '/availability').then(r => r.json())
export function fetchAvailability(): Promise<Availability> {
  return Promise.resolve({
    0: [
      { s: "09:00", e: "11:00", label: "Held" },
      { s: "14:00", e: "16:00", label: "Shoot" },
    ],
    1: [
      { s: "07:00", e: "09:00", label: "Class · weekly" },
      { s: "18:00", e: "21:00", label: "Dinner" },
    ],
    2: [{ s: "10:00", e: "13:00", label: "Workshop" }],
    3: [
      { s: "08:00", e: "10:00", label: "Class" },
      { s: "12:00", e: "14:00", label: "Held" },
    ],
    4: [{ s: "19:00", e: "22:00", label: "Dinner" }],
    5: [{ s: "10:00", e: "16:00", label: "Workshop" }],
    6: [],
  });
}

// → replace with: POST config.apiBase + '/bookings' carrying the payload. The
// server records the slot as PENDING, emails the studio a confirm link, and
// returns { ok, status:'pending', ref }. The studio's confirmation is what
// emails the guest their door code — no code or charge happens client-side.
export function createBooking(payload: BookingPayload): Promise<BookingResult> {
  return new Promise((resolve) => {
    setTimeout(
      () => resolve({ ok: true, status: "pending", ref: payload.ref }),
      500,
    );
  });
}
