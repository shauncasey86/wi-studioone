import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "@/lib/session-config";
import { can, type Capability, type Role } from "@/lib/admin/permissions";

export type { SessionData };

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

// The real auth boundary: call at the top of every admin page and every admin
// mutation. Redirects to the login page when not signed in.
export async function requireAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId) redirect("/admin/login");
  return session;
}

// Sessions minted before roles existed have no `role`; treat them as OWNER so
// the sole pre-existing owner is never locked out mid-session.
export function sessionRole(session: SessionData): Role {
  return session.role ?? "OWNER";
}

// The authorisation boundary: call at the top of every capability-gated page
// and mutation. Signed-in users lacking the capability bounce to the dashboard
// (the one page everyone can see), so a sub-admin who deep-links to an owner
// route never hits a raw 403.
export async function requireCapability(cap: Capability): Promise<SessionData> {
  const session = await requireAdmin();
  if (!can(sessionRole(session), cap)) redirect("/admin");
  return session;
}
