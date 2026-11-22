# JOBITHLAL — Creative Digital Studio website

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Motion · Prisma 7 + PostgreSQL · Zod.

## Status

| Phase | Scope | Status |
|---|---|---|
| 1–4 | Public website: homepage, 3 service pages, work + case studies, about, contact, legal, SEO | ✅ Done |
| 5 | Database schema + migrations + seed, admin authentication, roles, audit log, inquiry storage | ✅ Done |
| 6 | Admin: homepage editor (draft/preview/publish/history), services, portfolio, media library, inquiries (notes, CSV), settings, users & 2FA, activity log | ✅ Done |
| 7 | SEO manager ✅, analytics ✅ · appearance manager, backup/restore | ⏳ In progress |
| 8–10 | Polish, Playwright test suite, deployment | ⏳ |

## Quick start (Mac)

Double-click **Start Website.command** — it installs packages on first run and opens http://localhost:3000.
Or in Terminal:

```bash
npm install
npm run dev            # http://localhost:3000
```

The site runs without any configuration. To enable the admin, connect a database (below).

## Connecting the database (enables /admin)

1. Create a PostgreSQL database (Neon, Supabase, or your host's PostgreSQL) and copy its connection string.
2. `cp .env.example .env` and set `DATABASE_URL`, `AUTH_SECRET`, and a temporary `ADMIN_SETUP_TOKEN`.
3. Create the tables and load the current site content:
   ```bash
   npm run db:deploy    # apply migrations
   npm run db:seed      # safe to re-run: never overwrites edited content, never creates users
   ```
4. Create the first Super Admin — either:
   - visit **/admin/setup** and enter the `ADMIN_SETUP_TOKEN` (the page locks itself once an account exists), or
   - `npm run admin:create -- --email you@example.com --name "Jobith Lal"` (prompts for the password).
5. Remove `ADMIN_SETUP_TOKEN` from the environment.

`npm run admin:create` also resets a forgotten password from the server shell when email isn't configured.

## How content works

Public pages read content only through `src/lib/content.ts`:

- With a database: content comes from PostgreSQL, validated by the Zod schemas in `src/content/schema.ts`,
  cached per type with tags. Admin saves (Phase 6) call `updateTag()` so changes appear on the next visit.
- Database missing or unreachable: the same functions serve the seed content in `src/content/*.ts`,
  so the site never goes blank (errors are logged).
- Homepage sections can be hidden individually (`PageSection.visible`).
- **Sample projects** (flagged `isDemo`, badged “Sample layout”, `noindex`, excluded from the sitemap)
  disappear automatically as soon as one real project is published.
- **Statistics** only render when marked verified. **Social links** stay hidden until real URLs are entered.

## Media storage (Vercel Blob)

Uploads go straight from the browser to **Vercel Blob** using short-lived, single-file tokens issued by
`/admin/media/upload` (the storage credential never reaches the browser). After upload the server checks
the file's real bytes (magic numbers) and size before registering it; anything else is deleted.
Allowed: JPG, PNG, WebP, AVIF, GIF (20 MB) and MP4, WebM, MOV (500 MB, multipart). SVG is refused.
Files in use can't be deleted — the library shows where each file is used.

**Setup:** Vercel → project → Storage → Create Database → **Blob** → connect to the project → redeploy.
Vercel adds `BLOB_READ_WRITE_TOKEN` automatically. Until then the admin shows a clear setup notice.

## Security model

- **Passwords:** scrypt (Node built-in), 12+ characters. **Sessions:** random 256-bit token in an
  `HttpOnly`, `SameSite=Lax`, `__Host-` cookie; only its SHA-256 is stored; 7-day sliding expiry.
- **Brute force:** per-IP and per-account rate limits (database-backed), account lock for 15 minutes after
  5 failed passwords, constant-time responses for unknown emails, generic error messages.
- **Two-factor:** TOTP verification is built into sign-in; enrolment UI arrives with Users & Security (Phase 6).
- **Authorization:** Super Admin / Editor / Viewer permission matrix in `src/lib/auth/permissions.ts`,
  enforced on the server in every admin page (`requirePage`) and action (`requireAction`).
- **No self-registration.** First account only via setup token or server CLI.
- **Audit log** of sign-ins, failures, lockouts, resets and admin changes (visible to Super Admins).
- `/admin` responses carry `noindex`, `no-store` and `X-Frame-Options: DENY`.

## Contact form

Server Action (`src/app/actions/contact.ts`): Zod validation, honeypot, minimum fill time, rate limit,
duplicate-submission key. Each inquiry is **saved to the database first**, then emailed via Resend;
delivery status (`SENT` / `FAILED` / `NOT_CONFIGURED`) is recorded on the inquiry. With no database and
no email, the visitor gets pre-filled email/WhatsApp buttons so nothing is lost.

## Hosting note

The original brief targets Vercel + managed PostgreSQL. The site runs on any Node.js 20.9+ host; on
cPanel-style hosting use “Setup Node.js App”, `npm run build`, and `npm start`. If a host only offers
MySQL, the schema is kept portable (no PostgreSQL-only column types): change the provider and adapter
and generate a fresh migration.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` / `typecheck` | Code checks |
| `npm run db:migrate` | Create a new migration in development |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Load default content (idempotent) |
| `npm run admin:create` | Create an admin or reset a password |

## Known limitations

- SEO: Admin → SEO (Super Admin edits). Per-page titles/descriptions/share images, indexing switch, Google/Bing verification.
- Email: Admin → Email. Paste a Resend API key (stored AES-256-GCM encrypted with a key derived from `AUTH_SECRET`), sender and recipient; shows domain status, a test-send and a delivery log. The `RESEND_API_KEY`/`CONTACT_*` env vars still work as a fallback.
- Analytics: Admin → Analytics. Set the GA4 Measurement ID to enable tracking (consent banner by default). For traffic reports inside the dashboard, add `GA4_PROPERTY_ID`, `GA4_CLIENT_EMAIL`, `GA4_PRIVATE_KEY` (a service account with Viewer access on the property).
- Design & appearance and backup/restore are still to come.
- Services save straight to the live site (no separate draft step); the homepage and projects have full draft → preview → publish.
- The design was built from the written brief; the visual reference image wasn't available.
- Legal pages are starting templates — have them reviewed before launch.
