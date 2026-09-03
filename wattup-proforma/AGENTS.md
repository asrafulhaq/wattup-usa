<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# wattup-proforma

The **Site Pro-Forma Builder**: a browser-only calculator that renders WattUp's six-page host
revenue pro-forma live, used to pitch landlords and site hosts. Deployed to its own subdomain,
named only by `NEXT_PUBLIC_APP_URL` (default `proforma.wattupusa.com`), separate from the marketing
site. Port 3001.

This app is **a new front door in front of an unchanged tool** — email plus a six-digit code,
replacing a shared password.

> Repo-wide rules are in the root `CLAUDE.md`. `CLAUDE.md` here is an `@AGENTS.md` import, so
> this file is the single source; Next.js regenerates the block above on `next dev`.

## Two halves

**The tool** — `private/tool/`, the source in `../docs/Pro-Forma source/` bar the two exceptions below. Plain HTML, CSS
and four JavaScript files: `model.js` (the financial model, ported from Python and verified to
the cent), `doc.js` (renders the six-page document), `evpin.js` (parses EVpin site reports),
`app.js` (form, live preview, JSON import/export, print). No framework, no server, no stored
state — everything typed lives in the browser tab. **Do not modify these files, with two
recorded exceptions.**

> **Exception 1, privacy:** `evpin.js`'s `EVPIN_READERS` array and `evpinFetchText`, replaced
> by a call to `/api/tool/evpin-fetch` (checklist 5.15). The tool used to send a pasted report
> URL to `r.jina.ai` and `api.allorigins.win`, so a landlord's confidential report travelled
> through two companies WattUp has no agreement with. The parser below that function, the
> paste-the-text-yourself path, and every other file are untouched.
>
> **Exception 2, the cover photograph:** the cover in this copy of the source is a gradient
> with no image at all, while the live tool at hostlocation-proforma.pplx.app shows WattUp's
> station render there. That live build is a later version than `docs/Pro-Forma source` and is
> not in this repository: it carries a `js/brand.js`, a PDF.js vendor bundle and a
> file-upload EVpin flow that our copy has never had. Rather than leave the cover blank,
> `assets/render-station-wide.jpg` was extracted from that build's `brand.js`, where it ships
> as an embedded data URL under the key `station_wide`, and:
>
> - `doc.js` gains that build's own `.cover-render`, `.cover-render img` and
>   `.cover-render .scrim` rules, copied from it verbatim: a 6.1in band, `object-fit:cover`
>   with `object-position:center 42%`, and the six-stop scrim. Both builds were measured in
>   a browser and agree to the pixel (band 585.594px, `50% 42%`, source 1500x788), so the
>   cover crops and sits exactly as the live one does. Do not retune these by eye;
> - `app.js` gains a `cover` image slot in section 5 and loads the shipped render as its
>   default through a new `rasterDataUrl`, so a cover looks finished with nothing uploaded;
> - the tool route's `CONTENT_TYPES` gains `.jpg` and `.jpeg`, without which that fetch 404s
>   and the cover renders broken through the gate while working off a plain static server.
>
> The live build feeds the same img from a `BRAND_RENDERS` global in its `js/brand.js`,
> gated by a `brand_imagery` flag. Ours feeds it from the image slot instead, because this
> repo has no `brand.js`. That is the only departure in the cover markup.
>
> **If the newer source arrives, diff against it and prefer it over both exceptions.** Revert
> either by restoring the file from git history; nothing else in the tool depends on them.

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

**The membership decision, and the email, happen after the response, never on the response
path.** Use `after()` from `next/server`. A Resend round trip is hundreds of milliseconds, and
Better Auth's own database round trips for a member measured 1.1 s against 3 ms for a
non-member; either would make the member branch measurably slower. `request-code` answers
from the request alone and decides in `after()`.

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

**The audit trail is `activity_log`, written by `lib/activity-log.ts`, and only from inside
`after()`.** Four events (`code.requested`, `code.refused`, `signin.success`, `signin.failed`),
each with the client IP, the user agent and the request's correlation id, and `meta.reason`
on a refusal. The row holds the FULL address, because the dashboard searches it (ADR 0001
section 9); every application log line masks it. A write never runs on the response path,
where its latency and its failure would both be observable, and `logActivity` never throws:
the table is `wattup-frontend`'s, may not exist yet, and a lost row is a log line, never a
different response.

**`PROFORMA_ALLOWLIST` is honoured outside production only.** In production
`getMemberDirectory()` ignores it even when set, warns once, and answers from the view, so an
env list can never bypass a revocation made in the dashboard (checklist 4b.4).

**Secrets are this app's own.** `BETTER_AUTH_SECRET` differs from the dashboard's, so rotating
it here does not sign out wattupusa.com. `DATABASE_URL` is the **pooled** endpoint.

**Design tokens are copied from wattup-frontend and must be kept in sync by hand.**
`app/globals.css` is a copy of the frontend's token block and the four utilities its sign-in
form uses; `app/layout.tsx` loads the same font the same way; the login form's classes are the
frontend sign-in form's. Nothing is imported across the apps (ADR 0001 section 3). When the
frontend's tokens change, change them here too, and say so in the commit.

## Layout

```
app/api/auth/[...all]/       Better Auth, with OTP paths closed
app/api/tool/evpin-fetch/    POST: members only, the first-party reader for EVpin report URLs. Sixteen
                             guards, of which the host allowlist is the primary one; read its header
app/api/gate/request-code/   POST: origin check, normalise, answer the same 200, then in after(): IP limit,
                             directory, address limits, send, and last the activity_log row
app/api/gate/verify-code/    POST: origin check, sign in server-side, re-check membership, one identical 400
                             for every failure; the activity_log row is scheduled with after()
app/robots.ts                /robots.txt, disallow all; next.config.ts carries the header backstop
app/tool/[[...path]]/        serves private/tool/ to current members only
app/login/                   the two-step screen: page.tsx validates ?next= and sends a current
                             member straight on; login-form.tsx is the client form
app/page.tsx                 redirects to /tool/, which bounces a signed-out person to /login
app/layout.tsx               title, noindex, favicon, Plus Jakarta Sans via next/font; globals.css has
                             the tokens, both copied by hand from wattup-frontend
lib/auth.ts                  Better Auth config — read the comments before editing
lib/gate.ts                  requireMember: the one place a gated request decides membership;
                             also correlationId, isSameOrigin, and the gate's shared response headers
lib/safe-next.ts             safeNext, import-free so the browser can use it too; lib/gate.ts re-exports it
lib/env.ts                   missingRequiredEnv: the 503 fail-closed check both gate routes run first
lib/rate-limit.ts            checkIpLimit and checkEmailLimits: the PRD's three limits on hashed keys, in
                             Postgres, failing OPEN to memory (ADR 0001 section 10); read its header first
lib/member-directory.ts      who may sign in: PROFORMA_ALLOWLIST outside production, the proforma_member view
                             in production, where the env list is ignored even when set
lib/activity-log.ts          logActivity: the four audit events into activity_log, full address, never throws,
                             called only from inside after(); clientUserAgent and activityContext
lib/prisma.ts                Prisma client, pooled
lib/email.ts                 Resend + the OTP template; maskEmail for logs
prisma/schema.prisma         narrow mirror, never migrated from here; activity_log is the one table it writes
private/tool/                the calculator, source-identical bar the two exceptions above
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
