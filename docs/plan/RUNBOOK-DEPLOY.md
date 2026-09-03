# Runbook — deploying WattUp

Written 3 Sep 2026, against the code at commit `23f7c39`. Every variable name and
setting below was read out of the code, not assumed; where something is unused or
uncertain it says so.

`RUNBOOK-dns-email-env.md` remains the deeper reference for DNS and Resend. **Two of
its verification commands are now wrong** and are corrected in §9 here: it tests
`/js/model.js` and uses the subdomain `hostproposal`, both superseded.

---

## 1. What you are deploying

Two **separate** Next.js applications from one repository, sharing one Postgres
database. They never call each other; they meet only in the database.

| | `wattup-frontend` | `wattup-proforma` |
|---|---|---|
| What | Marketing site + team dashboard | Site Pro-Forma Builder, behind an email gate |
| Domain | `wattupusa.com` | `proforma.wattupusa.com` |
| Local port | 3000 | 3001 |
| Owns the schema | **Yes** — the only app that migrates | No — read-mostly, no migrate script exists |
| Scheduled jobs | Yes, one cron | None |

**This repository is not a pnpm workspace and must not become one.** Each app has
its own lockfile and installs independently. This is the single most important fact
for the Vercel setup: it means **two Vercel projects**, each with its **Root
Directory** set. Getting that wrong is the known blocker (checklist 0.18).

### State as of writing

- Local `main` is at `23f7c39`, and **both git remotes already have that commit**
  (verified with `git ls-remote`). The code is on GitHub.
- **No migrations have been applied to production by this process**, and nothing is
  deployed yet. Confirm both before assuming.
- If a Vercel project is already connected to either GitHub repo with auto-deploy
  on, it may have built already. Check before you start.

---

## 2. Accounts and access you need

1. **Vercel** — able to create projects and edit environment variables.
2. **GitHub** — the repo. Two remotes exist: `asrafulhaq/wattup-usa` and
   `Deveripon/wattup-frontend`. **Decide which one Vercel builds from** and use only
   that one; two projects building the same code from different remotes will fight.
3. **Neon** — the Postgres database. Already provisioned at
   `ep-fancy-tooth-amtuokoy-pooler.c-5.us-east-1.aws.neon.tech`.
4. **Resend** — the sending domain. Ownership is an open client question (ask J).
5. **DNS for wattupusa.com** — currently Squarespace.
6. **Cloudinary** and a **Mapbox** token, for the frontend.

---

## 3. Step one: the database

The database already exists and both apps point at the same one. Nothing to create.

### 3.1 Apply migrations

`wattup-frontend` is the only app that may do this. There are **12 migrations**, and
the most recent (`20260903100000_rbac_permissions`) creates the `proforma_member`
view that the pro-forma gate depends on. **The pro-forma app cannot admit anyone
until that migration is applied.**

```bash
cd wattup-frontend
pnpm install
DATABASE_URL='<production url>' pnpm migrate:deploy
```

`migrate:deploy` applies pending migrations and never resets. Use it, not
`migrate:dev` and never `db push`.

### 3.2 What NOT to run

> **`pnpm db:seed` writes to whatever `DATABASE_URL` points at.** It force-promotes
> `ADMIN_EMAIL` to `SUPER_ADMIN` and recreates that account from `ADMIN_PASSWORD`.
> It is a deliberate, production-affecting action, never a routine step, and it used
> to run on every build until finding F13 removed it. Do not put it in a build
> command.

Use `pnpm seed:admins` instead when you need to create the first administrator: it
touches `user` and `account` only and adds nobody who is not in `ADMIN_EMAILS`.

### 3.3 Verify

```bash
psql "$DATABASE_URL" -c "select count(*) from _prisma_migrations where finished_at is not null;"
psql "$DATABASE_URL" -c "select count(*) from proforma_member;"
```

The view must exist. Zero rows is fine at this stage; a missing relation is not.

---

## 4. Step two: generate the secrets

