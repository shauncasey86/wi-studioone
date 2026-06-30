import type { SessionOptions } from "iron-session";

// Edge-safe session config (no next/headers, no server-only) so it can be
// imported by both middleware (edge) and server components/actions.
export type SessionData = { userId?: string; email?: string };

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters.");
  }
  return {
    password,
    cookieName: "studioone_admin",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}
