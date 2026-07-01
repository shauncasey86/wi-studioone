import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/session";
import {
  confirmBooking,
  cancelBooking,
  resendDoorCode,
} from "@/lib/admin/booking-actions";
import { getAvailabilityWindow } from "@/lib/booking/service";
import { todayKey, addDays, isoOf } from "@/lib/booking/time";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

const STATUSES = [
  "RESERVED",
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
] as const;
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
function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireCapability("bookings");
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
      <PageHeader
        eyebrow="Operations"
        title={
          <>
            The <em>diary.</em>
          </>
        }
        lede="Reserved = slot held while the guest arranges payment. Pending = the guest says they've paid — check the transfer, then confirm to email their door code. Cancel to free the slot."
      />

      <nav className="admin-filters" aria-label="Filter bookings">
        <Link
          className="admin-chip"
          href="/admin/bookings"
          aria-current={!filter ? "true" : undefined}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            className="admin-chip"
            href={`/admin/bookings?status=${s}`}
            aria-current={filter === s ? "true" : undefined}
          >
            {titleCase(s)}
            <span className="admin-chip-count">{countOf(s)}</span>
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <p className="admin-empty">
          No bookings{filter ? ` with status ${filter.toLowerCase()}` : ""}.
        </p>
      ) : (
        <ul className="admin-bookings">
          {bookings.map((b) => (
            <li className="admin-booking" key={b.id}>
              <div className="admin-booking-main">
                <p className="admin-booking-when">
                  <strong>{isoOf(b.date)}</strong>
                  <span>
                    {hh(b.startHour)}–{hh(b.endHour)}
                  </span>
                  <span className="admin-booking-dot">·</span>
                  <span>{b.hours}h</span>
                  <span className="admin-booking-dot">·</span>
                  <span>{money(b.pricePence)}</span>
                </p>
                <p className="admin-booking-who">
                  {b.name} · {b.email} · ref {b.reference}
                  {b.confirmedAt ? " · code sent" : ""}
                </p>
              </div>
              <div className="admin-booking-side">
                <span
                  className="admin-status"
                  data-status={b.status.toLowerCase()}
                >
                  {titleCase(b.status)}
                </span>
                <div className="admin-booking-ops">
                  {(b.status === "PENDING" || b.status === "RESERVED") && (
                    <form action={confirmBooking.bind(null, b.id)}>
                      <button className="btn" type="submit">
                        Confirm &amp; email code
                      </button>
                    </form>
                  )}
                  {b.status === "CONFIRMED" && (
                    <form action={resendDoorCode.bind(null, b.id)}>
                      <button className="btn ghost" type="submit">
                        Resend code
                      </button>
                    </form>
                  )}
                  {(b.status === "RESERVED" ||
                    b.status === "PENDING" ||
                    b.status === "CONFIRMED") && (
                    <form action={cancelBooking.bind(null, b.id)}>
                      <button className="btn ghost" type="submit">
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2>Four-week overview</h2>
      <p className="admin-lede">
        Held or booked intervals per day (including blocks &amp; holds).
      </p>
      <div className="admin-calendar">
        {Object.keys(window)
          .map(Number)
          .sort((a, b) => a - b)
          .map((off) => {
            const d = addDays(today, off);
            const intervals = window[off] || [];
            return (
              <div
                className="admin-day"
                key={off}
                data-busy={intervals.length > 0 || undefined}
              >
                <p className="admin-day-head">
                  {DOW[d.getUTCDay() === 0 ? 6 : d.getUTCDay() - 1]}{" "}
                  {d.getUTCDate()} {MON[d.getUTCMonth()]}
                </p>
                {intervals.length === 0 ? (
                  <p className="admin-day-free">free</p>
                ) : (
                  intervals.map((iv, i) => (
                    <p className="admin-day-iv" key={i}>
                      {iv.s}–{iv.e}
                    </p>
                  ))
                )}
              </div>
            );
          })}
      </div>
    </>
  );
}
