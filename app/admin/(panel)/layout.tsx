import Link from "next/link";
import "../admin.css";
import { requireAdmin } from "@/lib/session";
import { logout } from "@/lib/admin/actions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { testMode: true },
  });
  return (
    <div className="admin">
      <header className="admin-bar">
        <span className="brand">
          Studio<span className="hr">ONE</span>
        </span>
        <span className="tag">admin</span>
        {settings?.testMode && (
          <span
            className="tag"
            style={{ color: "var(--marigold)", fontWeight: 700 }}
          >
            ● Testing mode
          </span>
        )}
        <nav>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/bookings">Bookings</Link>
          <Link href="/admin/blocks">Blocks</Link>
          <Link href="/admin/holds">Holds</Link>
          <Link href="/admin/content">Content</Link>
          <Link href="/admin/lists">Lists</Link>
          <Link href="/admin/pricing">Pricing &amp; rules</Link>
          <Link href="/admin/settings">Settings</Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            View site ↗
          </a>
        </nav>
        <form action={logout}>
          <button className="btn ghost" type="submit">
            Sign out ({session.email})
          </button>
        </form>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
