import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createReservation } from "@/lib/booking/service";
import { prisma } from "@/lib/prisma";
import { todayKey, addDays, isoOf } from "@/lib/booking/time";

// Integration test — needs DATABASE_URL + a seeded SiteSettings/RateTier.
const day = addDays(todayKey(), 5);
const dateISO = isoOf(day);

async function clear() {
  await prisma.booking.deleteMany({ where: { date: day } });
}

beforeEach(clear);
afterAll(async () => {
  await clear();
  await prisma.$disconnect();
});

describe("booking transaction", () => {
  it("prevents double-booking under concurrency (one wins)", async () => {
    const base = { dateISO, startHour: 10, hours: 2 };
    const [r1, r2] = await Promise.all([
      createReservation({ ...base, name: "A", email: "a@example.com" }),
      createReservation({ ...base, name: "B", email: "b@example.com" }),
    ]);
    expect([r1, r2].filter((r) => r.ok).length).toBe(1);
    const rows = await prisma.booking.count({
      where: { date: day, status: "RESERVED" },
    });
    expect(rows).toBe(1);
  });

  it("rejects overlap incl. reset buffer, allows the next free slot", async () => {
    const a = await createReservation({
      name: "A",
      email: "a@example.com",
      dateISO,
      startHour: 10,
      hours: 2,
    }); // books 10–12, buffers 9 and 12
    expect(a.ok).toBe(true);

    const inBuffer = await createReservation({
      name: "B",
      email: "b@example.com",
      dateISO,
      startHour: 12,
      hours: 1,
    }); // 12 is buffer
    expect(inBuffer.ok).toBe(false);

    const afterBuffer = await createReservation({
      name: "C",
      email: "c@example.com",
      dateISO,
      startHour: 13,
      hours: 1,
    }); // free
    expect(afterBuffer.ok).toBe(true);
  });
});
