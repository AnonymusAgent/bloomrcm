# Bloom RCM — Website & Admin Console

A complete, production-oriented website for an independent medical billing and Revenue Cycle Management (RCM) business serving US healthcare providers.

The project ships two halves:

1. **Public website** — homepage, services (with per-service detail pages), about, a dedicated *Professional Experience* page, a functional consultation/contact form, FAQs, and draft legal/trust pages. Includes a genuine light/dark theme system and a fully functional accessibility toolbar.
2. **Secure admin console** (`/admin`) — authenticated dashboard with real metrics, inquiry & lead management (pipeline statuses, notes, tasks, assignment, archive, CSV export), content management (services, experience records, FAQs, homepage/about copy), and business settings (rebranding without touching code).

Everything placeholder is clearly marked ("Details to be added"). **No fabricated testimonials, metrics, certifications, or endorsements exist anywhere in the project.**

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS 4, CSS-first design tokens, class-based dark mode |
| Database | **Neon** serverless PostgreSQL (project `BloomRCM`) via Drizzle ORM — `@neondatabase/serverless` HTTP driver on Neon hosts, `node-postgres` pool locally |
| Validation | Zod (shared schema between browser form and API) |
| Forms | React Hook Form + `@hookform/resolvers` |
| Auth | Server-verified cookie sessions, scrypt password hashing, DB-backed rate limiting |
| Email | Resend (optional — the site fully works without it) |
| Testing | Vitest (21 unit tests) |

---

## Quick start (local)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env          # then fill in values (see below)

# 3. Create the database schema (requires a running PostgreSQL)
npx drizzle-kit push

# 4. Seed default content (services, FAQs, experience placeholders, settings)
psql "$DATABASE_URL" -f scripts/seed.sql