```bash
# One for each app. THEY MUST DIFFER.
openssl rand -base64 32   # -> wattup-frontend BETTER_AUTH_SECRET
openssl rand -base64 32   # -> wattup-proforma BETTER_AUTH_SECRET
openssl rand -base64 32   # -> wattup-frontend CRON_SECRET
```

> **The two `BETTER_AUTH_SECRET` values must be different.** They are what keep the
> two apps' sessions separate on a shared parent domain, so rotating one does not
> sign out the other's users. The cookie prefix (`wup` for the pro-forma) separates
> the cookie names; the secret separates the trust.

Rotating a `BETTER_AUTH_SECRET` invalidates every existing session for that app.

---

## 5. Step three: Vercel project A — `wattup-frontend`

### 5.1 Create it

1. **Add New → Project**, import the GitHub repo you chose in §2.
2. **Root Directory: `wattup-frontend`.** Not the repository root. This is 0.18 and
   it is the step everything else waits on.
3. Framework preset: **Next.js** (detected).
4. Build command: leave as the default (`pnpm build`, which is plain `next build`).
   **Do not add a seed or migrate step to it.**
5. Install command: default. `postinstall` runs `prisma generate` already.
6. Node.js version: **20.x or newer**. Next 16 requires it.

### 5.2 Environment variables

Set for **Production** and **Preview**. Names below are exactly what the code reads.

**Required — the app is broken without these**

| Name | What it is |
|---|---|
| `DATABASE_URL` | The Neon **pooled** connection string |
| `BETTER_AUTH_SECRET` | From §4. Must differ from the pro-forma's |
| `BETTER_AUTH_URL` | `https://wattupusa.com` |
| `NEXT_PUBLIC_APP_URL` | `https://wattupusa.com` — used by robots.txt, sitemap and layout |
| `RESEND_API_KEY` | Resend API key |
| `MAIL_FROM` | `WattUp <noreply@wattupusa.com>` |
| `MAPBOX_ACCESS_TOKEN` | Station finder and geocoding |
| `CLOUDINARY_CLOUD_NAME` | Server-side uploads |
| `CLOUDINARY_API_KEY` | " |
| `CLOUDINARY_API_SECRET` | " |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Client-side image URLs |
| `CONTACT_EMAIL` | Where the contact form is delivered |
| `ADMIN_EMAIL` | Also read by the contact action, so it is needed at runtime, not only by the seed |

**Required for the scheduled job**

| Name | What it is |
|---|---|
| `CRON_SECRET` | From §4. **While it is unset, the purge route answers 401 to everything**, so the job silently never runs |

**Optional**

| Name | Default if unset |
|---|---|
| `ACTIVITY_LOG_RETENTION_DAYS` | `90`. Must be a whole number ≥ 1 |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | analytics off |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | off |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | no verification meta tag |
| `NEXT_PUBLIC_COOKIEBOT_CBID` / `NEXT_PUBLIC_COOKIEYES_ID` | consent banner off |

**Seed-only — do NOT set these in Vercel**

`ADMIN_EMAILS`, `ADMIN_NAME`, `ADMIN_PASSWORD` are read only by
`prisma/seed.ts` and `prisma/seed-admins.ts`. They belong in a local shell for the
one-off bootstrap in §8. `ADMIN_PASSWORD` in a deployed environment is a standing
credential in a dashboard.

**Set today but read by no code** — safe to delete:
`CLOUDINARY_URL`, `NEW_API_KEY`, `NEW_API_SECRET`, `NEW_CLOUD_NAME`.

### 5.3 The cron

`vercel.json` already declares it:

```json
{ "crons": [{ "path": "/api/cron/purge-activity-log", "schedule": "17 3 * * *" }] }
```

Vercel registers this from the file; there is nothing to click. It only works once
`CRON_SECRET` is set, because Vercel sends it as `Authorization: Bearer <CRON_SECRET>`
and the route compares hashes and answers 401 to anything else.

