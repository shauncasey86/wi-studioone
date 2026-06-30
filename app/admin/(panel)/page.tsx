import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [pending, confirmed] = await Promise.all([
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
  ]);
  return (
    <>
      <h1>Dashboard</h1>
      <p className="muted">Manage everything the public site renders.</p>

      <h2>Bookings</h2>
      <p>
        Pending: <strong>{pending}</strong> · Confirmed:{" "}
        <strong>{confirmed}</strong>
      </p>
      <p className="muted">
        Booking management (confirm / cancel / door code) arrives in Phase 5.
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
