import "server-only";
import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bacsSchema, type Bacs } from "@/lib/content";
import {
  todayKey,
  addDays,
  isoOf,
  weekdayMon0,
  londonNow,
  hhmm,
  dateKey,
} from "@/lib/booking/time";
import { slotIsFree, type Occupant } from "@/lib/booking/availability";

export type BookingConfig = {
  openHour: number;
  closeHour: number;
  minHours: number;
  maxHours: number;
  resetHours: number;
  daysAhead: number;
  pendingTtlHrs: number;
  bacs: Bacs;
  prices: Map<number, number>;
};

export async function getBookingConfig(): Promise<BookingConfig> {
  const [settings, tiers] = await Promise.all([
    prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.rateTier.findMany(),
  ]);
  return {
    openHour: settings.openHour,
    closeHour: settings.closeHour,
    minHours: settings.minHours,
    maxHours: settings.maxHours,
    resetHours: settings.resetHours,
    daysAhead: settings.daysAhead,
    pendingTtlHrs: settings.pendingTtlHrs,
    bacs: bacsSchema.parse(settings.bacs),
    prices: new Map(tiers.map((t) => [t.hours, t.price])),
  };
}

export function priceFor(cfg: BookingConfig, hours: number): number {
  const exact = cfg.prices.get(hours);
  if (exact != null) return exact;
  const base = cfg.prices.get(1) ?? 45;
  return Math.round(hours * base);
}

/** Lazily mark long-pending bookings as expired so their slots free up. */
export async function expirePending(cfg: BookingConfig): Promise<void> {
  const cutoff = new Date(Date.now() - cfg.pendingTtlHrs * 3600_000);
  await prisma.booking.updateMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    data: { status: "EXPIRED" },
  });
}

type DateOccupants = Map<string, Occupant[]>;

async function occupantsForWindow(
  cfg: BookingConfig,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<{ today: Date; map: DateOccupants }> {
  const today = todayKey();
  const end = addDays(today, cfg.daysAhead);
  const [bookings, blocks, holds] = await Promise.all([
    client.booking.findMany({
      where: {
        date: { gte: today, lt: end },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
      select: { date: true, startHour: true, endHour: true },
    }),
    client.block.findMany({
      where: { date: { gte: today, lt: end } },
      select: { date: true, startHour: true, endHour: true },
    }),
    client.recurringHold.findMany({
      select: { weekday: true, startHour: true, endHour: true },
    }),
  ]);

  const map: DateOccupants = new Map();
  const push = (iso: string, o: Occupant) => {
    const arr = map.get(iso) ?? [];
    arr.push(o);
    map.set(iso, arr);
  };
  for (const b of bookings)
    push(isoOf(b.date), { startHour: b.startHour, endHour: b.endHour });
  for (const b of blocks)
    push(isoOf(b.date), { startHour: b.startHour, endHour: b.endHour });
  for (let off = 0; off < cfg.daysAhead; off++) {
    const key = addDays(today, off);
    const wd = weekdayMon0(key);
    for (const h of holds) {
      if (h.weekday === wd)
        push(isoOf(key), { startHour: h.startHour, endHour: h.endHour });
    }
  }
  return { today, map };
}

/**
 * Availability for the whole window, in the shape the diary consumes:
 * { [dayOffset]: [{ s:'HH:MM', e:'HH:MM', label }] } — occupant intervals per
 * day (offset 0 = today, London). The client renders buffers/past from these
 * exactly as before; the POST endpoint is the authoritative guard.
 */
export async function getAvailabilityWindow(): Promise<
  Record<number, { s: string; e: string; label: string }[]>
> {
  const cfg = await getBookingConfig();
  await expirePending(cfg);
  const { today, map } = await occupantsForWindow(cfg);
  const out: Record<number, { s: string; e: string; label: string }[]> = {};
  for (let off = 0; off < cfg.daysAhead; off++) {
    const iso = isoOf(addDays(today, off));
    out[off] = (map.get(iso) ?? []).map((o) => ({
      s: hhmm(o.startHour),
      e: hhmm(o.endHour),
      label: "Held",
    }));
  }
  return out;
}

function generateReference(prefix: string): string {
  const raw = crypto
    .randomBytes(6)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "");
  const code = (raw + crypto.randomUUID().replace(/-/g, ""))
    .toUpperCase()
    .slice(0, 6);
  return `${prefix}-${code}`;
}

export type CreateInput = {
  name: string;
  email: string;
  dateISO: string;
  startHour: number;
  hours: number;
};

export type CreateResult =
  | {
      ok: true;
      reference: string;
      amountPence: number;
      bacs: Bacs;
      day: string;
      start: string;
      end: string;
    }
  | { ok: false; error: "unavailable" | "invalid" };

/** Create a PENDING booking, re-checking availability inside a transaction. */
export async function createPendingBooking(
  input: CreateInput,
): Promise<CreateResult> {
  const cfg = await getBookingConfig();
  await expirePending(cfg);

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.dateISO);
  if (!m) return { ok: false, error: "invalid" };
  const date = dateKey(+m[1], +m[2], +m[3]);
  const startHour = input.startHour;
  const endHour = startHour + input.hours;

  const today = todayKey();
  const end = addDays(today, cfg.daysAhead);
  if (date < today || date >= end) return { ok: false, error: "invalid" };

  const isToday = date.getTime() === today.getTime();
  const nowMinutes = isToday
    ? (() => {
        const n = londonNow();
        return n.hour * 60 + n.minute;
      })()
    : null;

  const pricePence = priceFor(cfg, input.hours) * 100;

  try {
    const reference = await prisma.$transaction(
      async (tx) => {
        // gather this date's occupants inside the transaction
        const [bookings, blocks, holds] = await Promise.all([
          tx.booking.findMany({
            where: { date, status: { in: ["CONFIRMED", "PENDING"] } },
            select: { startHour: true, endHour: true },
          }),
          tx.block.findMany({
            where: { date },
            select: { startHour: true, endHour: true },
          }),
          tx.recurringHold.findMany({
            where: { weekday: weekdayMon0(date) },
            select: { startHour: true, endHour: true },
          }),
        ]);
        const occupants: Occupant[] = [...bookings, ...blocks, ...holds];

        const free = slotIsFree(occupants, startHour, endHour, {
          openHour: cfg.openHour,
          closeHour: cfg.closeHour,
          resetHours: cfg.resetHours,
          minHours: cfg.minHours,
          maxHours: cfg.maxHours,
          nowMinutes,
        });
        if (!free) throw new Error("UNAVAILABLE");

        let ref = generateReference(cfg.bacs.referencePrefix);
        for (let i = 0; i < 3; i++) {
          const clash = await tx.booking.findUnique({
            where: { reference: ref },
          });
          if (!clash) break;
          ref = generateReference(cfg.bacs.referencePrefix);
        }
        await tx.booking.create({
          data: {
            name: input.name,
            email: input.email,
            date,
            startHour,
            endHour,
            hours: input.hours,
            pricePence,
            reference: ref,
            status: "PENDING",
          },
        });
        return ref;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return {
      ok: true,
      reference,
      amountPence: pricePence,
      bacs: cfg.bacs,
      day: input.dateISO,
      start: hhmm(startHour),
      end: hhmm(endHour),
    };
  } catch (err) {
    if (err instanceof Error && err.message === "UNAVAILABLE") {
      return { ok: false, error: "unavailable" };
    }
    // serialization failure / unique clash under race → treat as unavailable
    return { ok: false, error: "unavailable" };
  }
}
