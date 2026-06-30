# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0 (Scaffold), Phase 1 (Static port), Phase 2
  (Content model + seed), Phase 3 (Admin + CMS).
- **Stage just finished:** Phase 3.
- **Stage next:** Phase 4 — Bookings backend.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [x] **Phase 1 — Port the static site**
- [x] **Phase 2 — Content model + seed**
- [x] **Phase 3 — Admin + CMS**
- [ ] **Phase 4 — Bookings backend**
- [ ] **Phase 5 — Booking management + door code**
- [ ] **Phase 6 — Harden + ship**

---

## Run & deploy

### Local

```bash
npm install
cp .env.example .env     # set DATABASE_URL, SESSION_SECRET (>=32 chars),
                         # ADMIN_EMAIL, ADMIN_PASSWORD
npm run prisma:migrate
npm run db:seed          # seeds content (if empty) + the admin user from env
npm run dev              # site at /, admin at /admin
```

Admin: sign in at `/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Uploaded
images go to `UPLOAD_DIR` (default `./uploads`, git-ignored) and are served by
`/api/media/...`.

### Deploy (Railway) — LIVE ✅

Merge the working branch into **`main`**; Railway builds with Nixpacks and the
release runs `prisma migrate deploy && npm run db:seed && npm run start`. The
seed is **seed-if-empty** for content (never clobbers admin edits;
`SEED_FORCE=1` to reset) and **upserts the admin user** from `ADMIN_EMAIL`/
`ADMIN_PASSWORD` every release.

**Set these Railway service variables for Phase 3:**

- `SESSION_SECRET` — `openssl rand -base64 32` (admin cookie signing; required).
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — the owner login (password is hashed at seed
  time; you can remove `ADMIN_PASSWORD` after first deploy — the hash persists).
- `UPLOAD_DIR` — point at a **mounted Railway volume** (e.g. `/data/uploads`) so
  uploaded images survive deploys. Without a volume, uploads are ephemeral.

Earlier essentials still apply (Node 22 via `.nvmrc`+engines; `DATABASE_URL`
must reference the Postgres plugin).

### ⚠️ Environment note (Prisma engines behind a proxy)

`prisma generate`/`migrate` download native engines from `binaries.prisma.sh`;
fine on Railway, reset-prone in the sandbox. Workaround: fetch engines with
`curl --cacert /root/.ccr/ca-bundle.crt` (hash from
`node_modules/@prisma/engines-version/package.json`, target
`debian-openssl-3.0.x`) and set `PRISMA_QUERY_ENGINE_LIBRARY` /
`PRISMA_SCHEMA_ENGINE_BINARY` + `NODE_EXTRA_CA_CERTS`. Set `DATABASE_URL` for
`next build`. `.env` (git-ignored) already wires the local values.

---

## Last stage — Phase 3 (what was built)

A password-protected admin CMS at `/admin` where every §6 section is editable
and changes show live.

- **Auth** — single owner via `iron-session` (signed, HTTP-only, same-site
  cookie). `lib/session-config.ts` (edge-safe options) + `lib/session.ts`
  (`getSession`/`requireAdmin`). `lib/auth.ts` does bcrypt verify + an in-memory
  login rate limiter (generic errors). `middleware.ts` redirects unauthenticated
  `/admin/*` to `/admin/login`; `requireAdmin()` is called in every admin page +
  every mutation (the real boundary). Admin user seeded from env (bcrypt).
- **Editors** (`app/admin/(panel)/*`, gated layout + nav):
  - **Content** (`/admin/content`) — every scalar field in §6, driven by
    `lib/admin/content-fields.ts`; rich fields use a live-preview textarea
    (`components/admin/RichField.tsx`), OG image via upload
    (`components/admin/ImageField.tsx`). Saves through the zod content schema.
  - **Lists** (`/admin/lists`) — generic add / edit / delete / reorder (↑/↓) for
    all repeatable tables (`lib/admin/lists-config.ts`), incl. footer-column
    links as `label | href` lines.
  - **Pricing & rules** (`/admin/pricing`) — the 8 rate tiers + operational
    settings (open/close, min/max, reset, days-ahead, pending TTL).
  - **Settings** (`/admin/settings`) — BACS, door code + note, alert recipients,
    from-email, contact, map pin.
- **Server actions** (`lib/admin/actions.ts`, all `requireAdmin()`-gated): login,
  logout, saveContent, saveSettings, savePricing, list CRUD, uploadMedia. Every
  mutation `revalidatePath("/")` so the public site updates immediately.
- **Image storage** (`lib/storage.ts` + `app/api/media/[...key]/route.ts`) — a
  filesystem/volume backend (the CLAUDE.md §3 fallback), no external creds, with
  path-traversal guards and a `MediaAsset` row per upload. R2 is the recommended
  production backend and slots in behind the same `save()` interface.

New deps: `iron-session`, `bcryptjs` (+ `@types/bcryptjs`).

---

## Verify (Phase 3 gate) — ✅ PASSED

`npm run lint`, `npm run format:check`, `npm run build` all pass. Driven with
the headless browser against a local seeded DB:

- **Auth gate:** `GET /admin` → 307 redirect to `/admin/login`. Login with the
  seeded owner → `/admin`.
- **Content edit is live:** changed `hero.sub` in `/admin/content`, saved → the
  new text appears on `/` immediately.
- **Pricing edit is live:** set 1-hour rate to £99 → `/` rates strip shows
  `1h <b>£99</b>`.
- **List CRUD is live:** added + filled a hero-eyebrow item → it appears on `/`.
  (Reorder uses ↑/↓ move actions; delete + add covered by the same generic CRUD.)
- **Image upload works:** uploaded a PNG in the OG-image field → stored, URL set,
  and served by `/api/media/...` (200, `image/png`).

To re-verify: `db:seed`, `start`, sign in at `/admin`, edit any section, refresh
`/`. (Local test edits were reset with `SEED_FORCE=1 npm run db:seed`.)

---

## Open questions (need owner decision/action)

1. **Image storage backend:** the filesystem/volume backend is active and works.
   For production durability, either mount a Railway volume at `UPLOAD_DIR` or
   provide R2 creds (then wire the R2 backend behind `lib/storage`). Decide
   before launch (CLAUDE.md §3).
2. **OG image:** still the legacy Unsplash URL in `content.meta.ogImage` —
   replace via `/admin/content` with a real StudioONE image.
3. **Door-code model:** single rotating code is the decided scope (CLAUDE.md §2).

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 4 — Bookings backend.** Server-side availability (§8), POST
`/api/bookings`, BACS pending flow, Resend studio alert; wire `<BookingDiary/>`
to the real API.

**Gate:** a real booking creates a PENDING row, emails the studio, and prevents
double-booking (test proven).

Detail (CLAUDE.md §8/§9): compute availability **server-side in Europe/London**
from CONFIRMED + PENDING (until `pendingTtlHrs`) bookings, one-off `Block`s, and
`RecurringHold`s projected onto each date, applying the `resetHours` buffer each
side, `minHours`/`maxHours`, whole hours, past-hour exclusion, and the
`daysAhead` window — using the operational settings + `RateTier`s already in the
DB. `GET /api/availability` returns `{ [isoDate]: { [hour]: "free"|"booked"|
"buffer"|"past" } }`. `POST /api/bookings` (zod-validated, rate-limited +
honeypot) re-checks availability inside a DB transaction, creates a PENDING
booking with a `{referencePrefix}-XXXXXX` reference, returns BACS details +
reference + amount, and emails the studio via Resend (door code never included).
Add a lazy/`pendingTtlHrs` expiry that frees slots. Then replace the mock bodies
in `lib/availability.ts` (`fetchAvailability`/`createBooking`) with calls to the
real endpoints — `<BookingDiary/>` itself shouldn't need to change. Unit-test the
availability rules + the double-booking transaction race (Vitest, §13).
