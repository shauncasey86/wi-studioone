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
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "hello@studioone.room";
  if (!key) {
    console.log(
      `[email] (no RESEND_API_KEY) would send "${opts.subject}" to`,
      opts.to,
    );
    return;
  }
  if (!opts.to.length) return;
  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
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
