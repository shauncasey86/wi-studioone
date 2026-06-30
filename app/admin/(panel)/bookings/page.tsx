import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  confirmBooking,
  cancelBooking,
  resendDoorCode,
} from "@/lib/admin/booking-actions";
import { getAvailabilityWindow } from "@/lib/booking/service";
import { todayKey, addDays, isoOf } from "@/lib/booking/time";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"] as const;
type Status = (typeof STATUSES)[number];

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MON = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function money(pence: number) {
  return "£" + (pence / 100).toFixed(0);
}
function hh(h: number) {
  return String(h).padStart(2, "0") + ":00";
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = STATUSES.includes(sp.status as Status)
    ? (sp.status as Status)
    : null;

  const [bookings, counts, window] = await Promise.all([
    prisma.booking.findMany({
      where: filter ? { status: filter } : {},
      orderBy: [{ date: "asc" }, { startHour: "asc" }],
      take: 200,
    }),
    prisma.booking.groupBy({ by: ["status"], _count: true }),
    getAvailabilityWindow(),
  ]);
  const countOf = (s: Status) =>
    counts.find((c) => c.status === s)?._count ?? 0;

  const today = todayKey();

  return (
    <>
      <h1>Bookings</h1>
      <p className="muted">
        Confirm a paid booking to email the guest their door code. Cancel to
        free the slot.
      </p>

      <div className="row" style={{ margin: "1.2rem 0", gap: "0.8rem" }}>
        <Link className="ghost btn" href="/admin/bookings">
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            className="ghost btn"
            href={`/admin/bookings?status=${s}`}
          >
            {s} ({countOf(s)})
          </Link>
        ))}
      </div>

      {bookings.length === 0 ? (
        <p className="muted">
          No bookings{filter ? ` with status ${filter}` : ""}.
        </p>
      ) : (
        bookings.map((b) => (
          <div className="list-item" key={b.id}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <strong>{isoOf(b.date)}</strong> · {hh(b.startHour)}–
                {hh(b.endHour)} · {b.hours}h · {money(b.pricePence)}
              </div>
              <div className="hint">{b.status}</div>
            </div>
            <div className="hint" style={{ marginTop: "0.4rem" }}>
              {b.name} · {b.email} · ref {b.reference}
              {b.confirmedAt ? " · code sent" : ""}
            </div>
            <div className="ops">
              {b.status === "PENDING" && (
                <form action={confirmBooking.bind(null, b.id)}>
                  <button className="btn" type="submit">
                    Confirm &amp; email code
                  </button>
                </form>
              )}
              {b.status === "CONFIRMED" && (
                <form action={resendDoorCode.bind(null, b.id)}>
                  <button className="ghost btn" type="submit">
                    Resend code
                  </button>
                </form>
              )}
              {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                <form action={cancelBooking.bind(null, b.id)}>
                  <button className="ghost btn" type="submit">
                    Cancel
                  </button>
                </form>
              )}
            </div>
          </div>
        ))
      )}

      <h2>Four-week overview</h2>
      <p className="muted">
        Held/booked intervals per day (incl. blocks & holds).
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.4rem",
          marginTop: "0.8rem",
        }}
      >
        {Object.keys(window)
          .map(Number)
          .sort((a, b) => a - b)
          .map((off) => {
            const d = addDays(today, off);
            const intervals = window[off] || [];
            return (
              <div
                key={off}
                style={{
                  border: "1px solid rgba(20,17,11,.16)",
                  padding: "0.4rem 0.5rem",
                  background: intervals.length
                    ? "rgba(217,131,36,.10)"
                    : "transparent",
                  fontSize: 12,
                }}
              >
                <div className="hint">
                  {DOW[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1]}{" "}
                  {d.getUTCDate()} {MON[d.getUTCMonth()]}
                </div>
                {intervals.length === 0 ? (
                  <div style={{ opacity: 0.5 }}>free</div>
                ) : (
                  intervals.map((iv, i) => (
                    <div key={i}>
                      {iv.s}–{iv.e}
                    </div>
                  ))
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
