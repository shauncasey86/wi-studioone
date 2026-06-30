# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0 (Scaffold & repo), Phase 1 (Port the static site).
- **Stage just finished:** Phase 1.
- **Stage next:** Phase 2 — Content model + seed.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [x] **Phase 1 — Port the static site**
- [ ] **Phase 2 — Content model + seed**
- [ ] **Phase 3 — Admin + CMS**
- [ ] **Phase 4 — Bookings backend**
- [ ] **Phase 5 — Booking management + door code**
- [ ] **Phase 6 — Harden + ship**

---

## Run & deploy

### Local

```bash
npm install                       # installs deps; postinstall runs `prisma generate`
cp .env.example .env              # set DATABASE_URL (+ others as phases need them)
npm run prisma:migrate            # apply migrations to your dev Postgres
npm run dev                       # http://localhost:3000
```

The public site renders without a database in Phase 1 (content is still
hardcoded). `GET /api/health` needs `DATABASE_URL` and returns
`{"status":"ok","database":"connected"}`.

### Deploy (Railway) — LIVE ✅

Service `wi-studioone` + Postgres plugin are provisioned and the deploy is green
at https://wi-studioone.up.railway.app. Railway builds **`main`** with Nixpacks;
each stage's branch must be merged to `main` to ship (the established flow:
develop on the stage branch → PR → merge to `main` → Railway redeploys).
Deploy essentials, learned in Phase 0 (keep in mind):

- Node is pinned to 22 via `.nvmrc` + `package.json` `engines` (Nixpacks would
  otherwise default to Node 18, too old for Next.js 16).
- `DATABASE_URL` on the service MUST be a reference to the Postgres plugin
  (`${{Postgres.DATABASE_URL}}`), not a hand-typed/example string — the start
  command runs `prisma migrate deploy`.

Full Railway/Resend/DNS steps: `README.md`.

### ⚠️ Environment note (Prisma engines behind a proxy)

`prisma generate` downloads native engines from `binaries.prisma.sh`. On Railway
and normal networks this just works. In a restricted sandbox/agent proxy the
download can be reset (`ECONNRESET`); fetch them once with
`curl --cacert /root/.ccr/ca-bundle.crt` and point Prisma at them via
`PRISMA_QUERY_ENGINE_LIBRARY` / `PRISMA_SCHEMA_ENGINE_BINARY` + the engine hash
from `node_modules/@prisma/engines-version/package.json` (target
`debian-openssl-3.0.x`). Sandbox-only — never commit those env vars.

---

## Last stage — Phase 1 (what was built)

The full site ported from `legacy/studioone.html`, pixel- and behaviour-faithful,
with hardcoded content (Phase 2 makes it DB-driven).

- **`app/globals.css`** — the legacy `<style>` block ported **verbatim** (only
  `--serif`/`--mono` rewired to the next/font variables). Kept out of Prettier
  (`.prettierignore`) to stay byte-faithful. No utility framework.
- **`app/layout.tsx`** — `next/font` for **Fraunces** (variable: `opsz`, `SOFT`,
  `WONK` axes + italic) and **Space Mono** (400/700 + italic), exposed as CSS
  vars. Full `<head>` metadata ported (title/description/canonical/OG/Twitter,
  theme-color, inline SVG favicon/apple/mask icons).
- **`app/page.tsx`** — every section as static server-rendered markup: topbar,
  hero (+ day-arc SVG skeleton), §01 manifesto, §02 five kinds, §03 statement
  band, §04 how, §05 diary header, §06 practical (room facts, changeover docket,
  rates, policies, OSM map), CTA, footer. Plus the cursor nodes.
- **`components/SiteEffects.tsx`** (client) — ports Lenis smooth scroll, topbar
  pin, the custom cursor, the hero day-arc (`buildArc`), the live status clock,
  the changeover reset stamp, and the GSAP/ScrollTrigger reveals (hero timeline,
  manifesto word reveal, chapter chrome, step + footer drift). GSAP + Lenis are
  **bundled from npm** (gsap 3.12.5, lenis 1.3.23) — CDN `<script>` tags dropped.
  `prefers-reduced-motion` honoured; teardown via AbortController + tracked rAF.
