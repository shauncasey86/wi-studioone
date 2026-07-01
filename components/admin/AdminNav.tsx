"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/admin/actions";

export type NavItem = { href: string; label: string; hint?: string };
export type NavGroup = { title: string; items: NavItem[] };

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export default function AdminNav({
  groups,
  user,
  testMode,
}: {
  groups: NavGroup[];
  user: { label: string; role: string };
  testMode: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Closing on navigation (rather than in an effect) keeps the mobile drawer
  // tidy without a cascading re-render.
  const close = () => setOpen(false);

  return (
    <aside className="admin-side" data-open={open || undefined}>
      <div className="admin-side-head">
        <Link
          href="/admin"
          className="brand"
          aria-label="StudioONE admin home"
          onClick={close}
        >
          Studio<span className="hr">ONE</span>
        </Link>
        <span className="admin-side-kicker">Admin</span>
        <button
          type="button"
          className="admin-side-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      <div className="admin-side-panel" id={panelId}>
        {testMode && (
          <p className="admin-testflag" role="status">
            <span aria-hidden="true">●</span> Testing mode is live
          </p>
        )}

        <nav className="admin-nav" aria-label="Admin sections">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.title}>
              <p className="admin-nav-title">{group.title}</p>
              <ul>
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className="admin-nav-link"
                        onClick={close}
                      >
                        <span>{item.label}</span>
                        {item.hint && (
                          <span className="admin-nav-hint">{item.hint}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="admin-side-foot">
          <a
            className="admin-side-view"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
          >
            View site ↗
          </a>
          <div className="admin-side-user">
            <span className="admin-side-user-name">{user.label}</span>
            <span className="admin-pill" data-role={user.role}>
              {user.role}
            </span>
          </div>
          <form action={logout}>
            <button className="btn ghost admin-side-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
