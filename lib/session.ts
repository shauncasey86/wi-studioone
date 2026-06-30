import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionOptions, type SessionData } from "@/lib/session-config";

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