### 5.4 Domains

Add `wattupusa.com` and `www.wattupusa.com`, and follow Vercel's DNS instructions.
Full DNS detail is Part 4 of `RUNBOOK-dns-email-env.md`.

---

## 6. Step four: Vercel project B — `wattup-proforma`

A **second, separate project** in the same Vercel account, from the same repository.

1. **Add New → Project**, import the same repo again.
2. **Root Directory: `wattup-proforma`.**
3. Build command: default (`next build`).
4. Node.js: 20.x or newer.

### 6.1 Environment variables

This app fails closed and will tell you what is missing. `lib/env.ts` defines
exactly six required variables, and both gate routes answer **503 naming the missing
ones** before anything else runs. An empty string counts as missing.

**Required — a 503 without them**

| Name | Value |
|---|---|
| `BETTER_AUTH_SECRET` | From §4. **Different from the frontend's** |
| `BETTER_AUTH_URL` | `https://proforma.wattupusa.com` |
| `NEXT_PUBLIC_APP_URL` | `https://proforma.wattupusa.com` |
| `DATABASE_URL` | The same Neon **pooled** string |
| `RESEND_API_KEY` | Resend API key |
| `MAIL_FROM` | `WattUp <noreply@wattupusa.com>` |

**Optional**

| Name | Default | Notes |
|---|---|---|
| `SESSION_TTL_DAYS` | `7` | Must be a positive integer or the app 503s |
| `OTP_TTL_SECONDS` | `600` | Same rule |
| `MAIL_REPLY_TO` | unset | Deliberately empty: decision E, the code email is `noreply` on purpose |
| `EVPIN_ALLOWED_HOSTS` | built-in list | Comma separated. Extends the EVpin reader's host allowlist so a hostname change there needs an env edit, not a deploy |
| `PROFORMA_ALLOWLIST` | — | **Ignored in production**, with a warning. It exists so development does not need real members. Setting it in production does nothing, by design, so an env list can never bypass a revocation made in the dashboard |

### 6.2 Domain

Add `proforma.wattupusa.com`.

> The subdomain is **`proforma`**, per decision A. `RUNBOOK-dns-email-env.md` still
> says `hostproposal` throughout; that spelling is superseded.

---

## 7. Step five: Resend

Follow Part 3 of `RUNBOOK-dns-email-env.md`. In short: verify the sending domain,
add the DKIM and SPF records it gives you, and use the same key for both apps —
that is the client's decision, recorded in the ADR.

Two open items, neither blocking a deploy:

- **Ask J** — who owns the Resend account.
- **Ask K** — the apex SPF record needs fixing.

---

## 8. Step six: create the first administrator

Once the frontend is deployed and migrations are applied, from your own machine:

```bash
cd wattup-frontend
DATABASE_URL='<production url>' \
ADMIN_EMAILS='someone@wattupusa.com' \
ADMIN_PASSWORD='<a strong password, used once>' \
pnpm seed:admins
```

Then sign in at `https://wattupusa.com/admin` and **change that password
immediately**. Public registration is closed twice over (`disableSignUp` plus a
`before` hook), so this is the only way in.

Grant `ACCESS_PROFORMA` to whoever needs the pro-forma from the dashboard. Until
someone has it, `proforma_member` is empty and the gate admits nobody — which is
correct, not a fault.

---

## 9. Step seven: verify

Replace the two stale checks in the old runbook with these.

