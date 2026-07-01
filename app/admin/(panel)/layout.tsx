import "../admin.css";
import { requireAdmin, sessionRole } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { can, roleLabel, type Capability } from "@/lib/admin/permissions";
import AdminNav, { type NavGroup } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

// The nav, expressed once as capability-tagged items. The layout filters it by
// the signed-in role so a sub-admin simply never sees owner-only sections.
const NAV: {
  title: string;
  items: { href: string; label: string; cap?: Capability }[];
}[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/bookings", label: "Bookings", cap: "bookings" },
      { href: "/admin/blocks", label: "Blocks", cap: "bookings" },
      { href: "/admin/holds", label: "Holds", cap: "bookings" },
      { href: "/admin/hours", label: "Opening hours", cap: "hours" },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/content", label: "Content", cap: "content" },
      { href: "/admin/lists", label: "Lists", cap: "lists" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { href: "/admin/pricing", label: "Pricing", cap: "pricing" },
      { href: "/admin/settings", label: "Settings", cap: "settings" },
      { href: "/admin/team", label: "Team", cap: "team" },
    ],
  },
];

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  const role = sessionRole(session);

  const [settings, user] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { testMode: true },
    }),
    session.userId
      ? prisma.adminUser.findUnique({
          where: { id: session.userId },
          select: { name: true, email: true },
        })
      : null,
  ]);

  const groups: NavGroup[] = NAV.map((g) => ({
    title: g.title,
    items: g.items
      .filter((i) => !i.cap || can(role, i.cap))
      .map(({ href, label }) => ({ href, label })),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="admin">
      <a className="admin-skip" href="#admin-content">
        Skip to content
      </a>
      <div className="admin-shell">
        <AdminNav
          groups={groups}
          user={{
            label: user?.name || user?.email || session.email || "Signed in",
            role: roleLabel(role),
          }}
          testMode={settings?.testMode ?? false}
        />
        <main className="admin-main" id="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
}
