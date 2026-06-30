import { describe, it, expect } from "vitest";
import {
  computeDayStatus,
  slotIsFree,
  type Occupant,
} from "@/lib/booking/availability";

const RULES = { openHour: 7, closeHour: 22, resetHours: 1 };
const SLOT = { ...RULES, minHours: 1, maxHours: 8 };

describe("computeDayStatus", () => {
  it("marks booked hours and a reset buffer on each side", () => {
    const s = computeDayStatus([{ startHour: 14, endHour: 16 }], RULES);
    expect(s[14]).toBe("booked");
    expect(s[15]).toBe("booked");
    expect(s[13]).toBe("buffer"); // reset before
    expect(s[16]).toBe("buffer"); // reset after
    expect(s[12]).toBe("free");
    expect(s[17]).toBe("free");
  });

  it("greys past hours today (by start-of-block minute)", () => {
    const s = computeDayStatus([], { ...RULES, nowMinutes: 12 * 60 + 30 });
    expect(s[11]).toBe("past");
    expect(s[12]).toBe("past"); // 12:00 starts before 12:30
    expect(s[13]).toBe("free");
  });

  it("does not overwrite booked/buffer hours with past", () => {
    const s = computeDayStatus([{ startHour: 8, endHour: 10 }], {
      ...RULES,
      nowMinutes: 23 * 60,
    });
    expect(s[7]).toBe("buffer"); // reset before the booking, not past
    expect(s[8]).toBe("booked");
    expect(s[10]).toBe("buffer"); // reset after, not past
    expect(s[11]).toBe("past"); // a genuinely free hour in the past
  });
});

describe("slotIsFree", () => {
  const occ: Occupant[] = [{ startHour: 14, endHour: 16 }];

  it("allows a free run", () => {
    expect(slotIsFree(occ, 10, 12, SLOT)).toBe(true);
  });
  it("rejects overlapping the booking", () => {
    expect(slotIsFree(occ, 14, 16, SLOT)).toBe(false);
  });
  it("rejects landing in the reset buffer (each side)", () => {
    expect(slotIsFree(occ, 16, 18, SLOT)).toBe(false); // 16 is buffer
    expect(slotIsFree(occ, 12, 14, SLOT)).toBe(false); // 13 is buffer
  });
  it("allows the next slot after the buffer", () => {
    expect(slotIsFree(occ, 17, 19, SLOT)).toBe(true);
  });
  it("enforces min/max hours", () => {
    expect(slotIsFree([], 10, 10, SLOT)).toBe(false); // 0h < min
    expect(slotIsFree([], 7, 16, SLOT)).toBe(false); // 9h > max
  });
  it("enforces open hours", () => {
    expect(slotIsFree([], 6, 8, SLOT)).toBe(false); // before open
    expect(slotIsFree([], 21, 23, SLOT)).toBe(false); // past close
  });
  it("rejects past hours today", () => {
    expect(slotIsFree([], 8, 10, { ...SLOT, nowMinutes: 12 * 60 })).toBe(false);
    expect(slotIsFree([], 14, 16, { ...SLOT, nowMinutes: 12 * 60 })).toBe(true);
  });
  it("treats a recurring hold / pending booking as an occupant", () => {
    const hold: Occupant[] = [{ startHour: 7, endHour: 9 }]; // weekly class
    expect(slotIsFree(hold, 7, 9, SLOT)).toBe(false);
    expect(slotIsFree(hold, 10, 12, SLOT)).toBe(true);
  });
});
