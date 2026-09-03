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

**The tool** — a Next.js page at `/tool`, built from two halves that are governed differently.

> **The engine is vendor code.** `lib/proforma/model.js`, `document.js` and `evpin.js` are
> `private/tool/js/{model,doc,evpin}.js` copied byte-for-byte, with only a header, an export
> block and one import added. `model.js` is the financial model ported from Python and verified
> to the cent; `document.js` renders the document; `evpin.js` parses EVpin site reports.
> **Do not edit their bodies.** `tests/proforma/engine-parity.test.ts` runs the vendor files and
> the ported ones over 22 input shapes and fails on a single differing character, which is what
> makes "the document did not change" a checkable claim rather than a promise. To change one:
> edit `private/tool/js/`, re-run the parity test, copy the result across.
>
> **The control panel is this app's own code**, in `components/builder/`, and may be changed
> freely. Its field definitions in `lib/proforma/sections.ts` are generated from `app.js` and
> pinned by `tests/proforma/sections-parity.test.ts`, so every section note and field hint stays
> word for word what the static tool had.

`private/tool/` is still in the repo and is still the frozen source in `../docs/Pro-Forma
source/` bar the three exceptions below, but **nothing serves it any more**: it is the reference
the parity tests compare against. The route that used to read it off disk is gone, and with it
the whole class of path-traversal risk it existed to defend against.

Nothing typed is sent anywhere. The model runs in the browser, images become data URLs and never
leave it, and the only state written to the device is what section 2.2 of
`../docs/plan/PROFORMA-NEXTJS-MIGRATION.md` describes.

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
> **Exception 3, the offer validity window:** the live tool prints `Valid through <date>`
> under the confidentiality badge on the cover, and this copy of the source has no such
> concept at all: no `validity_days` input, no expiry, no `.valid` rule. The window was
> ported from the live build, again verbatim where it exists there:
>
> - `model.js` gains the `validity_days` default of 30, the offer validity block that
>   derives `issued` and `expires` from `prepared_date`, and three new fields on the
>   `prepared` output. **No financial figure moves.** That was proved, not assumed: the
>   model was built from `DEFAULT_INPUTS` before and after and every other section
>   (location, assumptions, operations_y1, opex, host_economics, competitive, avoidance,
>   projection, market, design) is byte-identical. Re-run that check if you touch it;
> - `app.js` gains the `Proposal valid for` field, so section 7 is now
>   `Preparer, validity & branding`;
> - `doc.js` gains the live build's `.cover .foot .bstack` and `.cover .valid` rules and
>   the stacked badge markup. Measured against the live tool: `column`, `flex-end`, `7px`,
>   `9.5px`, `rgb(196,203,214)`, `0.4px`, and the same rendered date.
>
> `validity_days: 0` prints no line, which is the live build's own behaviour.
>
> **Two halves of this feature are deliberately NOT ported**, because our page structure
> has no place for them: the live build also prints the window as a `Validity of this
> proposal` term on its last page (our source has no `class="tt"` terms block at all), and
> its section 7 carries `prepared_for` and `prepared_for_company`, which drive a
> `Prepared for` line on the cover. Both need the newer source.
>
> **If the newer source arrives, diff against it and prefer it over all three exceptions.** Revert
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

**The cookie prefix is shared, never retyped.** `lib/auth.ts` sets `cookiePrefix: 'wup'` so
this app's sessions cannot be confused with the dashboard's on a shared parent domain. Anything
that READS that cookie must name the same prefix. `proxy.ts` did not, better-auth looked for its
own default, and every signed-in member was bounced to `/login`, which saw a valid member and
sent them straight back: an infinite loop that typechecked, linted, built and passed every test.
Both now import `lib/auth-cookies.ts`. `tests/proforma/proxy.test.ts` pins it.

**`proxy.ts` is not the membership check and must never be treated as one.** It is sync, reads
the cookie only, and makes no database call, so it cannot know whether a session is valid, the
user is banned, or they still hold `ACCESS_PROFORMA`. `app/tool/page.tsx` decides that with
`requireMember`, against the database, and stays the authority. A test asserts a forged cookie
gets past the proxy, precisely so nobody deletes the real check.

**Theme switching never reaches the document.** `components/theme-provider.tsx` themes the
control panel. The document renders in an iframe with its own stylesheet and its own
`design.ink` and `design.accent`, because it is a printed sales document: a landlord's PDF must
not change because whoever built it preferred a dark editor.

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
app/tool/page.tsx            the builder. requireMember first, then <BuilderApp/>
app/tool/loading.tsx         the builder's own shape while that check runs
proxy.ts                     turns a cookie-less /tool request away before the page renders.
                             MUST pass lib/auth-cookies' prefix; without it every member loops
components/builder/          the control panel: rail, fields, KPI strip, preview frame, topbar
components/ui/               shadcn primitives, copied from wattup-frontend by hand
lib/proforma/                the engine (vendor, do not edit), plus sections, state, scenarios
lib/auth-cookies.ts          COOKIE_PREFIX, shared by lib/auth.ts and proxy.ts so they cannot drift
public/proforma/             the three brand assets the document embeds as data URLs
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
private/tool/                the calculator, source-identical bar the three exceptions above
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