- **`components/BookingDiary.tsx`** (client) — faithful port of the calendar
  logic: four-week radiogroup with roving tabindex, part-of-day start grouping,
  length presets + hourly stepper, summary/price, the BACS payment step, and the
  pending panel. Same ARIA (`aria-checked`/`aria-pressed`), live region, and
  focus management as the original. Date-dependent building runs after mount, so
  there's no SSR/timezone hydration drift.
- **`lib/availability.ts`** — the mock service layer (`fetchAvailability` /
  `createBooking`) shared by the diary and the arc. Phase 4 swaps the bodies for
  the real API; the UI doesn't change.

---

## Verify (Phase 1 gate) — ✅ PASSED

`npm run lint`, `npm run format:check`, and `npm run build` all pass. Behaviour +
visual parity was verified with the preinstalled Chromium (Playwright):

- **Full-page screenshots at 1440px and 390px** (reduced-motion so every reveal
  is shown) — hero, §01–§04, the diary, §06, CTA, footer all render faithfully
  in the umber/oat/marigold palette with Fraunces/Space Mono.
- **Diary walk-through** confirmed the engine rules from `legacy`: today
  auto-selected; past hours excluded (no 07:00–11:00 on today); the 14:00–16:00
  booking + 1h reset buffer correctly removed 13:00 (the `+` stepper capped at
  1h there); presets/stepper price correctly (17:00–19:00 · 2h · £80); Continue
  → payment generates a BACS reference (`S1-…`); valid name+email enables the pay
  button; flagging payment renders the "Awaiting payment" pending panel and
  announces it in the live region.

To re-verify: `npm run build` then `npm run start`, open the site, and exercise
the diary. (A pixel diff *against* `legacy/studioone.html` can't run in the
sandbox because the legacy file's CDN deps — unpkg/cdnjs/Google Fonts — are
blocked by the egress proxy; the new site bundles them, so compare against the
legacy file on a normal network if a strict diff is wanted. The OSM map iframe is
also blocked in-sandbox and shows a dark frame; it loads on the real deploy.)

---

## Open questions (need owner decision/action)

1. **Admin session lib:** CLAUDE.md says pick `iron-session` or Auth.js and
   justify. Default plan: `iron-session` (simplest for a single owner; no OAuth
   needed). Confirm or override in Phase 3.
2. **Image storage:** Cloudflare R2 vs Railway persistent volume (CLAUDE.md §3).
   Decide before Phase 3 (image upload).
3. **OG image:** still the legacy Unsplash URL; replace with a real StudioONE OG
   image (becomes editable in Phase 3).
4. **Door-code model:** single rotating code is the decided scope (CLAUDE.md §2);
   per-guest codes remain out of scope.

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 2 — Content model + seed.** Prisma schema (§5), zod content schema (§6),
seed from current copy, render sections from the DB.

**Gate:** site renders identically from the database.

Detail: build the full data model from CLAUDE.md §5 (replace the Phase-0
`HealthCheck` placeholder) — `SiteSettings` (typed JSON `content` validated by a
zod schema covering §6, plus the operational/BACS/door-code/contact/map fields)
and the reorderable list tables (`Kind`, `HowStep`, `Policy`, `RoomFact`,
`ChangeoverItem`, `NavItem`, `FooterColumn`, `HeroEyebrow`, `ManifestoFoot`,
`RateTier`, `MediaAsset`), plus `Booking`/`Block`/`RecurringHold`/`AdminUser`
(tables can land now; their behaviour is wired in Phases 4–5). Write the
idempotent seed (`prisma/seed.ts`) that loads today's exact copy from
`legacy/studioone.html` / current `app/page.tsx`. Convert the Phase-1 static
sections into server components that read `SiteSettings` + their list tables, and
render rich fields through the safe `*italic*` / `**bold**` parser (§5 markup
convention: escape HTML first, then convert only those two markers). After this,
a fresh DB seed must render byte-for-byte what Phase 1 renders today.
