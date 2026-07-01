import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin, sessionRole } from "@/lib/session";
import { can } from "@/lib/admin/permissions";
import { enterTestMode, exitTestMode } from "@/lib/admin/testmode";
import { resetEverything } from "@/lib/admin/reset";
import { todayKey, addDays, isoOf } from "@/lib/booking/time";
import PageHeader from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

function hh(h: number) {
  return String(h).padStart(2, "0") + ":00";
}

type QuickLink = { href: string; label: string; hint: string };

export default async function Dashboard() {
  const session = await requireAdmin();
  const role = sessionRole(session);
  const today = todayKey();
  const weekEnd = addDays(today, 7);

  const [pending, confirmedUpcoming, thisWeek, todaySessions, settings] =
    await Promise.all([
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.booking.count({
        where: { status: "CONFIRMED", date: { gte: today } },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", date: { gte: today, lt: weekEnd } },
      }),
      prisma.booking.findMany({
        where: { status: "CONFIRMED", date: today },
        orderBy: { startHour: "asc" },
      }),
      prisma.siteSettings.findUniqueOrThrow({
        where: { id: 1 },
        select: { testMode: true, testStartedAt: true },
      }),
    ]);

  const canBookings = can(role, "bookings");
  const canTest = can(role, "testmode");

  const quickLinks: QuickLink[] = [
    canBookings && {
      href: "/admin/bookings",
      label: "Bookings",
      hint: "Confirm, cancel, resend the door code",
    },
    can(role, "hours") && {
      href: "/admin/hours",
      label: "Opening hours",
      hint: "Open/close times and booking rules",
    },
    canBookings && {
      href: "/admin/blocks",
      label: "Blocks & holds",
      hint: "One-off and recurring closures",
    },
    can(role, "content") && {
      href: "/admin/content",
      label: "Content",
      hint: "Every word the public site renders",
    },
    can(role, "pricing") && {
      href: "/admin/pricing",
      label: "Pricing",
      hint: "Rate tiers per booking length",
    },
    can(role, "settings") && {
      href: "/admin/settings",
      label: "Settings",
      hint: "BACS, door code, map, alerts",
    },
    can(role, "team") && {
      href: "/admin/team",
      label: "Team",
      hint: "Add or remove sub-admins",
    },
  ].filter((x): x is QuickLink => Boolean(x));

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={
          <>
            The <em>front desk.</em>
          </>
        }
        lede={
          canBookings
            ? "Everything the studio needs at a glance — what needs confirming, and who's in today."
            : "Manage the site content and configuration below."
        }
      />

      {canBookings && (
        <section className="admin-stats" aria-label="At a glance">
          <Link
            href="/admin/bookings?status=PENDING"
            className="admin-stat"
            data-tone={pending > 0 ? "alert" : undefined}
          >
            <span className="admin-stat-num">{pending}</span>
            <span className="admin-stat-label">Awaiting confirmation</span>
            <span className="admin-stat-foot">
              {pending > 0 ? "Needs your attention →" : "All clear"}
            </span>
          </Link>
          <div className="admin-stat">
            <span className="admin-stat-num">{todaySessions.length}</span>
            <span className="admin-stat-label">In today</span>
            <span className="admin-stat-foot">Confirmed sessions</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{thisWeek}</span>
            <span className="admin-stat-label">Next 7 days</span>
            <span className="admin-stat-foot">Confirmed sessions</span>
          </div>
          <div className="admin-stat">
            <span className="admin-stat-num">{confirmedUpcoming}</span>
            <span className="admin-stat-label">Upcoming</span>
            <span className="admin-stat-foot">All confirmed ahead</span>
          </div>
        </section>
      )}

      {canBookings && (
        <section aria-labelledby="today-h">
          <h2 id="today-h">Today at the studio</h2>
          {todaySessions.length === 0 ? (
            <p className="admin-empty">
              No confirmed sessions today — {isoOf(today)}.
            </p>
          ) : (
            <ul className="admin-timeline">
              {todaySessions.map((b) => (
                <li key={b.id}>
                  <span className="admin-timeline-when">
                    {hh(b.startHour)}–{hh(b.endHour)}
                  </span>
                  <span className="admin-timeline-who">{b.name}</span>
                  <span className="admin-timeline-ref">{b.reference}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section aria-labelledby="jump-h">
        <h2 id="jump-h">Jump to</h2>
        <div className="admin-cards">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className="admin-card">
              <span className="admin-card-title">{l.label}</span>
              <span className="admin-card-hint">{l.hint}</span>
            </Link>
          ))}
        </div>
      </section>

      {canTest && (
        <section aria-labelledby="test-h">
          <h2 id="test-h">Testing mode</h2>
          {settings.testMode ? (
            <div className="admin-panel admin-panel--live">
              <p>
                <strong className="err">Testing mode is ON</strong>
                {settings.testStartedAt
                  ? ` since ${settings.testStartedAt
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")} UTC`
                  : ""}
                . The public site shows a testing banner; bookings and content
                edits made now are temporary.
              </p>
              <form action={exitTestMode}>
                <button className="btn" type="submit">
                  Turn off &amp; reset
                </button>
              </form>
            </div>
          ) : (
            <div className="admin-panel">
              <p className="admin-lede">
                Trial every feature end to end. While on you can book and edit
                freely; turning it off deletes any test bookings and restores
                the content, lists, blocks and holds to exactly how they are
                now.
              </p>
              <form action={enterTestMode}>
                <button className="btn" type="submit">
                  Turn on testing mode
                </button>
              </form>
            </div>
          )}
        </section>
      )}

      {canTest && (
        <section aria-labelledby="reset-h">
          <h2 id="reset-h">Reset to defaults</h2>
          <div className="admin-panel">
            <p className="admin-lede">
              Restore the original copy. Each content section and list has its
              own reset, or restore everything at once. This only changes site
              copy and lists — never bookings, pricing, settings or uploaded
              images.
            </p>
            <form action={resetEverything}>
              <button className="ghost" type="submit">
                Reset all content &amp; lists
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
