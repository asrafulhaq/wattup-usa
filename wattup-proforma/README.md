# wattup-proforma

The **Site Pro-Forma Builder** for WattUp USA: a browser-only calculator that renders the
six-page host revenue pro-forma live, used to pitch landlords and site hosts, behind an email
plus six-digit code gate. Its own Vercel project and its own subdomain (default
`proforma.wattupusa.com`), separate from the marketing site. Port 3001.

Two halves:

- **The tool**, `private/tool/`: plain HTML, CSS and four JavaScript files, byte-identical to
  `../docs/Pro-Forma source/`. No framework, no server, no stored state. **Do not modify it.**
- **The gate**, everything else: a two-step login (address, then code), two first-party routes
  that call Better Auth server-side, and a route that serves the tool to current members only.

Who may sign in is not decided here. A member is a row in the `proforma_member` SQL view,
which `wattup-frontend` owns and which resolves the `ACCESS_PROFORMA` permission. Users are
created and granted access in the wattupusa.com dashboard; there is no sign-up in this app.

## Stack

Next.js 16.3, React 19.2, TypeScript, Tailwind 4, Better Auth 1.7 (`emailOTP`), Prisma 7 with
`@prisma/adapter-pg` against the shared Postgres, Resend, Vitest 4. pnpm 10.

## Local setup

```bash
cd wattup-proforma          # always inside the app; the repo root is not a workspace
pnpm install                # own lockfile; postinstall runs prisma generate
cp example.env .env         # then fill it in, see the table below
pnpm dev                    # http://localhost:3001
```

