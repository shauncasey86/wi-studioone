import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { enterTestMode, exitTestMode } from "@/lib/admin/testmode";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [pending, confirmed, settings] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.siteSettings.findUniqueOrThrow({
      where: { id: 1 },
      select: { testMode: true, testStartedAt: true },
    }),
  ]);

  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">Manage everything the public site renders.</p>

      <h2>Testing mode</h2>
      {settings.testMode ? (
        <>
          <p>
            <strong className="err">Testing mode is ON</strong>
            {settings.testStartedAt
              ? ` since ${settings.testStartedAt.toISOString().slice(0, 16).replace("T", " ")} UTC`
              : ""}
            . The public site shows a testing banner. Bookings and content edits
            made now are temporary.
          </p>
          <form action={exitTestMode}>
            <button className="btn" type="submit">
              Turn off &amp; reset (delete test bookings, restore content)
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="muted">
            Turn on to trial every feature end to end. While on, you can book
            and edit freely; turning it off deletes any bookings made and
            restores the content/lists/blocks/holds to exactly how they are now.
          </p>
          <form action={enterTestMode}>
            <button className="btn" type="submit">
              Turn on testing mode
            </button>
          </form>
        </>
      )}

      <h2>Bookings</h2>
      <p>
        Pending: <strong>{pending}</strong> · Confirmed:{" "}
        <strong>{confirmed}</strong> ·{" "}
        <Link href="/admin/bookings">Manage →</Link>
      </p>

      <h2>Edit</h2>
      <ul>
        <li>
          <Link href="/admin/content">Content</Link> — all copy, per section
        </li>
        <li>
          <Link href="/admin/lists">Lists</Link> — add / remove / reorder
          repeatable items
        </li>
        <li>
          <Link href="/admin/pricing">Pricing &amp; rules</Link> — rate tiers +
          open hours / limits
        </li>
        <li>
          <Link href="/admin/settings">Settings</Link> — BACS, door code, map,
          contact, emails
        </li>
      </ul>
    </>
  );
}
