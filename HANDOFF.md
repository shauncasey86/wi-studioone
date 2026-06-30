# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0 (Scaffold), Phase 1 (Static port), Phase 2
  (Content model + seed).
- **Stage just finished:** Phase 2.
- **Stage next:** Phase 3 — Admin + CMS.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [x] **Phase 1 — Port the static site**
- [x] **Phase 2 — Content model + seed**
- [ ] **Phase 3 — Admin + CMS**
- [ ] **Phase 4 — Bookings backend**
- [ ] **Phase 5 — Booking management + door code**
- [ ] **Phase 6 — Harden + ship**

---

## Run & deploy

### Local

```bash
npm install                       # postinstall runs `prisma generate`
cp .env.example .env              # set DATABASE_URL
npm run prisma:migrate            # apply migrations (init + content_model)
npm run db:seed                   # load today's copy into the DB (idempotent)
npm run dev                       # http://localhost:3000
```

The site now renders **from the database** — without a seeded `SiteSettings`
row the page errors (it `findUniqueOrThrow`s), so `db:seed` is required before
the site renders. `GET /api/health` returns `{"status":"ok","database":"connected"}`.

### Deploy (Railway) — LIVE ✅ (needs a one-time seed for Phase 2)

Service `wi-studioone` + Postgres are live; Railway builds **`main`** with
Nixpacks. **Merge this branch into `main`** to ship. The release command runs
`prisma migrate deploy` (applies the new `content_model` migration) but **does
NOT seed** — seeding every release would clobber admin edits once Phase 3 lands.
So after the Phase 2 deploy, **run the seed once** against the Railway DB, e.g.:

```bash
railway run npm run db:seed         # or a Railway one-off command / shell
```

Until that runs, the deployed page will 500 (health stays green). Deploy
essentials from earlier phases still apply (Node pinned to 22 via `.nvmrc` +
engines; `DATABASE_URL` must reference the Postgres plugin).

### ⚠️ Environment note (Prisma engines behind a proxy)

`prisma generate`/`migrate` download native engines from `binaries.prisma.sh`.
On Railway/normal networks this just works; in the restricted sandbox the
download resets (`ECONNRESET`). Fetch them once with
`curl --cacert /root/.ccr/ca-bundle.crt` (engine hash from
`node_modules/@prisma/engines-version/package.json`, target
`debian-openssl-3.0.x`) and point Prisma at them via `PRISMA_QUERY_ENGINE_LIBRARY`
/ `PRISMA_SCHEMA_ENGINE_BINARY` + `NODE_EXTRA_CA_CERTS`. Also set `DATABASE_URL`
for `next build` (a local Postgres is fine). Sandbox-only — never commit these.

---

## Last stage — Phase 2 (what was built)

The public site is now rendered from Postgres; the Phase-1 hardcoded copy lives
in the database.

- **`prisma/schema.prisma`** — the full §5 model replaces the `HealthCheck`
  placeholder: `SiteSettings` (JSON `content` + operational settings + `bacs`/
  `contact`/`map` JSON + door code/emails), the reorderable list tables (`Kind`,
  `HowStep`, `Policy`, `RoomFact`, `ChangeoverItem`, `NavItem`, `FooterColumn`,
  `HeroEyebrow`, `ManifestoFoot`, `RateTier`, `MediaAsset`), and
  `Booking`/`Block`/`RecurringHold`/`AdminUser` (tables only; behaviour in
  Phases 4–5). Migration: `prisma/migrations/20260630112755_content_model/`.
  (`NavItem` has an extra `cur` field for the cursor label — §5 is a sketch.)
- **`lib/content.ts`** — zod schemas (§6) for the `content` JSON + `bacs`/
  `contact`/`map`, `.strict()` (rejects unknown fields), with inferred TS types.
- **`lib/richtext.tsx`** — the safe rich-text renderer for the `*italic*` /
  `**bold**` convention, plus `[label](href)` links (needed by the rates note).
  Escaping is by construction (React escapes string children); link hrefs are
  scheme-checked.
- **`lib/site-data.ts`** — `getSiteData()` (React `cache()`d): one round-trip
  for the settings singleton (JSON columns zod-validated) + every list, ordered.
