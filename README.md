# StudioONE

One studio in Hull, booked by the hour — a Next.js port of `legacy/studioone.html`
with a password-protected admin CMS and a manual BACS bank-transfer booking flow,
deployed to Railway with managed Postgres.

The visual + behavioural source of truth is **`legacy/studioone.html`** — the
public site is a faithful port of it, now rendered from the database. `CLAUDE.md`
holds the full plan; `HANDOFF.md` always reflects the current state.

## Tech stack

- **Next.js 16** (App Router, TypeScript) + React 19 — hand-written CSS, no
  utility framework
- **Postgres** + **Prisma** (schema + migrations)
- **iron-session** + bcrypt (single-owner admin), **zod** (validation)
- **Resend** (transactional email), **Cloudflare R2** or a volume (images)
- **GSAP + Lenis** bundled from npm; fonts via `next/font`
- ESLint + Prettier; **Vitest** (availability rules + double-booking race)

## Local setup

Requires Node 20+ and Postgres.

```bash
npm install
cp .env.example .env        # set DATABASE_URL, SESSION_SECRET (>=32 chars),
                            # ADMIN_EMAIL, ADMIN_PASSWORD
npm run prisma:migrate      # apply migrations
npm run db:seed             # seed content (if empty) + the admin user
npm run dev                 # site http://localhost:3000 · admin /admin
npm test                    # vitest
```

`GET /api/health` → `{"status":"ok","database":"connected"}`.

## Scripts

| Script                    | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `npm run dev`             | Dev server                                 |
| `npm run build`           | `prisma generate` + `next build`           |
| `npm run start`           | Production server                          |
| `npm run lint` / `format` | ESLint / Prettier                          |
| `npm run prisma:migrate`  | Create/apply a dev migration               |
| `npm run db:seed`         | Seed (idempotent; `SEED_FORCE=1` to reset) |
| `npm test`                | Vitest unit + integration tests            |

## Admin

Sign in at **`/admin`** with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. From there you can:

- **Content / Lists / Pricing / Settings** — edit every section, add/remove/
  reorder lists, set rate tiers + rules, BACS, door code, map, contact, emails.
- **Bookings** — confirm a paid booking (emails the guest their door code),
  cancel (frees the slot), resend the code; four-week overview.
- **Blocks / Holds** — one-off blocks and weekly recurring holds; both subtract
  from availability.
- **Testing mode** (dashboard) — turn on to trial every feature end to end; a
  banner shows on the public site. Turning it off **restores the content and
  deletes any bookings made during the test** (snapshot-on-enter, restore-on-
  exit). Emails still send while testing so you can verify them.

## Booking flow (BACS)

Guest picks day → start → length, enters name + email, and reserves. The server
re-checks availability in a Serializable transaction, creates a PENDING booking
with a `{prefix}-XXXXXX` reference, shows the BACS details + reference, and emails
the studio (never the door code). The owner verifies the transfer and clicks
**Confirm**, which emails the guest the current door code. All availability logic
runs in Europe/London (timestamps stored UTC).

## Deploying to Railway

One service (the Next app, Nixpacks) + the Postgres plugin. `railway.json` runs
`prisma migrate deploy && npm run db:seed && npm run start` on release (the seed
is seed-if-empty for content and upserts the admin user), and health-checks
`/api/health`.

**Service variables:**

- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `SESSION_SECRET` = `openssl rand -base64 32`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` (drop `ADMIN_PASSWORD` after first deploy; the
  hash persists)
- `NEXT_PUBLIC_SITE_URL` — your Railway URL for now (e.g.
  `https://wi-studioone.up.railway.app`); swap for a custom domain when you add
  one (Railway → Settings → Networking → add domain + the CNAME it gives you).
- `TZ=Europe/London`
- **Email:** `RESEND_API_KEY`, `EMAIL_FROM`, `STUDIO_ALERT_EMAILS`. All
  swappable any time. `EMAIL_FROM` must be a verified sender on whichever Resend
  account the key belongs to (borrowing a test account from another project is
  fine — use that account's verified domain, or `onboarding@resend.dev` for quick
  tests). Without a key, emails are logged, not sent.
- **Images:** the five `R2_*` vars (Cloudflare R2 — recommended), **or** mount a
  volume at `UPLOAD_DIR` for the filesystem fallback.

### Resend domain (when you have a real sending domain)

Add the domain in Resend, add the SPF/DKIM/DMARC records it gives you to your DNS
host, verify, then set `EMAIL_FROM` to an address on that domain.

## Security

zod-validated inputs (unknown fields rejected); every `/admin` route + mutation
gated by middleware and `requireAdmin`; HTTP-only/secure/same-site session
cookie; bcrypt + rate-limited login; rate-limit + honeypot on `POST /api/bookings`;
door code never exposed publicly or in the studio alert; all user input escaped in
HTML/email; security headers + CSP set in `next.config.ts`.

## Notes for the sandbox

Prisma downloads native engines from `binaries.prisma.sh`; behind the agent proxy
this can reset. Fetch them with `curl --cacert /root/.ccr/ca-bundle.crt` and set
`PRISMA_QUERY_ENGINE_LIBRARY` + `NODE_EXTRA_CA_CERTS` + `DATABASE_URL` for
build/test/seed. On Railway/normal networks it just works.
