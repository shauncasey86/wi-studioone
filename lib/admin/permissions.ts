// The admin permission model. Two roles: the OWNER (seeded from ADMIN_EMAIL,
// full access) and SUBADMIN (scoped to day-to-day operations — bookings and
// opening hours). Capabilities, not pages, are the unit of authorisation so the
// nav, the pages and the mutations all agree on one source of truth.
//
// Edge-safe on purpose (no "server-only", no node imports): middleware, server
// components and server actions all import it.

export type Role = "OWNER" | "SUBADMIN";

export type Capability =
  | "bookings" // bookings, blocks, holds — everything that shapes availability
  | "hours" // opening hours + booking-window rules
  | "content" // site copy
  | "lists" // reorderable lists
  | "pricing" // rate tiers (£)
  | "settings" // BACS, door code, map, contact, alerts
  | "testmode" // enter/exit testing mode, reset to defaults
  | "team"; // create/remove sub-admins

// What each role may do. OWNER is intentionally the complement of "everything";
// SUBADMIN is an explicit allow-list so widening it is a deliberate edit here.
const SUBADMIN_CAPABILITIES: ReadonlySet<Capability> = new Set([
  "bookings",
  "hours",
]);

export function can(role: Role | undefined, cap: Capability): boolean {
  if (role === "OWNER") return true;
  if (role === "SUBADMIN") return SUBADMIN_CAPABILITIES.has(cap);
  return false;
}

export function roleLabel(role: Role | undefined): string {
  return role === "SUBADMIN" ? "Sub-admin" : "Owner";
}
