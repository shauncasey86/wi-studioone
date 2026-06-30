# HANDOFF

> The single source of truth for picking up this project. Always reflects HEAD.
> Read this **and** `git log --oneline -20` before doing anything. Then do
> exactly **one** stage, pass its gate, rewrite this file, commit, tag
> `stage-N-complete`, push, and stop. Full plan + non-negotiables: `CLAUDE.md`.

---

## Status

- **Stages complete:** Phase 0 — Scaffold & repo.
- **Stage just finished:** Phase 0.
- **Stage next:** Phase 1 — Port the static site.

### Full stage plan (from CLAUDE.md §14)

- [x] **Phase 0 — Scaffold & repo**
- [ ] **Phase 1 — Port the static site**
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
npm run db:seed                   # no-op stub until Phase 2
npm run dev                       # http://localhost:3000
```

Health/DB check: `GET /api/health` → `{"status":"ok","database":"connected"}`.

### Deploy (Railway)

One service (Next app, Nixpacks) + the Postgres plugin. `railway.json` already
sets the build, the release migration (`npx prisma migrate deploy`), the start
command, and the `/api/health` health check. Full step-by-step (project,
variables, custom domain, Resend DNS) is in `README.md` → "Deploying to Railway".

### ⚠️ Environment note (Prisma engines behind a proxy)

`prisma generate` downloads native engines from `binaries.prisma.sh`. On Railway
and normal networks this just works. In a restricted sandbox/agent proxy the
download can be reset (`ECONNRESET`). Workaround used to build/verify here:
download the engines once with `curl --cacert /root/.ccr/ca-bundle.crt` and point
Prisma at them via env vars for the session:

```bash
H=$(grep enginesVersion node_modules/@prisma/engines-version/package.json | grep -oE '[a-f0-9]{40}')
T=debian-openssl-3.0.x
curl -sS --cacert /root/.ccr/ca-bundle.crt \
  "https://binaries.prisma.sh/all_commits/$H/$T/libquery_engine.so.node.gz" | gunzip \
  > "node_modules/@prisma/engines/libquery_engine-$T.so.node"
curl -sS --cacert /root/.ccr/ca-bundle.crt \
  "https://binaries.prisma.sh/all_commits/$H/$T/schema-engine.gz" | gunzip \
  > "node_modules/@prisma/engines/schema-engine-$T" && chmod +x "node_modules/@prisma/engines/schema-engine-$T"
export NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
export PRISMA_QUERY_ENGINE_LIBRARY="$PWD/node_modules/@prisma/engines/libquery_engine-$T.so.node"
export PRISMA_SCHEMA_ENGINE_BINARY="$PWD/node_modules/@prisma/engines/schema-engine-$T"
```

Do **not** commit these workaround env vars — they are sandbox-only.

---

## Last stage — Phase 0 (what was built)

A blank but deployable Next.js app, wired to Prisma/Postgres.

- **Next.js 16 (App Router) + TypeScript + React 19**, scaffolded via
  `create-next-app` and merged into the repo root (kept `CLAUDE.md` and
  `legacy/studioone.html`). No Tailwind — hand-written CSS only.
- **Prisma + Postgres**: `prisma/schema.prisma` holds one placeholder model
  (`HealthCheck`) so migrations run and the connection is provable. The real
  §5 data model lands in Phase 2. `lib/prisma.ts` exports a singleton client.
  Initial migration committed at `prisma/migrations/20260630101104_init/`.
- **Health probe**: `app/api/health/route.ts` runs `SELECT 1` and reports DB
  connectivity (used by Railway's health check and the gate).
- **Tooling**: ESLint (+ `eslint-config-prettier`) and Prettier configured;
  `npm run lint` and `npm run format:check` both pass.
- **Deploy config**: `railway.json` (Nixpacks, release migration, health check)
  and `README.md` Railway/Resend instructions. `.env.example` lists every var
  from CLAUDE.md §15; `.env*` is git-ignored (no secrets committed).
- **Holding page**: `app/page.tsx`/`layout.tsx` are minimal placeholders — the
  real site is ported in Phase 1.

Key files: `package.json` (scripts), `railway.json`, `prisma/schema.prisma`,
`lib/prisma.ts`, `app/api/health/route.ts`, `.env.example`, `README.md`.

---

## Verify (Phase 0 gate)

Proven on this machine (against a local Postgres):

```bash
npm run lint           # ✓ passes
npm run format:check   # ✓ passes
npm run build          # ✓ green (prisma generate + next build) — see engine note above
# with DATABASE_URL set + migrations applied:
npm run start &        # then:
curl localhost:3000/api/health   # → {"status":"ok","database":"connected"}
curl -o /dev/null -w '%{http_code}' localhost:3000/   # → 200
```

---

## Open questions (need owner decision/action)

1. **Railway provisioning is an owner action.** This session cannot reach the
   owner's Railway account, so the project/Postgres were not created from here.
   The repo is deploy-ready (Nixpacks + `railway.json` + README steps);
   connection to Postgres is proven locally. **Owner: create the Railway service
   + Postgres plugin, set variables, and confirm the deploy + `/api/health` are
   green on Railway.** This is the only outstanding piece of the Phase 0 gate.
   - Deploy notes from the first attempts: Railway must build a branch that has
     the app (the merged `main`, not the pre-scaffold `main`). Node is pinned to
     22 via `.nvmrc` + `package.json` `engines` because Nixpacks otherwise
     defaults to Node 18, which is too old for Next.js 16 (needs >=20.9.0). The
     start command runs `prisma migrate deploy`, so `DATABASE_URL` (Postgres
     plugin) MUST be set or the deploy fails at migrate/health-check.
2. **Admin session lib:** CLAUDE.md says pick `iron-session` or Auth.js and
   justify. Default plan: `iron-session` (simplest for a single owner; no OAuth
   providers needed). Confirm or override in Phase 3.
3. **Image storage:** Cloudflare R2 vs Railway persistent volume (CLAUDE.md
   §3). Decide before Phase 3 (image upload).
4. **Door-code model:** single rotating code is the decided scope (CLAUDE.md §2);
   per-guest codes remain out of scope.

---

## Next stage — verbatim (copy-paste as the next session's brief)

**Phase 1 — Port the static site.** Move CSS into `globals.css`, wire fonts,
port every section with hardcoded content, port `<SiteEffects/>`
(Lenis/GSAP/cursor/arc/status) and `<BookingDiary/>` against a mock availability
source.

**Gate:** visual + behaviour parity with `legacy/studioone.html`.

Porting detail lives in CLAUDE.md §7 (porting plan) and §8/§9 (booking engine &
flow the diary must eventually match — Phase 1 uses a mock source, real API is
Phase 4). Parity gate specifics: screenshot the current `legacy/studioone.html`
and the new site at 1440px and 390px for hero, §02, §03, §05 (empty +
day-picked + slot-chosen + pending), §06, footer — they must match. Remember:
port the design, do not redesign it; keep the hand-written CSS; bundle
GSAP/Lenis from npm (drop the CDN `<script>` tags).
