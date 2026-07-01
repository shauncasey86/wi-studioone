import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/admin/permissions";

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string; role: Role } | null> {
  const user = await prisma.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user) {
    // Constant-ish work even when the user is missing, to avoid timing leaks.
    await bcrypt.compare(
      password,
      "$2a$10$invalidinvalidinvalidinvalidinvalidu",
    );
    return null;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? { id: user.id, email: user.email, role: user.role } : null;
}

// Simple in-memory login rate limiter (single replica; resets on restart).
// Keyed by IP: max attempts per window, then locked until the window passes.
const ATTEMPTS = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

export function rateLimit(ip: string): { ok: boolean; retryInMs: number } {
  const now = Date.now();
  const rec = ATTEMPTS.get(ip);
  if (!rec || now > rec.resetAt) {
    ATTEMPTS.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, retryInMs: 0 };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS) {
    return { ok: false, retryInMs: rec.resetAt - now };
  }
  return { ok: true, retryInMs: 0 };
}

export function clearRateLimit(ip: string) {
  ATTEMPTS.delete(ip);
}
