import "server-only";
import { Resend } from "resend";

// Transactional email via Resend. If RESEND_API_KEY is unset (local/dev), emails
// are logged instead of sent, so the booking flow still works end to end.
//
// Every email is rendered through `emailShell` so they share the public site's
// look: warm umber ground, oat text, a marigold signal, serif headings and
// mono micro-labels. Email clients strip <style> unreliably and never load web
// fonts, so all styling is inline and uses web-safe font stacks that echo the
// site (Georgia serif, Courier mono).

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

// ── shared palette (mirrors app/globals.css :root) ──
const C = {
  ground: "#181009",
  card: "#221a13",
  panel: "#2c2118",
  border: "#3a2f22",
  paper: "#ece4d3",
  dim: "#b8ad95",
  quiet: "#9c927c",
  marigold: "#d98324",
};
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', Courier, monospace";

/** A definition-list row for the meta / bank-details panels. */
type Row = { label: string; value: string; accent?: boolean; big?: boolean };

function metaPanel(title: string, rows: Row[]): string {
  const body = rows
    .map((r, i) => {
      const border =
        i === rows.length - 1 ? "" : `border-bottom:1px solid ${C.border};`;
      const valColor = r.accent ? C.marigold : C.paper;
      const valSize = r.big ? "20px" : "15px";
      const valWeight = r.accent || r.big ? "700" : "400";
      return `
      <tr>
        <td style="padding:11px 0;${border}font-family:${MONO};font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${C.quiet};">${escapeHtml(
          r.label,
        )}</td>
        <td style="padding:11px 0;${border}font-family:${MONO};font-size:${valSize};font-weight:${valWeight};color:${valColor};text-align:right;">${escapeHtml(
          r.value,
        )}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.panel};border:1px solid ${C.border};border-collapse:separate;margin:8px 0 22px;">
      <tr><td style="padding:18px 22px 6px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.dim};">${escapeHtml(
        title,
      )}</td></tr>
      <tr><td style="padding:0 22px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table></td></tr>
    </table>`;
}

function emailShell(opts: {
  preheader: string;
  kicker: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.ground};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escapeHtml(
    opts.preheader,
  )}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.ground};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${C.card};border:1px solid ${C.border};">
        <tr><td style="padding:28px 30px 0;">
          <span style="font-family:${MONO};font-size:12px;letter-spacing:5px;text-transform:uppercase;color:${C.marigold};">Studio<span style="color:${C.paper};">ONE</span></span>
        </td></tr>
        <tr><td style="padding:22px 30px 6px;">
          <span style="font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.dim};">${escapeHtml(
            opts.kicker,
          )}</span>
        </td></tr>
        <tr><td style="padding:0 30px 6px;">
          <h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.1;letter-spacing:-0.5px;color:${C.paper};">${escapeHtml(
            opts.heading,
          )}</h1>
        </td></tr>
        <tr><td style="padding:14px 30px 30px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.dim};">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 30px 26px;border-top:1px solid ${C.border};font-family:${MONO};font-size:11px;letter-spacing:1px;color:${C.quiet};">
          StudioONE · one room in Hull, booked by the hour
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 14px;font-family:${SERIF};font-size:16px;line-height:1.6;color:${C.dim};">${html}</p>`;
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
 * New-booking alert to the studio, sent when the guest confirms they've sent the
 * transfer (not on reservation). Never includes the door code. Carries who /
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
  const bodyHtml =
    paragraph(
      `<strong style="color:${C.paper};font-weight:400;">${escapeHtml(
        b.name,
      )}</strong> says they've sent the bank transfer. Check it's landed, then confirm in the admin to email their door code.`,
    ) +
    metaPanel("Booking", [
      { label: "Guest", value: b.name },
      { label: "Email", value: b.email },
      { label: "When", value: `${b.day} · ${b.start}–${b.end}` },
      { label: "Length", value: `${b.hours}h` },
      { label: "Reference", value: b.reference, accent: true },
      { label: "Amount", value: amount, big: true, accent: true },
    ]) +
    `<table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${C.marigold};">
      <a href="${escapeHtml(
        adminUrl,
      )}" style="display:inline-block;padding:13px 26px;font-family:${MONO};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.ground};text-decoration:none;">Open the diary →</a>
    </td></tr></table>`;
  await send({
    to: recipients,
    subject: `Payment sent · ${b.reference} — ${b.day} ${b.start}–${b.end}`,
    html: emailShell({
      preheader: `${b.name} says they've paid for ${b.day} ${b.start}–${b.end}.`,
      kicker: "New booking — confirm payment",
      heading: "Payment on its way",
      bodyHtml,
    }),
  });
}

/**
 * Guest door-code email, sent when the studio confirms payment. Carries the
 * confirmed slot, the current door code, the address + access notes, and a
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
  const bodyHtml =
    paragraph(
      `Hi ${escapeHtml(
        o.name,
      )}, your payment's in and the room is yours. Here's everything you need to let yourself in.`,
    ) +
    metaPanel("Your session", [
      { label: "When", value: `${o.day} · ${o.start}–${o.end}` },
      { label: "Where", value: o.address },
      { label: "Door code", value: o.doorCode, big: true, accent: true },
    ]) +
    (o.doorCodeNote ? paragraph(escapeHtml(o.doorCodeNote)) : "") +
    paragraph(
      "Self-access, start to finish — the room is left ready for you. Just reply to this email if you need anything.",
    );
  await send({
    to: [o.to],
    subject: `You're booked — StudioONE door code · ${o.day} ${o.start}–${o.end}`,
    html: emailShell({
      preheader: `Your door code for ${o.day} ${o.start}–${o.end}.`,
      kicker: "Booking confirmed",
      heading: "You're booked in",
      bodyHtml,
    }),
    replyTo: o.replyTo,
  });
}

/**
 * Guest cancellation email, sent when the studio cancels a reserved/pending/
 * confirmed booking. Confirms which slot was released and offers a reply-to.
 */
export async function sendCancellation(o: {
  to: string;
  name: string;
  day: string;
  start: string;
  end: string;
  reference: string;
  wasConfirmed: boolean;
  replyTo?: string;
}): Promise<void> {
  const bodyHtml =
    paragraph(
      `Hi ${escapeHtml(
        o.name,
      )}, we're letting you know your booking with StudioONE has been cancelled and the slot released.`,
    ) +
    metaPanel("Cancelled booking", [
      { label: "When", value: `${o.day} · ${o.start}–${o.end}` },
      { label: "Reference", value: o.reference, accent: true },
    ]) +
    paragraph(
      o.wasConfirmed
        ? "If you'd already paid, we'll be in touch about a refund — or just reply to this email and we'll sort it."
        : "Nothing's been taken from you. If this is a surprise or you'd still like the room, reply to this email and we'll help.",
    );
  await send({
    to: [o.to],
    subject: `Booking cancelled — StudioONE · ${o.day} ${o.start}–${o.end}`,
    html: emailShell({
      preheader: `Your StudioONE booking for ${o.day} ${o.start}–${o.end} was cancelled.`,
      kicker: "Booking cancelled",
      heading: "Your booking's been cancelled",
      bodyHtml,
    }),
    replyTo: o.replyTo,
  });
}