- **`components/sections/*`** — each section is now an async server component
  reading `getSiteData()` and rendering rich fields via `rich()`: `Topbar`,
  `Hero`, `Manifesto`, `Days`, `RoomStatement`, `How`, `DiarySection`,
  `Practical`, `CtaStrip`, `Footer`. `app/page.tsx` composes them and is
  `force-dynamic` (renders from the DB at request, not at build).
- **`app/layout.tsx`** — `generateMetadata`/`generateViewport` now read
  `content.meta` from the DB (with a static fallback so `next build` is safe
  without a DB). Fonts unchanged.
- **`prisma/seed.ts`** — idempotent seed loading today's exact copy (re-running
  replaces the content singleton + all list rows; never touches bookings).
- `<BookingDiary/>` is unchanged (still client + mock service); Phase 4 wires it
  to the real API. Its BACS panel is still hardcoded — it reads
  `SiteSettings.bacs` once the booking API exists.

---

## Verify (Phase 2 gate) — ✅ PASSED

`npm run lint`, `npm run format:check`, `npm run build` all pass (build with
`DATABASE_URL` set, as on Railway). Against a local seeded Postgres:

- **Renders identically from the DB** — a full-page screenshot at 1440px matches
  the Phase-1 render exactly (same 1440×7504 layout, palette, type, diary).
- **HTML spot-checks** confirm faithful markup: hero `the <em>hour.</em>`, the
  manifesto word spans incl. `<span class="w"><em>sit ten for dinner.</em></span>`,
  `Bare. Daylit. <em>Looked after.</em>`, policy `<strong>24 hours</strong>`,
  room-fact spacing (`<b>~40 m²</b> ground floor` with a real nbsp vs
  `<b>Kettle</b>, fridge, sink` with none), rate tiers `<li>1h <b>£45</b></li>`,
  the rates-note `[Message the studio](mailto:…)` link, nav `data-cur`, and the
  `Open · 07:00–22:00` status line.
- **Seed is idempotent** (counts stable on re-run) and **/api/health** is green.

To re-verify: `prisma:migrate`, `db:seed`, `build`, `start`, open the site.

---

## Open questions (need owner decision/action)

1. **Railway one-time seed (Phase 2):** after merging, run `npm run db:seed`
   once against the Railway DB (see Run & deploy). The release does not auto-seed.
2. **Admin session lib (Phase 3):** plan is `iron-session` (simplest single
   owner; no OAuth). Confirm or override.
3. **Image storage (Phase 3):** Cloudflare R2 vs Railway volume (CLAUDE.md §3).
4. **OG image:** still the legacy Unsplash URL (in `content.meta.ogImage`);
   replace with a real StudioONE image (editable in Phase 3).
5. **Door-code model:** single rotating code is the decided scope (CLAUDE.md §2).

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 3 — Admin + CMS.** Auth, content editors for every section incl.
add/remove/reorder, image upload, map pin, pricing/rules.

**Gate:** every section in §6 is editable and changes show live.

Detail (CLAUDE.md §10): build `/admin`, gated by middleware. Login page →
bcrypt-check against the single `AdminUser` → signed HTTP-only same-site session
cookie (iron-session unless overridden); logout; rate-limit login. Seed the
`AdminUser` from `ADMIN_EMAIL`/`ADMIN_PASSWORD` (bcrypt hash; password used at
seed-time only). A content editor with a form per §6 section: scalar fields write
through the zod `content` schema; the list tables support add / remove /
drag-to-reorder (persist `order`); rich fields use the `*italic*`/`**bold**`
convention with a live preview; image upload (OG/favicon/section images) to the
object store → `MediaAsset`. Map-pin editor (lat/lng/zoom/tag/coords/openMapsUrl
→ the OSM embed). Pricing & rules editor (RateTier prices + operational
settings). Saving must revalidate the public route so changes show live
(the page is `force-dynamic`, so a fresh request already reflects DB writes;
still call `revalidatePath('/')` where caching is added). Validate every input
with zod; gate every admin route + mutation; CSRF + same-site cookies.