`pnpm`, never `npm`. Node 20.9 or newer (Next 16's floor).

### Environment

Every variable this app reads. A required one that is missing or empty makes both gate
routes answer **503** naming it (`lib/env.ts`): the app fails closed, never open.

| Variable | Required | What it is for |
|---|:--:|---|
| `DATABASE_URL` | yes | The shared Postgres, **pooled** endpoint. This app reads `user` and the view, and writes only its own `proforma_*` tables and `activity_log`. It never migrates. |
| `BETTER_AUTH_SECRET` | yes | Signs sessions and keys the HMAC the codes are stored under. `openssl rand -hex 32`. **Must differ from the frontend's.** |
| `BETTER_AUTH_URL` | yes | This app's own origin: Better Auth's `baseURL` and trusted origin. `http://localhost:3001` locally. |
| `NEXT_PUBLIC_APP_URL` | yes | The public origin. It is the only place the subdomain is named; the email's logo link uses it. |
| `RESEND_API_KEY` | yes | Sends the code email. The same key as the frontend, by client decision (2 Sep 2026). |
| `MAIL_FROM` | yes | `WattUp <noreply@wattupusa.com>`, the frontend's verified apex sender. |
| `MAIL_REPLY_TO` | no | Leave unset. The sender is `noreply` on purpose (client decision E, 3 Sep 2026). |
| `PROFORMA_ALLOWLIST` | no | **Development only.** Comma-separated addresses that count as members. In production it is ignored even when set, with one warning, and membership comes from the view. |
| `SESSION_TTL_DAYS` | no | Default 7. A positive integer, or the 503. |
| `OTP_TTL_SECONDS` | no | Default 600. Same rule. |

For local development set `PROFORMA_ALLOWLIST`: the view arrives with the frontend's phase 4b
migration, and until it exists the database directory answers "no member". The address must
still exist in the `user` table, because Better Auth runs with `disableSignUp` and a session
row references `user.id`; the env list widens who is a member, it does not create users.
`pnpm dev` writes real rows (sessions, hashed codes, rate-limit counters) to whatever database
`DATABASE_URL` names.

## Commands

```bash
pnpm dev          # next dev on port 3001
pnpm build        # next build; no seed step, and this app has no migration to run
pnpm start        # next start on port 3001
pnpm lint         # eslint, tests included
pnpm typecheck    # tsc --noEmit, tests included
pnpm test         # vitest run: the gate's guarantees with no database, network or email
pnpm test:watch
pnpm db:generate  # prisma generate (postinstall does this)
pnpm db:studio
```

There is no `migrate` or `db push` script. **Never add one**: `wattup-frontend` owns the schema
and is the only app that migrates it. The gate before a commit is `lint`, `typecheck`, `test`
and `build`, all green.

## Rules that are not guessable

The short form. `AGENTS.md` has the reasons, and the comments in the files have the details.

1. `private/tool/` is untouched, and stays outside `public/` so no file in it has a URL of its own. `outputFileTracingIncludes` in `next.config.ts` is what makes it exist on Vercel: without it the tool route works in dev and 404s in production.
2. Better Auth's OTP endpoints are never public. `app/api/auth/[...all]` allows exactly `/get-session` and `/sign-out`; everything else is 404. Only `app/api/gate/*` is public, and it calls Better Auth server-side.
3. Both gate routes answer identically for a member and a non-member: status, body and timing. The membership decision, the code, the email and the audit row all happen in `after()`, never on the response path. Every `verify-code` failure is one identical 400.
4. Membership is the `proforma_member` view, read through `lib/member-directory.ts`. Never reimplement permission resolution here. `PROFORMA_ALLOWLIST` is honoured outside production only.
5. Four `emailOTP` defaults are overridden in `lib/auth.ts` (keyed HMAC store, 600 s, 5 attempts, `disableSignUp`). Do not "simplify" them back.
6. A code never appears in a log line, an error body or an analytics event. Application logs carry masked addresses; `activity_log` carries the full one, on purpose, because the dashboard searches it.
7. `activity_log` is written by `lib/activity-log.ts`, only from inside `after()`, and `logActivity` never throws: the table is the frontend's and may not exist yet.
8. Secrets are this app's own. `BETTER_AUTH_SECRET` differs from the dashboard's; `DATABASE_URL` is the pooled endpoint.
9. `app/globals.css`, the font in `app/layout.tsx` and the login form's classes are hand copies of `wattup-frontend`'s. Nothing is imported across the apps; when the frontend's tokens change, change them here and say so in the commit.
10. Not a pnpm workspace. `pnpm-workspace.yaml` here carries only pnpm's build-script allowlist and must never gain a `packages:` key.
11. `next dev` rewrites the `nextjs-agent-rules` block at the top of `AGENTS.md`. Commit it rather than fight it.

## Layout

```
app/            login screen, the two gate routes, the Better Auth handler, the gated tool
                route, robots.txt, and the root redirect to /tool/
lib/            auth (Better Auth config), gate (requireMember, origin check, correlation id),
                member-directory, rate-limit, activity-log, email, env, prisma, safe-next
prisma/         a narrow mirror of the tables this app touches; never migrated from here
private/tool/   the calculator, byte-identical to ../docs/Pro-Forma source/
public/         only what the login screen needs before sign-in: wordmarks and favicon
tests/          the Vitest suite; tests/README.md says what is mocked and why
next.config.ts  outputFileTracingIncludes, the no-store / noindex header backstop, and
                skipTrailingSlashRedirect (the tool route canonicalises /tool itself)
example.env     every variable, with comments
AGENTS.md       the rules in full; CLAUDE.md imports it
DEPLOY.md       the operator's guide: Vercel, subdomain, env, migrations, cutover, rollback
```

## Where the docs live

| Doc | What |
|---|---|
| `AGENTS.md` | this app's rules and file-by-file layout |
| `DEPLOY.md` | deploying and cutting over |
| `tests/README.md` | what the suite pins and how nothing real is reached |
| `../CLAUDE.md` | the rules that bind both apps |
| `../docs/adr/0001-proforma-access-architecture.md` | the architecture; section 16 lists where it departs from the PRD |
| `../docs/adr/0002-roles-and-permissions.md` | roles and the `ACCESS_PROFORMA` permission |
| `../docs/plan/CHECKLIST.md` | the tracked plan and the client's decisions |
| `../docs/plan/RUNBOOK-dns-email-env.md` | DNS, Resend and env, for the operator |
| `../docs/plan/SECURITY-FINDINGS.md` | open findings |
| `../docs/Pro-Forma Access.md` | the client PRD, superseded in parts by ADR 0001 |
| `../docs/Pro-Forma source/` | the original tool and its old password-gate deploy docs |
