# StudioONE

One studio in Hull, booked by the hour — a Next.js port of `legacy/studioone.html`
with a password-protected admin CMS and a manual BACS bank-transfer booking flow,
deployed to Railway with managed Postgres.

This repository is built in numbered phases. See **`HANDOFF.md`** for current
status and the next phase to pick up. The full plan and non-negotiables live in
**`CLAUDE.md`**. The visual + behavioural source of truth is
**`legacy/studioone.html`** — port it, do not redesign it.

## Tech stack

- **Next.js** (App Router, TypeScript) + React 19
- **Postgres** (Railway managed) + **Prisma** (schema + migrations)
- **ESLint + Prettier** (no CSS-in-JS, no utility framework — hand-written CSS)
- Resend (email), iron-session (admin auth), zod (validation), GSAP + Lenis
  (motion) — wired in later phases.

## Local setup

Requires Node 20+ and a Postgres database.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    then edit .env — at minimum set DATABASE_URL to your local/remote Postgres.

# 3. Generate the Prisma client and apply migrations
npm run prisma:generate
npm run prisma:migrate        # creates/updates your dev database

# 4. Seed today's site copy into the database (real seed lands in Phase 2)
npm run db:seed

# 5. Run the dev server
npm run dev                   # http://localhost:3000
```

Verify the database connection at `http://localhost:3000/api/health` — it
returns `{ "status": "ok", "database": "connected" }`.

## Scripts

| Script                   | Purpose                                           |
| ------------------------ | ------------------------------------------------- |
| `npm run dev`            | Start the dev server                              |
| `npm run build`          | `prisma generate` + `next build`                  |
| `npm run start`          | Start the production server                       |
| `npm run lint`           | ESLint                                            |
| `npm run format`         | Prettier write                                    |
| `npm run format:check`   | Prettier check (CI-friendly)                      |
| `npm run prisma:migrate` | Create/apply a dev migration                      |
| `npm run prisma:deploy`  | Apply migrations in production (`migrate deploy`) |
| `npm run db:seed`        | Seed the database                                 |

## Deploying to Railway

The app deploys as **one Railway service** (the Next app) plus the **Postgres
plugin**. Build uses Nixpacks; `railway.json` wires the release migration and a
health check.

1. **Create the project & database**
   - In Railway, create a new project → **Deploy from GitHub repo** → select
     this repo and the deploy branch.
   - Add the **Postgres** plugin to the project. Railway exposes its connection
     string as `DATABASE_URL`.

2. **Set service variables** (Railway → service → Variables) — mirror
   `.env.example`:
   - `DATABASE_URL` — reference the Postgres plugin's variable
     (`${{Postgres.DATABASE_URL}}`).
   - `SESSION_SECRET` — `openssl rand -base64 32`.
   - `NEXT_PUBLIC_SITE_URL` — your public URL.
   - `TZ=Europe/London`.
   - Resend / R2 / admin variables are added in later phases.

3. **Build & start** — `railway.json` already sets:
   - Builder: Nixpacks (runs `npm run build`).
   - Start: `npx prisma migrate deploy && npm run start` — migrations run on
     every release, then the server starts.
   - Health check: `/api/health` (fails the deploy if Postgres is unreachable).

4. **Custom domain** — Railway → service → Settings → Networking → add
   `studioone.room` (or chosen domain) and create the CNAME at your DNS host as
   instructed by Railway. Set `NEXT_PUBLIC_SITE_URL` to match.

5. **Resend DNS** (email; configured in Phase 4) — add the Resend domain
   (`studioone.room`), then add the SPF, DKIM, and DMARC records Resend
   provides to your DNS host and verify. Set `RESEND_API_KEY`, `EMAIL_FROM`,
   and `STUDIO_ALERT_EMAILS`.

## Notes for this environment

Prisma downloads its native query/schema engines from `binaries.prisma.sh`
during `prisma generate`. Behind the restrictive sandbox proxy in CI/agent
environments this download can be reset; on Railway and normal networks it
works without intervention.