# 5. Run
npm run dev                  # http://localhost:3000
```

### Quality gates

```bash
npx next typegen             # regenerate route types
npx tsc --noEmit             # type checking
npm run build                # production build
npx vitest run               # unit tests
```

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_SESSION_SECRET` | Strongly recommended | Salts IP hashes + dedupe fingerprints (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical URLs, sitemap, OG metadata, password-reset links |
| `RESEND_API_KEY` | No | Enables transactional email |
| `EMAIL_FROM` | No | `From:` identity for notification/confirmation emails |

> **Email is optional by design.** Without Resend configured, the contact form still validates, spam-checks, and stores inquiries — the inquiry's `emailStatus` is recorded honestly as `not_configured`. Nothing is lost and no false delivery claims are made.

---

## Database

Schema lives in `src/db/schema.ts` and is applied with `npx drizzle-kit push`. Both Drizzle Kit and the app prefer `NEON_DATABASE_URL`, then fall back to `DATABASE_URL`; credentials belong in `.env.local` or the deployment platform's secret manager and are never stored in source. The DB client (`src/db/index.ts`) auto-selects `@neondatabase/serverless` HTTP for `*.neon.tech` URLs and a classic `pg` pool for other PostgreSQL hosts.

Tables: `business_settings` (single-row identity), `site_content` (keyed editable copy), `services`, `experiences`, `faqs`, `inquiries`, `inquiry_notes`, `inquiry_status_history`, `follow_up_tasks`, `admin_users`, `admin_sessions`, `password_reset_tokens`, `rate_limits`, `audit_events`.

**Reset from scratch:**

```bash
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npx drizzle-kit push
psql "$DATABASE_URL" -f scripts/seed.sql
```

---

## Authentication & administrator setup

Admin routes live under `/admin` and are protected **server-side on every render and every action** (`requireAdmin()` / `requireOwner()` in `src/lib/auth.ts`). Sessions are random tokens stored hashed (SHA-256) in `admin_sessions`; cookies are `httpOnly`, `sameSite=lax`, and `secure` in production. Login attempts are rate-limited (8 per 15 min per account, 30 per IP). No passwords or credentials are hardcoded anywhere.

**Create the first administrator — two supported options:**

1. **Web (recommended):** with zero admin users, visit `/admin/login` — it renders a one-time setup form. The moment the first owner account exists, setup permanently closes and the page becomes the normal sign-in.
2. **CLI (also the recovery path):**

```bash
node scripts/create-admin.mjs you@example.com "Your Name"        # prompts for password
node scripts/create-admin.mjs you@example.com                     # resets password, kills sessions
```

**Password reset:** `/admin/recover` issues single-use, one-hour reset links. Delivery requires Resend; without email configured, the link is printed to the *server log* only, and the CLI script above is the documented recovery path.

Roles: `owner` (everything: settings, deletions, exports) and `staff` (inquiries + content, no deletions/exports/identity settings). Additional staff accounts are created via the CLI script.

---

## Email delivery (Resend)

1. Create a Resend account and verify your sending domain.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` in `.env`.
3. The contact form then sends: (a) a notification to the business inbox (business settings → email / notification email), and (b) a confirmation to the submitter. Administrator password resets also use email.

Delivery outcomes are recorded per inquiry (`sent` / `partial` / `failed` / `not_configured`) and visible on the inquiry detail page. **A failed email never deletes or blocks a stored inquiry, and success messages never falsely claim delivery.**

---

## Rebranding (business name, logo, tagline, contacts)

Two layers, no code search required:

- **Runtime:** `/admin/settings` edits business name, tagline, emails, phone, address, website URL, LinkedIn, SEO defaults, founder profile, and contact-form rules. Applied site-wide immediately.
- **Source defaults:** `src/config/site.ts` holds the fallback defaults, practice-type options, claim-volume ranges, lead statuses, the PHI notice text, and the draft legal page content.

The logo is an inline SVG placeholder (`LogoMark` in `src/components/ui.tsx`) — swap it for the real mark, or extend settings to point at an uploaded image.

---

## Updating professional experience

`/admin/experience` — add, edit, reorder, publish/unpublish records (organization, role, dates, responsibilities, specialties, systems, clearinghouses, verified achievements, optional authorized logo). Empty fields render publicly as **"Details to be added"**; seeded records for Bellmedex Pakistan, RCM Matter / Tech Matter Pakistan, and 24-7 Consultancy Pakistan are intentionally placeholders. The public page visually distinguishes **former employment** and carries an explicit no-endorsement/no-affiliation notice.

---

## Accessibility

- WCAG 2.2 AA targets: semantic landmarks, logical headings, skip link, visible focus, labeled controls, `aria-current` nav, screen-reader status messages, native `<details>` FAQ accordions.
- **Accessibility toolbar** (every public page, fully persistent): text size ±/reset (90–150%), high contrast, grayscale, link highlighting, link underlining, enhanced focus, readable-font mode, reduced animations, reset-all. Keyboard-operable, Escape closes, focus is managed, preferences persist in `localStorage`.
- **Theme:** light default + full dark mode. Explicit choice persists; OS preference applies only until you choose; an inline boot script prevents theme flash. Accessible sun/moon toggle in public nav and admin console.

---

## Security & privacy notes

- Server-side Zod validation on every input; React escaping by default; parameterized queries via Drizzle (no string-concatenated SQL).
- Contact form defenses: honeypot field, submission time-trap, DB-backed rate limiting (6/hour/IP), email+message dedupe hash (10 min), field length caps, input size cap.
- CSRF: admin mutations are Next.js Server Actions (origin-checked); cookies are `sameSite=lax`.
- Audit trail for logins, status changes, notes, exports, deletions, and content/settings changes (IPs stored hashed only).
- Public visitors can submit inquiries but can never read, update, export, or delete them — there is no public inquiry-read endpoint.
- The contact form explicitly forbids PHI and its content is never sent to analytics/advertising tools (none are integrated).
- **HIPAA:** nothing here claims HIPAA compliance. If the business later processes patient billing records/PHI, first evaluate HIPAA applicability, BAAs, hosting configuration, risk analysis, and operational procedures (see the PHI section in `/legal/privacy` and README below).

---

## Deployment (Vercel + managed Postgres)

1. Provision PostgreSQL (Neon, Supabase, RDS, …) and note the connection string.
2. Push the repository to GitHub/GitLab and import into Vercel.
3. Set environment variables: `DATABASE_URL`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL` (production URL), and optionally `RESEND_API_KEY` + `EMAIL_FROM`.
4. Apply schema & seed against the production DB from your machine:

```bash
NEON_DATABASE_URL="<prod-url>" npx drizzle-kit push
psql "<prod-url>" -f scripts/seed.sql
```

5. Deploy, then create the first admin via `/admin/login` (or the CLI script against the prod DB).
6. Verify: `/api/health`, a test inquiry end-to-end, theme toggle, and keyboard tab-through of every page.

`robots.txt` disallows `/admin` and `/api`; the sitemap is generated from live service slugs at `/sitemap.xml`.

---

## Testing status

**Automated (run and passing, 21 tests):** contact validation (fields, lengths, email normalization, phone, service caps, privacy ack), password policy/scrypt hashing, login validation, rate-limit helper, CSV escaping/formula-injection neutralization, HTML escaping, slug/email/line utilities, lead-status integrity.

**Manually verified in this environment:** see `docs/VERIFICATION.md` for the live smoke-test checklist (inquiry persistence, auth, admin protection, theme, toolbar).

**Not yet tested / requires owner action:** real Resend delivery (needs API key + verified domain), WCAG formal audit, legal review of draft policies, and any future PHI-bearing workflows.

---

## Before launch — owner checklist

- [ ] Replace business name, logo, tagline, email, phone, address in `/admin/settings`
- [ ] Fill in founder profile + replace experience placeholders with verified details
- [ ] Legal counsel reviews `/legal/privacy`, `/legal/terms`, `/legal/accessibility` (drafts carry a visible "pending review" banner)
- [ ] Configure Resend and send a test inquiry; confirm notification + confirmation delivery
- [ ] Run a formal accessibility review (target: WCAG 2.2 AA)
- [ ] Add a real `og:image` and favicon set (placeholder hero is included)
- [ ] Decide data-retention windows for inquiries and document them in the privacy policy
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the production domain
