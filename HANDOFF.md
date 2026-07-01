# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> All six build phases are complete. What remains is owner configuration on
> Railway (variables, merge, optional custom domain) and ongoing changes. Full
> plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0–6 — **build complete.**
- **Stage just finished:** Client change-requests on the booking/payment flow
  (see "Change requests" below).
- **Stage next:** none — project build done. Remaining items are owner config
  (see "Go-live checklist") and any future change requests.

## Change requests (post-launch)

Booking journey now has an explicit **payment-claim** step so the studio isn't
chased for unpaid holds:

- **New `RESERVED` status** (migrations `payment_claim_flow` +
  `reserved_default`, plus `Booking.paidClaimedAt`). Reserving holds the slot as
  `RESERVED` and **does not** alert the studio. The guest presses **"I've sent
  the payment"** on the modal → `POST /api/bookings/claim` flips it to `PENDING`
  and fires the studio alert (once). Confirm → `CONFIRMED` + door code, as
  before. Stale `RESERVED` holds expire after `pendingTtlHrs`; `PENDING` (claimed)
  never auto-expires. `service.ts`: `createReservation` / `claimReservation` /
  `expireStaleReservations`. Availability counts all of RESERVED/PENDING/CONFIRMED.
- **Cancellations email the guest** (`sendCancellation`) and **all emails are
  restyled** to the app's umber/oat/marigold look (`lib/email.ts`, shared
  `emailShell`).
- **Booking box:** duplicate price removed from the length stepper; a hint makes
  the hourly stepper (any length, not just the presets) discoverable; the step-4
  "Pay by bank transfer" box is gone and its note is now a readable serif lede.
- **Modal:** marigold border + explicit Close/Done buttons; the reference and
  amount moved into the bank-details panel; the pay instruction is readable serif.
- **Admin:** bookings list + confirm/cancel handle `RESERVED`; the "Awaiting
  confirmation" dashboard stat still counts only `PENDING` (payment-claimed).
- **Payment reference:** unchanged — `{referencePrefix}-XXXXXX`, six A–Z0–9 chars
  from `crypto.randomBytes` + a UUID fallback, uniqueness re-checked in the
  create transaction (`generateReference` in `service.ts`).

### Full stage plan (from CLAUDE.md §14)

- [x] Phase 0 — Scaffold & repo
- [x] Phase 1 — Port the static site
- [x] Phase 2 — Content model + seed
- [x] Phase 3 — Admin + CMS
- [x] Phase 4 — Bookings backend
- [x] Phase 5 — Booking management + door code
- [x] Phase 6 — Harden + ship

---

## Run & deploy

### Local

```bash
npm install
cp .env.example .env      # DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL/PASSWORD
npm run prisma:migrate
npm run db:seed
npm run dev               # site / · admin /admin
npm test                  # 16 tests
```

### Railway

Merge the working branch to **`main`**; release runs
`prisma migrate deploy && npm run db:seed && npm run start`. Sandbox Prisma
engine note unchanged (curl the engines + set `PRISMA_QUERY_ENGINE_LIBRARY` /
`NODE_EXTRA_CA_CERTS` / `DATABASE_URL` for build/test/seed). Full variable list
and deploy steps are in `README.md`.

---

## Last stage — Phase 6 (what was built)

- **Testing mode** (`lib/admin/testmode.ts`, dashboard toggle) — `enterTestMode`
  snapshots SiteSettings (content + JSON + operational fields) and every list /
  block / hold and stamps `testStartedAt`; `exitTestMode` restores that snapshot
  and deletes bookings created during the window. A banner shows on the public
  site (`TestModeBanner`) and in the admin bar while on. Emails still send so you
  can verify them. New `SiteSettings` fields `testMode` / `testStartedAt` /
  `testSnapshot` (migration `test_mode`). Admin user + uploaded files are not
  touched by the reset.
- **Security headers + CSP** (`next.config.ts`) — CSP (self scripts/styles, OSM
  iframe, https/data images, self fonts), `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS. The public
  site renders with **0 CSP violations**.
- **Tests** — added `test/time.test.ts` (London BST/GMT conversion, DST-safe
  date keys, weekday projection). Suite is 16 tests across availability rules,
  the double-booking race, and time.
- **Docs** — `README.md` rewritten to cover admin, booking flow, testing mode,
  Railway vars, R2, and the swappable/borrowed Resend account.
- **Adaptations for your setup:** no custom domain yet → `NEXT_PUBLIC_SITE_URL`
  uses the Railway URL (swap later). Resend is env-driven and swappable; the
  BACS "Demo details" flag is settings-driven (no dead placeholder path).

---

## Verify (Phase 6 gate / Definition of Done) — ✅ PASSED

`npm run lint`, `npm run format:check`, `npm run build`, `npm test` (16) all pass.

- **Testing mode e2e:** ON → public banner; a content edit and a booking went
  live; OFF → banner gone, content reverted to baseline, the test booking
  deleted (count 0).
- **Security headers** present on responses; **CSP: 0 violations** and the site
  renders fully (fonts, day-arc, map allowance).
- DoD §17 met end-to-end across phases: DB-rendered site, full CMS, real bookings
  with London availability + double-booking prevention, admin lifecycle + door
  code, blocks/holds subtracting availability, tests + security pass. **Custom
  domain is the one deferred item** (no domain yet — Railway URL in use).

---

## Go-live checklist (owner config on Railway)

1. **Merge** `claude/working-method-handoff-athjdr` → `main` (Phases 3–6 are
   stacked on the branch).
2. **Variables:** `SESSION_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`,
   `NEXT_PUBLIC_SITE_URL` (Railway URL), `TZ=Europe/London`; `RESEND_API_KEY` +
   `EMAIL_FROM` (verified sender on that Resend account) + `STUDIO_ALERT_EMAILS`;
   the five `R2_*` vars (or a volume at `UPLOAD_DIR`).
3. **In the admin:** set the real BACS details + uncheck "Demo details", set the
   door code, set studio alert recipients, replace the OG image.
4. **Optional later:** add a custom domain (Railway Networking + DNS CNAME) and
   point `NEXT_PUBLIC_SITE_URL` + Resend's verified domain at it.

## Known limitations / future polish

- CSP uses `'unsafe-inline'` for scripts/styles (Next hydration + next/font);
  a nonce-based policy is a future hardening.
- Diary uses the guest's browser-local calendar day (validated as London
  server-side) — fine for UK; a non-UK browser could be off by one at midnight.
- Testing-mode reset restores content/lists/blocks/holds and deletes test
  bookings, but leaves uploaded image files in storage (orphaned, harmless).
- An explicit "refund noted" flag on cancel isn't stored (cancel just frees the
  slot) — add a small field if the owner wants it.