```bash
# --- The pro-forma gate ---

# 1. The subdomain serves the LOGIN screen to a stranger, never the tool.
curl -sI https://proforma.wattupusa.com/tool | head -1
#    expect: HTTP/2 307   (a redirect, with NO html body)

curl -s https://proforma.wattupusa.com/tool | wc -c
#    expect: 0

# 2. Nothing of the calculator is reachable without a session.
#    The old test hit /js/model.js. That route no longer exists: the engine is
#    bundled now and the file-serving route was deleted, so the whole class of
#    path traversal went with it. What matters now is that the PAGE leaks nothing.
curl -s https://proforma.wattupusa.com/tool | grep -ci "Permitted operating costs"
#    expect: 0

# 3. Told to stay away.
curl -sI https://proforma.wattupusa.com | grep -i "x-robots-tag"   # noindex, nofollow
curl -s  https://proforma.wattupusa.com/robots.txt                 # Disallow: /

# 4. Enumeration. THE important one: these two responses must be byte-identical,
#    in status, body AND timing.
curl -s -w '\n%{http_code} %{time_total}\n' -X POST \
  https://proforma.wattupusa.com/api/gate/request-code \
  -H 'content-type: application/json' -d '{"email":"<a real member>"}'

curl -s -w '\n%{http_code} %{time_total}\n' -X POST \
  https://proforma.wattupusa.com/api/gate/request-code \
  -H 'content-type: application/json' -d '{"email":"nobody@example.com"}'

# 5. Missing configuration announces itself rather than 500ing.
#    If you see a 503 naming a variable, that variable is missing. That is the
#    fail-closed check doing its job.
```

Then, by hand, signed in as a member:

- `/tool` renders the builder, and the document appears in the preview.
- Typing in a field updates the KPI strip immediately and the document a beat later,
  **without the preview blanking**.
- **Save as PDF** produces the six-page document.
- **Sign out** shows the spinner overlay and lands on `/login`.

For the frontend: sign in at `/admin`, load `/dashboard`, and confirm
`/dashboard/activity` shows rows (sign-ins from both apps land in the same table).

---

## 10. Rollback

Vercel keeps every build. **Promote the previous deployment** from the project's
Deployments tab; it is instant and needs no rebuild.

What that does **not** undo:

- **Migrations.** They are forward-only here. A schema change that breaks the
  previous build cannot be rolled back by promoting it. Read a migration before
  applying it to production.
- **Seed effects.** A promoted user stays promoted.

To close the gate immediately without a deploy: remove `ACCESS_PROFORMA` from every
role and user in the dashboard. `proforma_member` empties and the gate admits nobody
on the next request, because the session is read from the database and not a cookie
cache.

---

## 11. Known issues to weigh before going live

1. **`Cache-Control: no-store` is applied to every path in `wattup-proforma`,
   including `/_next/static/*`.** Those files are content-hashed build artefacts,
   identical for every visitor, carrying no user data. The header forces a full
   re-download of the app shell on every load and is the single largest repeat-load
   cost in that app. Narrowing it to allow `public, max-age=31536000, immutable` for
   `/_next/static/` only is a deliberate security decision and has not been made.
2. **`pnpm lint` fails in `wattup-frontend`** — 17 errors across fourteen files,
   pre-existing and unrelated to recent work, though that app's `CLAUDE.md` says lint
   must pass. It does not block a build.
3. **F17, Cloudinary separation**, is still open.
4. **The break-glass admin account** (`db:seed`) is still an open client question:
   whether it should exist at all.
5. Sessions have been observed **disappearing from the `session` table**
   unexplained during development. If users report spurious sign-outs after launch,
   start there.

---

## 12. The short version

```
1.  Apply migrations           cd wattup-frontend && pnpm migrate:deploy
2.  Generate 3 secrets         openssl rand -base64 32   (x3, two must differ)
3.  Vercel project A           Root Directory = wattup-frontend
4.  ...its env                 13 required + CRON_SECRET
5.  Vercel project B           Root Directory = wattup-proforma
6.  ...its env                 exactly 6 required; it 503s and names any missing
7.  Domains                    wattupusa.com  and  proforma.wattupusa.com
8.  Resend                     verify the domain, add DKIM + SPF
9.  First admin                pnpm seed:admins, then change the password
10. Verify                     §9, especially the two identical gate responses
```

**The one that stops everything if it is wrong: Root Directory.** This is not a
workspace, so a project built from the repository root will not find an app.
