import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { claimReservation } from "@/lib/booking/service";
import { rateLimit } from "@/lib/auth";
import { sendStudioAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

// The guest presses "I've sent the payment" on the reservation modal. That's the
// point the booking is handed to the studio for confirmation — so this is where
// the studio alert is sent (once, on the RESERVED→PENDING transition).
const claimSchema = z.object({
  reference: z.string().trim().min(1).max(40),
});

export async function POST(req: Request) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "local";
  const limit = rateLimit(`claim:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const result = await claimReservation(parsed.data.reference);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  // Alert the studio only on the first claim (never includes the door code).
  // Don't fail the guest's request if email errors — the row is already PENDING.
  if (result.alerted) {
    try {
      await sendStudioAlert({
        name: result.name,
        email: result.email,
        day: result.day,
        start: result.start,
        end: result.end,
        hours: result.hours,
        amountPence: result.amountPence,
        reference: result.reference,
      });
    } catch (e) {
      console.error("[bookings/claim] studio alert failed", e);
    }
  }

  return NextResponse.json({ ok: true });
}
