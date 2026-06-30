# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0–4 (Scaffold, Static port, Content model, Admin
  CMS, Bookings backend).
- **Stage just finished:** Phase 4.
- **Stage next:** Phase 5 — Booking management + door code.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [x] **Phase 1 — Port the static site**
- [x] **Phase 2 — Content model + seed**
- [x] **Phase 3 — Admin + CMS**
- [x] **Phase 4 — Bookings backend**
- [ ] **Phase 5 — Booking management + door code**
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
`prisma migrate deploy && npm run db:seed && npm run start`. Variables to set
(beyond earlier phases' `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_*`,
`UPLOAD_DIR`):

- **Email (studio alert):** `RESEND_API_KEY`, `EMAIL_FROM`,
  `STUDIO_ALERT_EMAILS` (comma-separated). Without `RESEND_API_KEY` the booking
  still works and the alert is logged instead of sent.
- **R2 (images):** the five `R2_*` vars — activates R2 automatically.

### ⚠️ Sandbox Prisma engine note

Unchanged from prior phases: fetch engines via `curl --cacert` and set
`PRISMA_QUERY_ENGINE_LIBRARY` + `NODE_EXTRA_CA_CERTS` + `DATABASE_URL` for
build/test/seed in the sandbox. `.env` wires local values.

---

## Last stage — Phase 4 (what was built)

The booking engine is now real and server-authoritative (CLAUDE.md §8/§9).

- **`lib/booking/time.ts`** — Europe/London helpers (timestamps stored UTC;
  dates as UTC-midnight calendar keys so DST never shifts a day; hours are
  London clock ints; weekday Mon=0).
- **`lib/booking/availability.ts`** — pure rules (no DB, unit-tested):
  `computeDayStatus` (booked + `resetHours` buffer each side + past-hour greying)
  and `slotIsFree` (whole hours, min/max, open hours, past, buffers).
- **`lib/booking/service.ts`** — DB layer: `getBookingConfig` (operational
  settings + tiers + BACS), `expirePending` (frees PENDINGs older than
  `pendingTtlHrs`), `getAvailabilityWindow` (the diary-shaped window), and
  `createPendingBooking` — re-checks the slot inside a **Serializable**
  transaction, generates a server `{referencePrefix}-XXXXXX` reference, prices
  from the tiers, and creates the PENDING row. Occupants = CONFIRMED +
  active-PENDING bookings, one-off `Block`s, and `RecurringHold`s projected onto
  each date.
- **`app/api/availability` (GET)** — live window for the diary.
- **`app/api/bookings` (POST)** — zod-validated, IP rate-limited, honeypot
  (`company`), creates the PENDING booking and emails the studio. Returns
  `{ reference, amountPence, bacs }`. 409 on a taken slot, 400 on bad input.
- **`lib/email.ts`** — Resend studio alert (who/when/price/reference + admin
  link; **never** the door code). Logs instead of sending when
  `RESEND_API_KEY` is unset.
- **Diary wired to the real API** — `lib/availability.ts` now calls the GET/POST
  endpoints; `<BookingDiary/>` takes a `config` prop (open/close, min/max, reset,
  days-ahead, tier prices, BACS) from `DiarySection`, so it's settings-driven and
  shows the real BACS details + the server reference in the "Awaiting payment"
  panel. The guest reserves (holds the slot), then transfers using the shown
  reference; the door code is emailed on admin confirm (Phase 5).

New deps: `resend`, `vitest` (dev).

---

## Verify (Phase 4 gate) — ✅ PASSED

`npm run lint`, `npm run format:check`, `npm run build`, and `npm test` all pass.

- **Unit (`test/availability.test.ts`)** — reset buffers both sides, min/max,
  open-hours bounds, whole hours, past-hour exclusion, and hold/pending-as-
  occupant.
- **Race (`test/booking-race.test.ts`)** — two concurrent `createPendingBooking`
  calls for the same slot → exactly one succeeds, one PENDING row; and an
  overlapping/buffer slot is rejected while the next free slot is allowed.
- **E2E** — booking through the diary created a real PENDING row
  (`S1-…`, 07:00–08:00, £45), the studio alert was dispatched (logged without a
  key), and `GET /api/availability` then showed the slot as occupied.

(Local test bookings were cleared afterwards.)

---

## Open questions / known limitations

1. **R2:** set the five `R2_*` vars to switch image storage to R2 (implemented).
2. **Resend:** owner sets `RESEND_API_KEY` + verifies the `studioone.room`
   domain (SPF/DKIM/DMARC) for live email; until then alerts are logged.
3. **Diary timezone:** the calendar/date the guest picks uses their browser's
   local day; the server validates it as a London date. Fine for UK users; a
   non-UK browser could be off by one day at midnight (edge case — revisit in
   Phase 6 if needed).
4. **GET /api/availability** returns occupant intervals per day-offset (the
   diary's shape; CLAUDE.md §8 allowed "per-day if cleaner"). The authoritative
   free/buffer/past computation + double-booking guard live server-side in the
   POST path and are unit-tested.
5. **Door code** is emailed on admin **confirm** — built in Phase 5.

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 5 — Booking management + door code.** Admin confirm (→ door-code email),
cancel, resend, blocks, recurring holds, settings (BACS/door code/recipients).

**Gate:** full lifecycle works; door code emailed on confirm; holds/blocks
subtract availability.

Detail (CLAUDE.md §9/§10): build `/admin/bookings` — list + filter by status,
view a booking, **Confirm** (PENDING → CONFIRMED, set `confirmedAt`/`codeSentAt`,
send the guest the door-code email: greeting + confirmed slot + the current
`doorCode` + address/access notes + reply-to support — escape all input, never
expose the code publicly or in the studio alert), **Cancel** (→ CANCELLED, frees
the slot; optional "refund noted" flag), and **resend door-code**. Show a
four-week availability overview. Build `/admin/blocks` (one-off `Block` CRUD) and
`/admin/holds` (weekly `RecurringHold` CRUD) — both already subtract availability
via `lib/booking/service` (occupantsForWindow + the transaction), so adding rows
is the main work. Door code + note + alert recipients are already editable in
`/admin/settings`. Add the guest door-code email template to `lib/email.ts`
(`sendDoorCode`). Confirm/cancel must `revalidatePath('/')` so availability
updates. e2e: confirm a booking → assert the door-code email is dispatched (mock
Resend); cancel frees the slot.
