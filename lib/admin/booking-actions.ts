"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCapability } from "@/lib/session";
import { contactSchema } from "@/lib/content";
import { sendDoorCode, sendCancellation } from "@/lib/email";
import { isoOf, hhmm, dateKey } from "@/lib/booking/time";

function revalidateBookings() {
  revalidatePath("/admin/bookings");
  revalidatePath("/"); // availability changes
}

async function addressLine(): Promise<string> {
  const col = await prisma.footerColumn.findFirst({
    where: { title: "Address" },
  });
  const links = z
    .array(z.object({ label: z.string(), href: z.string() }))
    .safeParse(col?.links);
  if (links.success && links.data.length) {
    return links.data.map((l) => l.label).join(", ");
  }
  return "Sutton Village, Hull";
}

async function emailDoorCode(bookingId: string) {
  const [booking, settings, address] = await Promise.all([
    prisma.booking.findUnique({ where: { id: bookingId } }),
    prisma.siteSettings.findUniqueOrThrow({ where: { id: 1 } }),
    addressLine(),
  ]);
  if (!booking) return;
  const contact = contactSchema.safeParse(settings.contact);
  await sendDoorCode({
    to: booking.email,
    name: booking.name,
    day: isoOf(booking.date),
    start: hhmm(booking.startHour),
    end: hhmm(booking.endHour),
    doorCode: settings.doorCode,
    doorCodeNote: settings.doorCodeNote,
    address,
    replyTo: contact.success ? contact.data.email : undefined,
  });
}

export async function confirmBooking(id: string) {
  await requireCapability("bookings");
  const booking = await prisma.booking.findUnique({ where: { id } });
  // Confirm a booking the guest has claimed payment on (PENDING), or override a
  // still-held reservation if the studio has already seen the transfer land.
  if (
    !booking ||
    (booking.status !== "PENDING" && booking.status !== "RESERVED")
  )
    return;
  await prisma.booking.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      confirmedAt: new Date(),
      codeSentAt: new Date(),
    },
  });
  await emailDoorCode(id);
  revalidateBookings();
}

export async function cancelBooking(id: string) {
  await requireCapability("bookings");
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status === "CANCELLED") return;
  const wasConfirmed = booking.status === "CONFIRMED";
  await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });
  // Let the guest know their slot was released (don't fail the cancel on email).
  try {
    const settings = await prisma.siteSettings.findUniqueOrThrow({
      where: { id: 1 },
    });
    const contact = contactSchema.safeParse(settings.contact);
    await sendCancellation({
      to: booking.email,
      name: booking.name,
      day: isoOf(booking.date),
      start: hhmm(booking.startHour),
      end: hhmm(booking.endHour),
      reference: booking.reference,
      wasConfirmed,
      replyTo: contact.success ? contact.data.email : undefined,
    });
  } catch (e) {
    console.error("[bookings] cancellation email failed", e);
  }
  revalidateBookings();
}

export async function resendDoorCode(id: string) {
  await requireCapability("bookings");
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.status !== "CONFIRMED") return;
  await emailDoorCode(id);
  await prisma.booking.update({
    where: { id },
    data: { codeSentAt: new Date() },
  });
  revalidatePath("/admin/bookings");
}

// ── one-off blocks ──
export async function createBlock(formData: FormData) {
  await requireCapability("bookings");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(formData.get("date") || ""),
  );
  if (!m) return;
  const startHour = parseInt(String(formData.get("startHour")), 10);
  const endHour = parseInt(String(formData.get("endHour")), 10);
  if (
    !Number.isFinite(startHour) ||
    !Number.isFinite(endHour) ||
    endHour <= startHour
  )
    return;
  await prisma.block.create({
    data: {
      date: dateKey(+m[1], +m[2], +m[3]),
      startHour,
      endHour,
      label: String(formData.get("label") || "") || null,
    },
  });
  revalidatePath("/admin/blocks");
  revalidatePath("/");
}

export async function deleteBlock(id: string) {
  await requireCapability("bookings");
  await prisma.block.delete({ where: { id } });
  revalidatePath("/admin/blocks");
  revalidatePath("/");
}

// ── weekly recurring holds ──
export async function createHold(formData: FormData) {
  await requireCapability("bookings");
  const weekday = parseInt(String(formData.get("weekday")), 10);
  const startHour = parseInt(String(formData.get("startHour")), 10);
  const endHour = parseInt(String(formData.get("endHour")), 10);
  if (
    !Number.isFinite(weekday) ||
    weekday < 0 ||
    weekday > 6 ||
    !Number.isFinite(startHour) ||
    !Number.isFinite(endHour) ||
    endHour <= startHour
  )
    return;
  await prisma.recurringHold.create({
    data: {
      weekday,
      startHour,
      endHour,
      label: String(formData.get("label") || "") || null,
    },
  });
  revalidatePath("/admin/holds");
  revalidatePath("/");
}

export async function deleteHold(id: string) {
  await requireCapability("bookings");
  await prisma.recurringHold.delete({ where: { id } });
  revalidatePath("/admin/holds");
  revalidatePath("/");
}
