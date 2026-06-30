import Link from "next/link";
import "../admin.css";
import { requireAdmin } from "@/lib/session";
import { logout } from "@/lib/admin/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  return (
    <div className="admin">
      <header className="admin-bar">
        <span className="brand">StudioONE admin</span>
        <nav>
          <Link href="/admin">Dashboard</Link>
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
