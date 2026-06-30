# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0–5 (Scaffold, Static port, Content model, Admin
  CMS, Bookings backend, Booking management + door code).
- **Stage just finished:** Phase 5.
- **Stage next:** Phase 6 — Harden + ship.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [x] **Phase 1 — Port the static site**
- [x] **Phase 2 — Content model + seed**
- [x] **Phase 3 — Admin + CMS**
- [x] **Phase 4 — Bookings backend**
- [x] **Phase 5 — Booking management + door code**
- [ ] **Phase 6 — Harden + ship**

---

## Run & deploy

### Local

```bash
npm install
cp .env.example .env       # DATABASE_URL, SESSION_SECRET, ADMIN_EMAIL/PASSWORD
npm run prisma:migrate
npm run db:seed
npm run dev                # site /, admin /admin
npm test                   # vitest: availability rules + double-booking race
```

### Deploy (Railway) — LIVE ✅

Merge the working branch to **`main`**; release runs
`prisma migrate deploy && npm run db:seed && npm run start`. Variables:
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `UPLOAD_DIR`
(volume) **or** the five `R2_*` vars, and for live email
`RESEND_API_KEY` / `EMAIL_FROM` / `STUDIO_ALERT_EMAILS`. Without a Resend key the
booking + confirm flows still work and emails are logged. Sandbox Prisma engine
note unchanged (fetch engines via curl, set `PRISMA_QUERY_ENGINE_LIBRARY` etc.).

---

## Last stage — Phase 5 (what was built)

The full booking lifecycle + availability controls, in the admin.

- **`lib/email.ts` → `sendDoorCode`** — guest email on confirm: greeting,
  confirmed slot, the current door code (prominent), address + access notes
  (`doorCodeNote`), reply-to the studio contact. All input escaped. `send()` now
  supports `replyTo`.
- **`lib/admin/booking-actions.ts`** (all `requireAdmin`-gated):
  - `confirmBooking` — PENDING → CONFIRMED, sets `confirmedAt`/`codeSentAt`,
    emails the door code (address pulled from the editable footer "Address"
    column), revalidates `/`.
  - `cancelBooking` — → CANCELLED, sets `cancelledAt`, frees the slot.
  - `resendDoorCode` — re-sends to a CONFIRMED booking.
  - `createBlock`/`deleteBlock` (one-off) and `createHold`/`deleteHold` (weekly).
- **`/admin/bookings`** — list + status filter (with counts), per-booking
  Confirm / Resend code / Cancel, and a four-week availability overview grid.
- **`/admin/blocks`** — add/list/delete one-off blocks.
- **`/admin/holds`** — add/list/delete weekly recurring holds.
- Nav updated; `<select>`/`date` inputs styled. Door code, note and alert
  recipients remain editable in `/admin/settings` (Phase 3).

Blocks & holds already feed availability via `lib/booking/service`
(`occupantsForWindow` + the create transaction), so they subtract immediately.

---

## Verify (Phase 5 gate) — ✅ PASSED

`npm run lint`, `npm run format:check`, `npm run build`, `npm test` (13) all pass.
End-to-end against the live server + DB:

- **Confirm:** a PENDING booking → **CONFIRMED** (`confirmedAt`/`codeSentAt`
  set) and the **door-code email** was dispatched to the guest (logged without a
  key), with the confirmed slot — never to the studio alert.
- **Cancel:** the confirmed booking → **CANCELLED** (`cancelledAt` set) and its
  slot **disappeared from `/api/availability`** (freed).
- **Recurring hold:** adding a Wednesday 14:00–16:00 hold made that slot
  **occupied on every Wednesday** in the window (projection works). Blocks use
  the same occupant path.

(Test bookings/holds/blocks were cleared afterwards.)

---

## Open questions / known limitations

1. **R2 / Resend:** set the `R2_*` and `RESEND_*` vars on Railway to switch image
   storage to R2 and enable live email (both implemented; logged/fallback until
   then).
2. **Diary timezone:** the guest's picked date uses their browser's local day;
   the server validates it as London. Fine for UK users (revisit in Phase 6 if a
   non-UK edge case matters).
3. **Refund flag:** cancel currently just frees the slot; an explicit
   "refund noted" flag (CLAUDE.md §9, no money moves) is not yet stored — add in
   Phase 6 if wanted (small `Booking` field + checkbox).
4. **Security headers / CSP**, full §12 pass, README deploy/DNS docs, and removing
   the BACS "demo" flag path are Phase 6.

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 6 — Harden + ship.** Security pass (§12), tests (§13), README +
deploy/DNS docs, remove the BACS "demo" flag path, final Railway deploy on the
custom domain with Resend DNS verified.

**Gate:** Definition of Done (§17).

Detail: security (CLAUDE.md §12) — confirm every `/admin` route + mutation is
gated (middleware + `requireAdmin`), zod on every external input (booking form +
admin forms + settings; reject unknown fields), login rate-limit + generic
errors (done — review), rate-limit + honeypot on `POST /api/bookings` (done —
review), escape all user strings in HTML/email (the rich parser escapes by
construction; email helpers escape — audit), HTTP-only/secure/same-site session
cookie (done), and add sensible **security headers / CSP** (now feasible since
GSAP/Lenis are bundled — set in `next.config.ts` headers() or middleware; allow
the OSM iframe + Google Fonts + R2 image origin). Tests (§13) — extend Vitest
coverage (BST/GMT boundary for past-hour, recurring-hold projection edge) and
consider a Playwright e2e for the booking + admin-confirm path. README — local
setup, `.env.example` (current), seed command, Railway deploy + custom-domain +
Resend DNS steps (mostly present — refresh for Phases 3–5). Remove the BACS
"demo details" path once real details are entered (the flag already hides via
settings; drop the dead placeholder). Then the final Railway deploy on the
custom domain with Resend DNS verified → Definition of Done (§17).
