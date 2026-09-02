<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# wattup-proforma

The **Site Pro-Forma Builder**: a browser-only calculator that renders WattUp's six-page host
revenue pro-forma live, used to pitch landlords and site hosts. Deployed to
hostproposal.wattupusa.com, separate from the marketing site. Port 3001.

This app is **a new front door in front of an unchanged tool** — email plus a six-digit code,
replacing a shared password.

> Repo-wide rules are in the root `CLAUDE.md`. `CLAUDE.md` here is an `@AGENTS.md` import, so
> this file is the single source; Next.js regenerates the block above on `next dev`.

## Two halves

**The tool** — `private/tool/`, byte-identical to `../docs/Pro-Forma source/`. Plain HTML, CSS
and four JavaScript files: `model.js` (the financial model, ported from Python and verified to
the cent), `doc.js` (renders the six-page document), `evpin.js` (parses EVpin site reports),
`app.js` (form, live preview, JSON import/export, print). No framework, no server, no stored
state — everything typed lives in the browser tab. **Do not modify these files.**

**The gate** — everything else in this app.

## Stack

Next.js 16.3, React 19.2, TypeScript, Tailwind 4, Better Auth 1.7 (`emailOTP`), Prisma 7
against the shared Postgres, Resend. pnpm.

## Rules that are not guessable

**Better Auth's OTP endpoints are never exposed to the browser.**
`app/api/auth/[...all]/route.ts` returns 404 for any path containing `email-otp`, `sign-in` or
`sign-up`. Better Auth deliberately leaks whether an address belongs to a user — its own
comment says *"safe to leak the existence of a user, given the user has already the OTP from
the email"* — and this app's entire premise is that it must not. Only `app/api/gate/*` is
public, and it calls Better Auth server-side.

**Both gate endpoints must be indistinguishable for a member and a non-member**, in status,
body **and timing**. Every `verify-code` failure — wrong code, expired, never issued, attempts
exhausted, member removed mid-flow — returns one identical response. The real reason is logged
with a correlation id, never returned.

**The email is sent after the response, never awaited on the response path.** Use `after()`
from `next/server`. A Resend round trip is hundreds of milliseconds and would make the member
branch measurably slower than the non-member one.

**Four `emailOTP` defaults are wrong here and are overridden in `lib/auth.ts`:**
`storeOTP: 'hashed'` (default `'plain'` stores codes in clear), `expiresIn: 600` (default 300),
`allowedAttempts: 5` (default 3), `disableSignUp: true` (default `false` would *create* a user
on sign-in and make the member list meaningless).

**Tool files live in `private/tool/`, never `public/`.** A file in `public/` has a URL, and no
matcher mistake may be allowed to serve `model.js`. This needs `outputFileTracingIncludes` in
`next.config.ts` or the serving route works in dev and 404s in production.

**No migrations here.** `wattup-frontend` owns the schema. `package.json` has no `migrate` or
`db push` script and `prisma.config.ts` declares no migrations path — keep it that way.
`prisma/schema.prisma` is a narrow mirror: `User` is read-only and omits `role` so this app
never has to declare the `Role` enum.

**Who may sign in** is the `ACCESS_PROFORMA` permission, resolved by the `proforma_member` SQL
view that `wattup-frontend` owns. Never reimplement permission resolution here.

**Codes never appear** in a log line, an error body or an analytics event. Emails in
application logs are masked; full addresses belong in `activity_log`.

**Secrets are this app's own.** `BETTER_AUTH_SECRET` differs from the dashboard's, so rotating
it here does not sign out wattupusa.com. `DATABASE_URL` is the **pooled** endpoint.

## Layout

```
app/api/auth/[...all]/   Better Auth, with OTP paths closed
app/api/gate/            the two public routes (phase 2)
lib/auth.ts              Better Auth config — read the comments before editing
lib/prisma.ts            Prisma client, pooled
lib/email.ts             Resend + the OTP template
prisma/schema.prisma     narrow mirror, never migrated from here
private/tool/            the untouched calculator (phase 3)
```

## Commands

```bash
pnpm dev            # localhost:3001
pnpm build
pnpm lint
```

## Reference

`../docs/adr/0001-proforma-access-architecture.md` is the architecture and
`../docs/plan/CHECKLIST.md` is the tracked plan. `../docs/Pro-Forma Access.md` is the client
PRD — read ADR section 16 first for where the build departs from it, and why.
