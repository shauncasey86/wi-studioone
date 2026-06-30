// Europe/London time helpers. All availability / "today" / open-hours logic
// runs in London; timestamps are stored in UTC. Dates are represented as
// calendar-date keys (UTC-midnight Date) so DST never shifts a day boundary;
// hours are London clock integers.

export const LONDON = "Europe/London";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Current wall-clock in London. */
export function londonNow(at: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
} {
  const p = Object.fromEntries(
    partsFmt.formatToParts(at).map((x) => [x.type, x.value]),
  );
  let hour = parseInt(p.hour, 10);
  if (hour === 24) hour = 0; // some engines emit "24" at midnight
  return {
    year: parseInt(p.year, 10),
    month: parseInt(p.month, 10),
    day: parseInt(p.day, 10),
    hour,
    minute: parseInt(p.minute, 10),
  };
}

/** A calendar-date key: UTC-midnight Date for the given London Y-M-D. */
export function dateKey(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

/** Today's London date as a calendar-date key. */
export function todayKey(at: Date = new Date()): Date {
  const n = londonNow(at);
  return dateKey(n.year, n.month, n.day);
}

/** Add whole days to a calendar-date key (safe across DST — keys are UTC-mid). */
export function addDays(key: Date, days: number): Date {
  return new Date(key.getTime() + days * 86400000);
}

/** ISO date string (YYYY-MM-DD) from a calendar-date key. */
export function isoOf(key: Date): string {
  return key.toISOString().slice(0, 10);
}

/** Weekday for a calendar-date key, 0=Mon … 6=Sun (matches RecurringHold). */
export function weekdayMon0(key: Date): number {
  return (key.getUTCDay() + 6) % 7;
}

/** Whole hours between a clock hour pair, formatted HH:00. */
export function hhmm(hour: number): string {
  return String(hour).padStart(2, "0") + ":00";
}
