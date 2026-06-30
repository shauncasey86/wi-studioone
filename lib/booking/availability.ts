// Pure availability rules (CLAUDE.md §8) — no DB, so they're directly unit
// testable. An occupant is any reservation that consumes hours: a CONFIRMED or
// active-PENDING booking, a one-off Block, or a projected RecurringHold.
// Every occupant blocks the whole hours it touches plus a resetHours buffer on
// each side. Hours are London clock integers; endHour is exclusive.

export type Occupant = { startHour: number; endHour: number };
export type HourStatus = "free" | "booked" | "buffer" | "past";

export type Rules = {
  openHour: number;
  closeHour: number;
  resetHours: number;
  /** Minutes since midnight "now" in London — only set for today, to grey past hours. */
  nowMinutes?: number | null;
};

/** Status of every open-hour block of a single day. */
export function computeDayStatus(
  occupants: Occupant[],
  rules: Rules,
): Record<number, HourStatus> {
  const { openHour, closeHour, resetHours, nowMinutes = null } = rules;
  const status: Record<number, HourStatus> = {};
  for (let h = openHour; h < closeHour; h++) status[h] = "free";

  for (const o of occupants) {
    // booked hours the occupant actually touches
    for (
      let h = Math.max(openHour, o.startHour);
      h < Math.min(closeHour, o.endHour);
      h++
    ) {
      status[h] = "booked";
    }
    // reset buffer each side
    for (let h = o.endHour; h < o.endHour + resetHours; h++) {
      if (status[h] === "free") status[h] = "buffer";
    }
    for (let h = o.startHour - resetHours; h < o.startHour; h++) {
      if (status[h] === "free") status[h] = "buffer";
    }
  }

  if (nowMinutes != null) {
    for (let h = openHour; h < closeHour; h++) {
      if (status[h] === "free" && h * 60 < nowMinutes) status[h] = "past";
    }
  }
  return status;
}

export type SlotRules = Rules & { minHours: number; maxHours: number };

/** Whether [start, end) is bookable given the day's occupants and the rules. */
export function slotIsFree(
  occupants: Occupant[],
  start: number,
  end: number,
  rules: SlotRules,
): boolean {
  const { openHour, closeHour, minHours, maxHours } = rules;
  if (!Number.isInteger(start) || !Number.isInteger(end)) return false;
  const hours = end - start;
  if (hours < minHours || hours > maxHours) return false;
  if (start < openHour || end > closeHour) return false;

  const status = computeDayStatus(occupants, rules);
  for (let h = start; h < end; h++) {
    if (status[h] !== "free") return false;
  }
  return true;
}
