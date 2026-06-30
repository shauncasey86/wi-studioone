import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { bookingInputSchema } from "@/lib/booking/schema";
import { createPendingBooking } from "@/lib/booking/service";
import { rateLimit } from "@/lib/auth";
import { sendStudioAlert } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "local";
  const limit = rateLimit(`book:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  // honeypot: a filled "company" field means a bot — pretend success, do nothing
  if (parsed.data.company && parsed.data.company.trim() !== "") {
    return NextResponse.json({ ok: true, reference: "—" });
  }

  const result = await createPendingBooking({
    name: parsed.data.name,
    email: parsed.data.email,
    dateISO: parsed.data.dateISO,
    startHour: parsed.data.startHour,
    hours: parsed.data.hours,
  });

  if (!result.ok) {
    const status = result.error === "unavailable" ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  // Alert the studio (never includes the door code). Don't fail the booking if
  // email errors — the row is already created.
  try {
    await sendStudioAlert({
      name: parsed.data.name,
      email: parsed.data.email,
      day: result.day,
      start: result.start,
      end: result.end,
      hours: parsed.data.hours,
      amountPence: result.amountPence,
      reference: result.reference,
    });
  } catch (e) {
    console.error("[bookings] studio alert failed", e);
  }

  return NextResponse.json({
    ok: true,
    reference: result.reference,
    amountPence: result.amountPence,
    bacs: result.bacs,
  });
}
