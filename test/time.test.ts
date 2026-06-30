import { describe, it, expect } from "vitest";
import {
  londonNow,
  dateKey,
  addDays,
  isoOf,
  weekdayMon0,
} from "@/lib/booking/time";

describe("London time", () => {
  it("converts UTC to London wall-clock across BST and GMT", () => {
    // Summer (BST, UTC+1): 12:30Z → 13:30 London
    const bst = londonNow(new Date("2026-06-30T12:30:00Z"));
    expect(bst.hour).toBe(13);
    expect(bst.minute).toBe(30);
    expect({ y: bst.year, m: bst.month, d: bst.day }).toEqual({
      y: 2026,
      m: 6,
      d: 30,
    });
    // Winter (GMT, UTC+0): 12:30Z → 12:30 London
    const gmt = londonNow(new Date("2026-01-15T12:30:00Z"));
    expect(gmt.hour).toBe(12);
  });

  it("date keys advance by calendar day regardless of DST", () => {
    // UK clocks go forward on 2026-03-29; the calendar day still increments by 1
    const before = dateKey(2026, 3, 28);
    expect(isoOf(addDays(before, 1))).toBe("2026-03-29");
    expect(isoOf(addDays(before, 2))).toBe("2026-03-30");
  });

  it("weekday is Monday=0 … Sunday=6", () => {
    expect(weekdayMon0(dateKey(2026, 6, 30))).toBe(1); // Tuesday
    expect(weekdayMon0(dateKey(2026, 7, 5))).toBe(6); // Sunday
    expect(weekdayMon0(dateKey(2026, 7, 6))).toBe(0); // Monday
  });
});
