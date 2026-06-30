import "server-only";
import { Resend } from "resend";

// Transactional email via Resend. If RESEND_API_KEY is unset (local/dev), emails
// are logged instead of sent, so the booking flow still works end to end.

function escapeHtml(v: string): string {
  return v.replace(
    /[&<>"]/g,
    (c) =>
      (
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }) as Record<
          string,
          string
        >
      )[c],
  );
}

async function send(opts: {
  to: string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  // Default to Resend's shared test sender so an unset EMAIL_FROM still works in
  // testing (onboarding@resend.dev needs no verified domain). Set EMAIL_FROM to
  // your own verified sender for production.
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  if (!key) {
    console.log(
      `[email] (no RESEND_API_KEY) would send "${opts.subject}" to`,
      opts.to,
    );
    return;
  }
  if (!opts.to.length) {
    console.warn(`[email] "${opts.subject}" has no recipients — not sent.`);
    return;
  }
  const resend = new Resend(key);
  // Resend returns { error } rather than throwing on API rejections (e.g. an
  // unverified from-address, or test-mode "can only send to your own address").
  // Surface it in the logs so misconfiguration is debuggable.
  const { data, error } = await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
  });
  if (error) {
    console.error(
      `[email] Resend rejected "${opts.subject}" (from ${from} → ${opts.to.join(", ")}):`,
      error,
    );
  } else {
    console.log(
      `[email] sent "${opts.subject}" → ${opts.to.join(", ")}`,
      data?.id,
    );
  }
}

/**
 * New-booking alert to the studio. Never includes the door code. Carries who /
 * when / duration / price / reference and a deep link to the admin booking.
 */
export async function sendStudioAlert(b: {
  name: string;
  email: string;
  day: string;
  start: string;
  end: string;
  hours: number;
  amountPence: number;
  reference: string;
}): Promise<void> {
  const recipients = (process.env.STUDIO_ALERT_EMAILS || "")
    .split(/[\n,]/)
    .map((e) => e.trim())
    .filter(Boolean);
  const adminUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") +
    "/admin/bookings";
  const amount = `£${(b.amountPence / 100).toFixed(0)}`;
  const html = `
    <h2>New booking — confirm payment</h2>
    <p>A new booking is awaiting your bank-transfer check.</p>
    <ul>
      <li><strong>Who:</strong> ${escapeHtml(b.name)} &lt;${escapeHtml(b.email)}&gt;</li>
      <li><strong>When:</strong> ${escapeHtml(b.day)} · ${escapeHtml(b.start)}–${escapeHtml(b.end)} (${b.hours}h)</li>
      <li><strong>Amount:</strong> ${amount}</li>
      <li><strong>Reference:</strong> ${escapeHtml(b.reference)}</li>
    </ul>
    <p>Once the transfer clears, confirm it in the admin to email the door code:</p>
    <p><a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></p>
  `;
  await send({
    to: recipients,
    subject: `New booking ${b.reference} — ${b.day} ${b.start}–${b.end}`,
    html,
  });
}

/**
 * Guest door-code email, sent when the studio confirms payment (Phase 5). Carries
 * the confirmed slot, the current door code, the address + access notes, and a
 * reply-to support line. Sent only to the guest — never to a public surface.
 */
export async function sendDoorCode(o: {
  to: string;
  name: string;
  day: string;
  start: string;
  end: string;
  doorCode: string;
  doorCodeNote?: string | null;
  address: string;
  replyTo?: string;
}): Promise<void> {
  const html = `
    <h2>You're booked — here's your door code</h2>
    <p>Hi ${escapeHtml(o.name)}, your booking is confirmed.</p>
    <p><strong>When:</strong> ${escapeHtml(o.day)} · ${escapeHtml(o.start)}–${escapeHtml(o.end)}</p>
    <p style="font-size:1.4rem;letter-spacing:.1em;">
      <strong>Door code: ${escapeHtml(o.doorCode)}</strong>
    </p>
    ${o.doorCodeNote ? `<p>${escapeHtml(o.doorCodeNote)}</p>` : ""}
    <p><strong>Where:</strong> ${escapeHtml(o.address)}</p>
    <p>Self-access, start to finish — the room is left ready for you. Just reply
    to this email if you need anything.</p>
  `;
  await send({
    to: [o.to],
    subject: `Your StudioONE door code — ${o.day} ${o.start}–${o.end}`,
    html,
    replyTo: o.replyTo,
  });
}
