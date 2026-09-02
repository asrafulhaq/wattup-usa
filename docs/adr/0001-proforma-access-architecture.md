# ADR 0001 — WattUp Pro-Forma Builder: repo layout, access control and data

- **Status:** Proposed, awaiting sign-off on the items in §15
- **Date:** 2026-09-02
- **Supersedes parts of:** `docs/Pro-Forma Access.md` (PRD v1)
- **Related:** `docs/Pro-Forma Access (Bangla).md` (PRD walkthrough + defect list)

---

## 1. Context

The Site Pro-Forma Builder is a static, browser-only underwriting tool currently behind a
single shared password (`docs/Pro-Forma source/middleware.ts`). The PRD replaces that with
email + one-time code, checked against the team member list "in the wattupusa.com dashboard",
and specifies Vercel KV for codes, rate limits and an allowlist cache, plus an HTTP contract
for a member endpoint that "whoever owns the dashboard" would build.

Three facts, established by reading the code, change what the right design is:

1. **This repository *is* the wattupusa.com dashboard.** `prisma/schema.prisma` defines
   `model User { email, name, role: Role, banned, ... }` and `lib/auth.ts` runs Better Auth
   with the admin plugin over it. The "member list held in the dashboard" is this app's own
   `user` table. There is no other team, and no HTTP contract to wait on.
2. **The stack already has every dependency the PRD calls for**, except a key-value store:
   Better Auth 1.4.7, Prisma 7 on Postgres, Resend 6.12.3, Next 16.1.6, pnpm.
3. **Vercel KV no longer exists.** Vercel's docs: *"The Vercel Postgres and Vercel KV products
   have been deprecated and are no longer supported"*, with Upstash Redis named as the
   successor. The PRD's storage row and two of its required env vars describe a product that
   cannot be provisioned.

Confirmed requirements from the client, beyond the PRD:

- Two apps in one repository, `wattup-frontend` and `wattup-proforma`, each independently
  deployable, each able to be lifted out of the repo and still work.
- `wattup-proforma` is a Next.js app on the same stack, using Better Auth.
- **Both apps use the same database**, because the pro-forma sign-in log and activity log,
  including IP tracking, must be visible inside the wattup-dashboard.

---

## 2. Decision summary

| # | Decision | Headline |
|:--:|---|---|
| D1 | Repo layout | Two colocated standalone apps. **Not** a pnpm workspace. |
| D2 | Deployment | Two Vercel projects, distinct Root Directory, path-scoped build skipping. |
| D3 | Database | One Postgres, shared. `wattup-frontend` is the sole schema owner. |
| D4 | Identity | Better Auth `emailOTP`, shared `user` table, **separate session table**. |
| D5 | Anti-enumeration | Both public endpoints wrapped. Better Auth leaks by default. |
| D6 | Member directory | Read the `user` table directly. Allowlist API and 5-minute cache dropped. |
| D7 | Audit | Postgres `ActivityLog`, rendered in the dashboard. Not KV. |
| D8 | Rate limiting | Postgres-backed for v1. Redis optional, behind one interface. |
| D9 | Serving the tool | Static files live **outside** `public/`, served through a gated route. |
| D10 | Email | Resend on a send subdomain, own client instance, own templates. |
| D11 | Secrets | Independent secrets per app. No sharing of `BETTER_AUTH_SECRET`. |
| D12 | Verification | Automated tests for the enumeration and gating guarantees. |
| D13 | RBAC | Role defaults and per-user overrides move to the database. |
| D14 | Dashboard UI | User detail page; access gated by `ACCESS_PROFORMA`, resolved in a SQL view. |

---

## 3. D1 — Repository layout

### Decision

```
wattup/                          ← repo root, no package.json, no lockfile
├─ .github/workflows/            ← CI, path-filtered per app
├─ docs/                         ← cross-cutting docs (this ADR, the PRD)
├─ wattup-frontend/              ← the current app, moved wholesale
│  ├─ package.json
│  ├─ pnpm-lock.yaml             ← its own lockfile
│  ├─ pnpm-workspace.yaml        ← moved down from the root
│  └─ prisma/                    ← THE schema. Sole owner of migrations.
└─ wattup-proforma/              ← new Next.js app
   ├─ package.json
   ├─ pnpm-lock.yaml             ← its own lockfile
   └─ prisma/                    ← read-mostly mirror, no migrations
```

**Deliberately not a pnpm workspace.** No root `package.json`, no root lockfile, no
`packages:` key. Each app runs `pnpm install` in its own directory.

### Why

The stated requirement is *"even if I want to pick a project from this root repo, that have
to work independently and nothing of any application should break."* A pnpm workspace makes
that false: the lockfile lives at the root, hoisting is shared, and lifting a package out
leaves it without a resolvable dependency tree. Two colocated standalone apps satisfy the
requirement exactly. `git mv wattup-proforma /somewhere/else` produces a working repository.

### Consequences

- Duplicate `node_modules` and two lockfiles. On this scale, irrelevant.
- Dependency upgrades are done twice. Accepted; the apps have almost no overlap in intent
  and pinning them together would create the coupling we are avoiding.
- **No shared code package.** If the two apps ever need to share a type or a template, copy
  it and note the copy. Introducing a workspace later is possible but reverses this ADR.
- The existing root `pnpm-workspace.yaml` (`onlyBuiltDependencies` for Prisma, esbuild etc.)
  moves into `wattup-frontend/` unchanged, and `wattup-proforma` gets its own.

### Migration

`git mv` preserves history; `git log --follow` continues to work. In order:

1. `git mv` every tracked root entry into `wattup-frontend/`, except `.git`, `.github`
   and `docs/`.
2. Move `docs/Pro-Forma*` to the root `docs/`, since they describe the new app.
3. Update the existing Vercel project's **Root Directory** to `wattup-frontend` **before**
   pushing, or the next deploy builds an empty root and fails.
4. `.gitignore` paths that are absolute (`/node_modules`, `/.next/`, `/build`) must lose the
   leading slash or be duplicated per app, or they stop matching.
5. Scaffold `wattup-proforma` and commit it as a second, separate commit.

> The restructure is a mechanical change with a live deploy attached to it. Do it as its own
> PR with no behaviour changes, verify the frontend still deploys, then start the pro-forma
> work on top.

---

## 4. D2 — Deployment

### Decision

Two Vercel projects against the same GitHub repository:

| | wattup-frontend | wattup-proforma |
|---|---|---|
| Root Directory | `wattup-frontend` | `wattup-proforma` |
| Domain | `wattupusa.com`, `www` | `hostproposal.wattupusa.com` |
| Framework | Next.js | Next.js |
| Include files outside root | **off** | **off** |

Both projects set an **Ignored Build Step** so a push touching only the other app does not
trigger a rebuild:

```bash
git diff --quiet HEAD^ HEAD -- .
```

Vercel treats exit code 0 as "skip". Run from the project's own root directory, this rebuilds
only when that directory changed.

### Consequences

- The two apps genuinely never block each other. A broken pro-forma build cannot stop a
  marketing deploy.
- **Open question C in the PRD becomes load-bearing.** If the new project lives in a
  different Vercel account or team than the one holding `wattupusa.com`, Vercel requires a
  `_vercel` TXT record for domain-ownership verification, which is absent from the PRD's DNS
  table. Answer this before the DNS work, not alongside it.
- Preview deployments get per-deploy URLs. Whatever origin check we add (§8) must accept the
  request's own host, or previews become unusable.

---

## 5. D3 — Database

### Decision

**One Postgres instance, shared by both apps.** `wattup-frontend` owns the schema and is the
only app that runs migrations. `wattup-proforma` has its own Prisma schema containing only
the models it touches, and its `package.json` deliberately contains **no** `migrate` or
`db push` script.

Ownership, table by table:

| Table | Owner | Pro-forma's access |
|---|---|---|
| `user` | frontend | read only — this is the member list |
| `session`, `account`, `verification` | frontend | none |
| `proforma_session` | frontend (schema) | read/write |
| `proforma_verification` | frontend (schema) | read/write |
| `activity_log` | frontend (schema) | write; the dashboard reads |

### Why

The client's requirement settles it: the sign-in and activity log with IP tracking has to
appear inside the dashboard. A shared database makes that a `SELECT`. Two databases would
require replication or an API just to move audit rows back, which is more moving parts for
no benefit.

It also removes an entire subsystem the PRD specified. With the member list one query away,
there is no allowlist HTTP call, so there is no 300-second cache, no `generated_at` staleness
check, no 24-hour stale-serve policy, and no upstream-outage branch. **Revocation stops being
"within 5 minutes" and becomes immediate**, which is strictly better than the PRD promises.

### Consequences and the risk we are accepting

- **Schema coupling is real.** A migration in `wattup-frontend` that renames a column
  pro-forma reads will break pro-forma at runtime, and CI will not catch it because the apps
  build independently. Mitigations, all three:
  1. Pro-forma reads `user` through a **narrow Prisma model** listing only `id`, `email`,
     `name`, `role`, `banned`. Fewer columns, fewer ways to break.
  2. A CI job in `wattup-frontend` fails the build if a migration touches `user`,
     `activity_log` or the `proforma_*` tables without a matching note in the PR body. Cheap,
     and it makes the coupling visible at review time rather than at 2am.
  3. Pro-forma's smoke test (§13) hits a real database in CI.
- **Two Prisma clients, one database.** Both must be generated from schemas that agree.
  Pro-forma's schema is a hand-maintained subset; treat any drift as a defect.
- **Connection count.** Two Vercel apps on serverless functions against one Postgres will
  multiply connections. The frontend already uses `@prisma/adapter-pg`. Pro-forma must use a
  pooled connection string (PgBouncer/Neon pooler) from day one, not the direct URL.
- Extracting `wattup-proforma` from the repo still works: it needs `DATABASE_URL` and a
  member source, and §7 makes the member source swappable.

---

## 6. D4 — Identity: Better Auth with `emailOTP`

### Decision

Pro-forma runs its own Better Auth instance with the `emailOTP` plugin, over the **shared
`user` table** but its **own session and verification tables**.

```ts
// wattup-proforma/lib/auth.ts  (shape, not final code)
export const auth = betterAuth({
  appName: 'WattUp Pro-Forma',
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: false },   // pro-forma is OTP-only
  session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: true, maxAge: 60 * 5 } },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 600,             // PRD: 10 minutes. Plugin default is 300.
      allowedAttempts: 5,         // PRD: 5. Plugin default is 3.
      disableSignUp: true,        // users are created in the dashboard, never here
      storeOTP: 'hashed',         // PRD: never store the code. Plugin default is 'plain'.
      resendStrategy: 'rotate',
      async sendVerificationOTP({ email, otp, type }) { /* §7 + §10 */ },
    }),
    nextCookies(),
  ],
  advanced: { useSecureCookies: true, cookiePrefix: 'wup' },
});
```

**Four plugin defaults are wrong for this PRD and must be overridden**, which is the main
reason this decision is written down:

| Option | Default | Required | Why it matters |
|---|:--:|:--:|---|
| `storeOTP` | `'plain'` | `'hashed'` | PRD §5: *"Never store or log the code itself."* |
| `expiresIn` | 300 | 600 | PRD specifies a 10-minute code. |
| `allowedAttempts` | 3 | 5 | PRD specifies 5. |
| `disableSignUp` | `false` | `true` | Otherwise a sign-in **creates** a user row, and the allowlist means nothing. |

### Session isolation

Pro-forma's Better Auth maps `session` to **`proforma_session`**, not the shared `session`
table. Cookie prefix differs (`wup_` vs the frontend's default) and `BETTER_AUTH_SECRET`
differs (§11).

Reason: if both apps signed into the same `session` table with the same secret, a session
minted by a 6-digit code on the pro-forma subdomain would be a structurally valid dashboard
session. Today the browser would not send it cross-host, so nothing breaks — but that is a
property of cookie scoping, not of the token, and it silently becomes false the day anyone
enables `crossSubDomainCookies`. Separate tables make it false by construction.

### Consequences

- A dashboard user does **not** get automatic pro-forma access, and vice versa. Signing in
  twice is correct and intended.
- `disableSignUp: true` means an email must already exist in `user` before it can ever sign
  in. Adding a team member is a dashboard action. This is the desired workflow, and it is
  worth confirming with the client that they do not expect self-service.

---

## 7. D5 — Anti-enumeration wrapper (the one that will bite)

### Context

This is the PRD's headline security property: a non-member's response must be
indistinguishable from a member's in status, body **and timing**. Better Auth does not
provide that, by design. From `packages/better-auth/src/plugins/email-otp/routes.ts`:

```ts
const user = await ctx.context.internalAdapter.findUserByEmail(email);
if (!user) {
  /**
   * safe to leak the existence of a user, given the user has already the OTP from the
   * email
   */
  throw APIError.from("BAD_REQUEST", BASE_ERROR_CODES.USER_NOT_FOUND);
}
```

Better Auth's threat model assumes anyone reaching verification already holds a mailed code,
so leaking existence there costs nothing. **Our threat model is the opposite.** Wired up
as-is, submitting a non-member address and any 6 digits returns `USER_NOT_FOUND`, while a
member address returns `INVALID_OTP`. That is a working enumeration oracle, and it defeats
the single requirement the PRD cares most about.

### Decision

**Better Auth's OTP endpoints are never exposed to the browser.** `app/api/auth/[...all]`
is not mounted publicly for the OTP routes. Instead, two thin first-party routes call Better
Auth server-side and normalise everything the client can observe.

```
POST /api/gate/request-code   →  allowlist check → auth.api.sendVerificationOTP()
POST /api/gate/verify-code    →  auth.api.signInEmailOTP() → normalise all failures
```

**`/api/gate/request-code`**

1. Normalise the address: trim, lowercase.
2. Check rate limits (§9). On breach, fall through to step 6 having sent nothing.
3. Look up `user` by email. Absent, `banned`, or role not in the permitted set → fall
   through to step 6 having sent nothing.
4. Call `auth.api.sendVerificationOTP({ email, type: 'sign-in' })`.
5. **Send the email without awaiting it.** See timing, below.
6. Always return `200 { message: "If that address is on the team list, a code is on its way." }`.

**`/api/gate/verify-code`**

Every failure — wrong code, expired code, no code ever issued, attempts exhausted, member
removed between request and verify — returns **one identical response**:
`400 { message: "That code is not valid." }`. `USER_NOT_FOUND`, `TOO_MANY_ATTEMPTS` and
`INVALID_OTP` are all collapsed into it. The distinction is logged server-side, never
returned.

Success re-checks the allowlist before the session is issued, so an account banned in the
30 seconds between request and verify cannot complete sign-in.

### Timing

Status and body being equal is not sufficient and the PRD's own wording ("timing envelope
identical") admits it. The member path performs a database write and an HTTPS call to
Resend; the non-member path returns immediately. The gap is hundreds of milliseconds and
trivially measurable.

**Decision: respond first, send after.** The route returns its generic 200, and the Resend
call runs in `after()` (Next.js 16's `unstable_after` successor, stable in 15.1+) so it never
sits on the response path. Both branches then do the same amount of work before responding:
one indexed `user` lookup, plus one OTP insert on the member branch.

The residual difference is a single Postgres insert, low single-digit milliseconds, against
network jitter of tens of milliseconds. That is a defensible envelope. Perfect equality would
require padding both paths to a fixed floor, which we are explicitly **not** doing because it
slows every real sign-in to hide a difference already buried in noise. This trade-off is
recorded here so it is a decision rather than an oversight.

### Consequences

- A non-member sits on the code screen forever. **That is the specified behaviour.** The
  screen copy must not imply a code is definitely coming.
- Better Auth's own error codes never reach the client, which makes debugging sign-in
  failures a server-log exercise. Log the real reason with a correlation id and show the id
  on the generic screen.
- If Better Auth changes its OTP route internals, our wrapper is what protects us. Pin the
  version and treat a `better-auth` bump as a change requiring the §13 enumeration test to
  re-run.

---

## 8. D6 — Member directory

### Decision

One interface, three implementations, chosen by environment:

```ts
interface MemberDirectory {
  lookup(email: string): Promise<{ email: string; name: string; active: boolean } | null>;
}
```

| Implementation | When | Use |
|---|---|---|
| `EnvMemberDirectory` | `PROFORMA_ALLOWLIST` set | local dev, and a break-glass fallback |
| `DbMemberDirectory` | default | **production**: `SELECT` on `user` |
| `HttpMemberDirectory` | `ALLOWLIST_API_URL` set | only if the apps are ever split apart |

`DbMemberDirectory` is the production path:

```sql
SELECT id, email, name, role, banned FROM "user" WHERE lower(email) = $1
-- active := banned IS NOT TRUE AND role IN (<permitted roles>)
```

### Why

The PRD's Phase 1 / Phase 2 split existed to avoid blocking on another team. That team is us
and the data is one query away, so **Phase 2 is done before Phase 1 starts**. The interface is
kept anyway because it costs about twenty lines and it is what makes D3's coupling reversible:
if the apps are ever separated, flip to `HttpMemberDirectory` and build the PRD's endpoint
then.

### Superseded by D14

An earlier draft of this decision asked the client which *roles* may open the builder.
**D13 and D14 answer it better:** access is a permission, `ACCESS_PROFORMA`, so an admin
grants or revokes it per person without changing anyone's role. `DbMemberDirectory` reads the
`proforma_member` SQL view described in §18 rather than applying a role allowlist of its own.

---

## 9. D7 — Audit log

### Decision

A Postgres table, written by pro-forma, read by the dashboard.

```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  app       String                    // 'proforma' | 'dashboard'
  event     String                    // 'signin.success' | 'signin.failed' | 'code.requested'
  email     String                    // stored in full — see below
  userId    String?
  ipAddress String?
  userAgent String?
  meta      Json?
  createdAt DateTime @default(now())

  @@index([app, createdAt])
  @@index([email, createdAt])
  @@map("activity_log")
}
```

Plus a dashboard page under `/dashboard` listing it, filterable by app, event and date,
visible to `SUPER_ADMIN` and `ADMIN`.

### Resolving the PRD's contradiction

The PRD says logs hash or truncate email addresses, and then specifies a sign-in log holding
"email, time, IP, user agent". Both cannot hold, and the client's requirement — the log must
be *readable in the dashboard* — decides it: **email is stored in full in `activity_log`.**

The hashing rule still applies, narrowed to where it was actually aimed: **application logs
and error traces**, which are read by developers and shipped to third-party log sinks. There,
emails are truncated and codes never appear at all.

Retention is 90 days, enforced by a scheduled purge, not by a TTL. This is personal data
(email + IP + user agent); §15 asks the client to confirm the retention period and who may
read the page.

### Consequences

- The PRD's `signin:{date}` KV key is dropped, and with it the read-modify-write race that
  design had — concurrent sign-ins would have overwritten each other's entries. Postgres rows
  do not race.
- **This is new scope inside `wattup-frontend`**: a model, a migration, a page, and a
  permission. It is not in the PRD, and it follows directly from the client's requirement.

---

## 10. D8 — Rate limiting, and the Upstash question

### Decision

**v1 ships with no Redis.** Better Auth's built-in rate limiter with `storage: "database"`
covers per-IP and per-path limits. The two PRD limits it does not express — 5 code requests
per email per hour, and a 60-second gap between sends to one address — are a small amount of
our own code against a Postgres table.

Redis stays available behind the same interface. Better Auth ships a documented
`SecondaryStorage` contract and an official `@better-auth/redis-storage` adapter, so adopting
Upstash later is a config change:

```ts
rateLimit: { storage: 'secondary-storage' },
secondaryStorage: redisStorage({ client: redis }),
```

### Answering "can we use Upstash, and what if the free tier fills up?"

Yes, it works. The failure mode is the reason not to depend on it yet.

Upstash's free plan: **10,000 commands per day, one database per account, 10 MB max request
size.** From their docs: *"Exceeding the request limit on a Free Database (10,000 requests per
day) will cause the exceeding commands to return an exception."* It throws; it does not queue
or degrade.

The danger is the interaction with the PRD's "fail closed" rule. The PRD also says every
gated request re-checks the member list. Take both literally with Redis behind them and one
page load of the tool costs roughly five round trips — `index.html` pulls four JS files and a
stylesheet — so ~2,000 page loads exhausts the daily quota, after which every command throws,
fail-closed turns those throws into 503s, and **the entire team is locked out until the quota
resets at midnight UTC.** A rate limiter designed to stop attackers takes the team down
instead.

Three rules follow, and they hold whether or not we adopt Redis:

1. **Keep the hot path off the key-value store.** Sessions, OTPs and the member lookup all
   live in Postgres, which has no daily command cap. This alone drops usage from ~5 commands
   per page load to ~2 per sign-in attempt — a few hundred commands a day for a team this
   size, comfortably inside even the free tier.
2. **Fail closed on identity, fail *open* on rate limiting.** These are different classes of
   check. If the member lookup cannot be performed, deny — that is the access decision. If the
   *rate limiter* is unreachable or quota-exhausted, log loudly, alert, fall back to an
   in-process limiter, and let the request through. Rate limiting is defence in depth; the
   OTP itself is still 6 random digits with 5 attempts and a 10-minute life. **This is a
   deliberate, documented deviation from the PRD's blanket "fail closed".**
3. **If Redis is adopted, put it on pay-as-you-go, not free.** There is no daily cap, pricing
   is per-command at a fraction of a cent per thousand, and this workload would cost roughly
   nothing per month. Paying removes the entire failure class described above. Set a spend
   alert anyway.

### Consequences

- One less managed service, one less pair of secrets, one less thing to be down at launch.
- Postgres-backed rate limiting means writes to the primary on failed sign-in attempts. At
  this scale that is noise; at a scale where it is not, switch on `secondary-storage`.

---

## 11. D9 — Serving the tool's static files

### Decision

`model.js`, `doc.js`, `evpin.js`, `app.js`, `app.css`, `index.html` and the brand SVGs are
placed in `wattup-proforma/private/tool/` — **not** in `public/` — and served by an
authenticated route handler:

```
app/(tool)/tool/[[...path]]/route.ts   →  session check → stream from private/tool/
```

`public/` holds only the two files the login screen needs before sign-in: the wordmark and
the favicon.

### Why

The PRD's model is a matcher that lists what to *exclude* from gating. The PRD itself flags
what happens when it is wrong: *"middleware.ts stays at the repository root, since nested it
does not execute and the whole site serves open."* A file outside `public/` has no URL of its
own. Nothing Next.js does, and no matcher mistake, can serve it. The acceptance test "a direct
request for `js/model.js` returns no JavaScript" passes structurally rather than by
configuration.

This also makes the guarantee survive refactors. A future contributor editing `proxy.ts` can
break a matcher. They cannot accidentally give a non-`public/` file a route.

### Consequences and the gotcha

- **Vercel will not bundle `private/tool/` unless told to.** `next.config.ts` needs:
  ```ts
  outputFileTracingIncludes: { '/tool/[[...path]]': ['./private/tool/**/*'] }
  ```
  Omit this and the route 404s in production while working perfectly in dev. Put it in the
  first commit and verify on a preview deploy, not at cutover.
- Files are served by a function, not the CDN. Correct caching is
  `Cache-Control: private, no-store` anyway, which is what we want for gated content, so
  little is lost. Roughly 90 KB per cold load for an internal tool with a few dozen users.
- The tool's own relative paths (`js/model.js?v=9`, `css/app.css?v=9`) keep working, because
  the route serves them under one base path.
- Content-Type must be set from the file extension by hand. A short map; get `.js`, `.css`,
  `.svg`, `.html` right and reject anything else.

### The one interface change

The PRD asserts nothing in the UI changes. That is not quite true, and it is one line:
`index.html:31` is `<a href="/__logout">Sign out</a>` — a GET link at the old gate's path.
It becomes a `POST` to the Better Auth sign-out route. The adjacent inline script that reveals
the link on `*.wattupusa.com` hostnames keeps working on `hostproposal.wattupusa.com`
unchanged.

Everything else the PRD promises holds: `model.js`, `doc.js`, `evpin.js` and `app.js` are
byte-identical.

---

## 12. D10, D11 — Email and secrets

### D10 — Email

Pro-forma gets its **own** Resend client and templates rather than importing
`wattup-frontend/lib/email.ts`, per D1's no-shared-code rule. The file is 30 lines; copying
it is cheaper than the coupling.

- Send from a **subdomain** (`send.wattupusa.com`), never the apex. This is required, not
  preferred: only one SPF record is permitted per domain and an apex SPF does not cover
  subdomains, so a subdomain keeps company email's SPF untouched.
- **Take the DNS records from the Resend dashboard verbatim.** Do not copy record *types*
  from the PRD table: it lists DKIM as a `TXT` at `resend._domainkey.send`, while Resend's
  current domain API returns DKIM as **three CNAME records**
  (`<selector>._domainkey` → `<selector>.dkim.amazonses.com`). The MX and SPF rows in the PRD
  are correct as written.
- The OTP email carries the six digits as selectable text, the 10-minute expiry, and an
  "ignore this if you did not request it" line. HTML and plain-text parts both.
- `Reply-To` is a monitored inbox. Needs a value — §15.

### D11 — Secrets

Each app has its own. Nothing is shared, including and especially the auth secret.

| Variable | frontend | pro-forma |
|---|:--:|:--:|
| `DATABASE_URL` | ✅ direct | ✅ **pooled** |
| `BETTER_AUTH_SECRET` | ✅ | ✅ **different value** |
| `BETTER_AUTH_URL` | wattupusa.com | hostproposal.wattupusa.com |
| `RESEND_API_KEY` | ✅ | ✅ separate key, so it can be revoked alone |
| `MAIL_FROM` / `MAIL_REPLY_TO` | ✅ | ✅ send subdomain |
| `PROFORMA_ALLOWLIST` | — | fallback only |
| `PROFORMA_ALLOWED_ROLES` | — | ✅ (§15) |

Rotating pro-forma's `BETTER_AUTH_SECRET` invalidates every pro-forma session at once and
touches nothing in the dashboard. That is the break-glass path, and separating the secrets is
what keeps it from also signing out the whole marketing team.

Missing required variables must produce a 503 with a plain-text reason, matching the current
gate's fail-closed behaviour. Vercel bakes variables at build time, so set them **before**
the first deploy or redeploy after.

---

## 13. D12 — Verification

The acceptance list in the PRD is sound but mostly manual. These four become automated tests,
because they are the properties most likely to regress silently:

1. **Enumeration.** `request-code` and `verify-code` return byte-identical bodies and equal
   status for a member address and a non-member address. Runs against a seeded test database.
2. **Gating.** A request for the tool's `model.js` without a session returns no JavaScript.
3. **Revocation.** Ban a user, then assert their existing session is refused on the next
   request.
4. **Attempts and expiry.** The fifth wrong code invalidates; a code past 600 seconds fails;
   a used code cannot be reused.

Manual, at cutover: code delivery under 30 seconds, DNS and certificate issuance, the
dark-themed email rendering in Gmail and Outlook, and the dashboard activity page.

Two PRD acceptance items are **not** build gates and should be moved to a post-launch check:
"absent from Google's index two weeks after launch" (depends on Google, and is trivially true
for an unlinked site) and "members receive a code within 30 seconds" (depends on Resend and
the recipient's mail server).

---

## 14. Delivery plan

Phased so nothing waits on DNS, and the risky work happens first.

| Phase | Work | Depends on |
|:--:|---|---|
| **0** | Repo restructure. `git mv`, Vercel Root Directory, `.gitignore` paths. No behaviour change, own PR. | — |
| **1** | Scaffold `wattup-proforma`: Next 16, Prisma subset schema, Better Auth skeleton, pooled `DATABASE_URL`. Deploys to a `.vercel.app` URL. | 0 |
| **2** | **The gate.** `MemberDirectory`, the two wrapped routes (§7), the two-step login screen, OTP email. Verified with `PROFORMA_ALLOWLIST` before touching the `user` table. | 1 |
| **3** | Mount the tool: `private/tool/`, gated route, `outputFileTracingIncludes`, the sign-out one-liner. Full tool working behind the gate on the preview URL. | 2 |
| **4a** | **`wattup-frontend` RBAC (D13).** `role_permission` + `user_permission` tables, seed migration from the current map, `ACCESS_PROFORMA` / `VIEW_ACTIVITY_LOG` / `MANAGE_PERMISSIONS`, new roles with explicit ranks, and the 27 call sites moved to a resolved `PermissionSet`. | — (independent of pro-forma) |
| **4b** | `ActivityLog` model, the `proforma_member` view, `DbMemberDirectory` in pro-forma, and `activity_log` writes from both apps. | 2, 3, 4a |
| **4c** | **Dashboard UI (D14).** User detail page with role, permission provenance and toggles, activity and sign-in history. Role and own permissions on the profile page. | 4a, 4b |
| **5** | Rate limits, origin checks, `noindex` / `no-store` headers, `robots.txt`, the §13 test suite. | 2 |
| **6** | Cutover: DNS, Resend domain, production env vars, acceptance run. Retire the shared-password build and delete `SITE_PASSWORD` and its code path entirely. | all + §15 |

Phase **4a is the largest single piece of work in this plan** and it is entirely inside
`wattup-frontend`. It touches 27 existing call sites and changes an authorisation primitive,
so it wants its own PR and its own review. It does not block phases 1–3, and phases 1–3 do not
block it, so the two tracks can run in parallel if there is more than one pair of hands.

**Phase 2 is the risky one** and it is deliberately early. The enumeration wrapper is where
this build is most likely to be quietly wrong, and it is testable long before DNS exists.

Phases 0–5 need no DNS and no client answers except §15's role question (needed by phase 4).

---

## 15. Open — needs an answer before the phase noted

| | Question | Blocks |
|:--:|---|:--:|
| A | **Subdomain spelling.** `DEPLOY.md:3` and the README say `hlproposal`; the PRD and the client say `hostproposal`. Confirm in writing before the DNS record goes in. If `hostproposal` wins, both source docs need updating — no code changes, as the login screen uses absolute `/assets/` paths. | 6 |
| B | **Which Vercel account owns the pro-forma project?** If it differs from the one holding `wattupusa.com`, a `_vercel` TXT verification record is needed that the PRD's DNS table omits. | 6 |
| C | **Which new roles, and what are their defaults?** D13 adds roles by migration. Need the names, their rank in the hierarchy, and which permissions each starts with. | 4a |
| D | **`Reply-To` address** for code emails. Must be a monitored inbox, not no-reply. | 6 |
| E | **Activity log retention and audience.** 90 days proposed; `VIEW_ACTIVITY_LOG` proposed as the gate. Stores email + IP + user agent. | 4b |
| F | **Are pro-forma users ever self-service?** `disableSignUp: true` means an address must exist in the dashboard first. Assumed correct. | 2 |
| G | **Which roles hold `ACCESS_PROFORMA` by default?** Per-user grants work regardless; this only sets the starting point for each role. | 4a |

---

## 16. What this ADR changes about the PRD

Kept, unchanged: the OTP flow shape, the generic response, fail-closed on missing config, the
constant-time comparisons, the `safeNext` redirect check, session re-validation on every gated
request, the send-subdomain requirement, and the security posture generally.

Changed, with the reason:

| PRD said | This ADR says | Why |
|---|---|---|
| Vercel KV | Postgres, Redis optional | Vercel KV is deprecated and cannot be provisioned. |
| Dashboard exposes an authenticated GET | Read the `user` table | The dashboard is this repo. |
| Allowlist cached 300s, stale-serve 24h | No cache | No HTTP hop to cache. |
| Revocation within 5 minutes | Immediate | Same reason. |
| `signin:{date}` append-only KV key | `activity_log` table | KV appends race; the client needs it in the dashboard. |
| Emails hashed in all logs | Full email in `activity_log`, hashed in app logs | The audit page has to be readable. |
| Blanket fail closed | Fail closed on identity, fail open on rate limiting | Quota exhaustion must not lock out the team. |
| No interface change | One line: the sign-out link | `index.html:31` points at the old gate. |
| Static files gated by matcher | Files outside `public/` | Removes the "matcher wrong, site open" failure mode. |
| Phase 1 env list, Phase 2 API | Phase 2 first; env list is dev/fallback | The data is already local. |
| Flat member list, `active` bool | `ACCESS_PROFORMA` permission via a SQL view | Client requires per-user permission control. |

Added beyond the PRD, at the client's request, all inside `wattup-frontend`: database-backed
role defaults and per-user permission overrides (§17), a user detail page with permission
provenance and sign-in history (§18), and the signed-in user's own role on their profile page.
**This is real scope the PRD does not mention and does not cost.** Phase 4a in §14 is where it
lands, and it is the largest item in the plan.

---

## 17. D13 — Per-user permissions in the dashboard

### Context

The client requires, in `wattup-frontend`:

- additional roles beyond the current four,
- a permission setup screen where an admin can **grant or remove a permission on an
  individual user**,
- a user detail page showing that user's role, permissions, activity and login history,
- the signed-in user's own role visible on their profile page.

Today permissions are **derived from role by a hardcoded map**. `lib/permissions.ts` holds
`ROLE_PERMISSIONS: Record<Role, Permission[]>` and a pure, synchronous
`hasPermission(role, permission)`. There is no per-user storage, so an admin cannot grant one
person a single extra capability without promoting them to a whole role. There are **27 call
sites across 22 files**, funnelled largely through `app/_actions/permission-guard.ts`.

### Decision

Move the mapping into the database, keep the enum as the type-safe registry of names.

```prisma
model RolePermission {          // role → default permissions. Editable by SUPER_ADMIN.
  role       Role
  permission Permission
  @@id([role, permission])
  @@map("role_permission")
}

model UserPermission {          // per-user override on top of the role default
  userId     String
  permission Permission
  granted    Boolean            // true = grant, false = revoke
  grantedBy  String
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@id([userId, permission])
  @@map("user_permission")
}
```

**Effective permissions = `role_permission[user.role]` − revokes + grants.**

Three new permissions are added to the enum, and they carry the rest of this ADR:

| Permission | Governs |
|---|---|
| `ACCESS_PROFORMA` | May sign in to the pro-forma builder. **Replaces the role allowlist.** |
| `VIEW_ACTIVITY_LOG` | May read the activity and login log (§9, §18). |
| `MANAGE_PERMISSIONS` | May edit role defaults and per-user overrides. `SUPER_ADMIN` only. |

`Role` stays a **Prisma enum**, and new roles are added to it by migration rather than created
at runtime. This is deliberate: `lib/auth.ts` configures Better Auth's admin plugin with a
static `createAccessControl` map (`roles: { SUPER_ADMIN: superAdminAc, ... }`), and runtime-created
roles would have no entry there, so `admin` plugin calls would silently fail for them. Adding a
role is a two-line change in two files plus a seed row; that is cheap enough to not warrant a
dynamic role system. **The "customisable" part of the requirement is satisfied by
`role_permission` and `user_permission` being editable, not by roles being creatable.**

### The boundary between the two permission systems

There are now two, and they must not be conflated:

| System | Governs | Source of truth |
|---|---|---|
| Better Auth `createAccessControl` in `lib/auth.ts` | Better Auth's own admin endpoints — user CRUD, ban, impersonate, session revoke | static config |
| `Permission` enum + `role_permission` + `user_permission` | everything the application itself gates | database |

They overlap on user management, and they will drift. **Rule: Better Auth's AC is not edited
by the permission UI and is not shown to admins.** It is plumbing for the admin plugin. The
application's own guard is the one the UI reflects and the one that gates every server action.
If an admin grants `EDIT_USERS`, that governs our actions; the Better Auth admin plugin still
consults its own static map for its own routes.

### The cost, stated plainly

`hasPermission(role, permission)` is currently **synchronous and pure**. Overrides make the
answer user-specific and database-backed. Rewriting 27 call sites to `await` is the obvious
path and the wrong one — it puts a query behind every render.

Instead: **resolve once per request, pass a set down.**

```ts
// resolved at the session boundary, once
const perms: PermissionSet = await getEffectivePermissions(session.user.id);

// unchanged in shape at all 27 call sites — still sync, still pure
hasPermission(perms, Permission.MANAGE_LOCATIONS);
```

`hasPermission` keeps its name and its synchronous signature; only its first argument changes
from `role` to a resolved set. That makes the migration mechanical rather than architectural.

**Caching and the revocation delay.** Better Auth's session `cookieCache` is already enabled at
5 minutes in `lib/auth.ts`. Caching permissions there is fine **for UI affordances** — a button
staying visible for a few minutes after a permission is revoked is cosmetic. It is not fine as
an authorisation decision. Therefore:

- UI rendering may read cached permissions.
- **Every server action, and the pro-forma gate, resolves fresh.** `app/_actions/permission-guard.ts`
  is the single place this is enforced, which is why it is the right shape already.

### Consequences

- Seed migration required: populate `role_permission` from the existing `ROLE_PERMISSIONS`
  map so behaviour is identical on day one. The map then stops being the source of truth and
  becomes the seed. Keep it in the file, renamed `DEFAULT_ROLE_PERMISSIONS`, and comment that
  it is seed data only.
- `canManageRole()`'s hierarchy array (`COLLABORATOR < EDITOR < ADMIN < SUPER_ADMIN`) is
  positional. **New roles must be inserted at the right index**, or privilege comparisons
  silently misjudge. Give each role an explicit numeric rank instead of relying on array
  position.
- An admin can now revoke a permission from a `SUPER_ADMIN`. Guard: `SUPER_ADMIN` overrides
  are refused, and a user may never edit their own permissions.
- Every permission change is itself an auditable event, written to `activity_log` (§9) with
  the actor, the target, the permission and the direction.

---

## 18. D14 — User detail page, and the pro-forma access check

### The user detail page

`app/(dashboard)/dashboard/users/page.tsx` exists and lists users. There is **no detail
route**. Adding `app/(dashboard)/dashboard/users/[id]/page.tsx`, reachable by clicking a row:

| Section | Contents | Gated by |
|---|---|---|
| Identity | name, email, avatar, created, banned state | `VIEW_USERS` |
| Role | current role, with the change control | `CHANGE_USER_ROLE` |
| Permissions | effective set, each marked *from role* / *granted* / *revoked*, with toggles | `MANAGE_PERMISSIONS` |
| Activity | `activity_log` for this user, both apps, paginated | `VIEW_ACTIVITY_LOG` |
| Sign-in history | login events with IP and user agent, from the same table | `VIEW_ACTIVITY_LOG` |

The permission section must show **provenance**, not just the effective set. An admin looking
at a user needs to see that `MANAGE_LOCATIONS` is present *because they are an EDITOR* versus
*because someone granted it specifically*, or the toggles are unpredictable.

The activity and sign-in sections are the same `activity_log` table from §9 filtered by
`userId`, which is why that model carries `app`, `event`, `ipAddress` and `userAgent`. This is
the requirement that made a shared database the right call in D3: the pro-forma app writes
these rows, and this page renders them.

### The profile page

`app/(dashboard)/dashboard/profile/page.tsx` and
`components/dashboard/profile/page-content.tsx` already exist and already import from
`lib/permissions.ts`. The change is additive and small: show the signed-in user's **own role**,
using the existing `ROLE_LABELS` and `ROLE_BADGE_CLASSES` helpers, and list their own effective
permissions read-only. No editing from the profile page — that is the admin's user detail page.

### How pro-forma checks access — replacing D6's role list

D6 asked which roles may open the builder. **That question is now obsolete and the answer is
better:** access is the `ACCESS_PROFORMA` permission. An admin grants one person access
without promoting them, and revokes it without demoting them, which is exactly the capability
the client asked for.

This creates one problem worth solving carefully. Effective permissions are
*role defaults − revokes + grants*, and D1 forbids a shared code package. Copying that
resolution logic into `wattup-proforma` would duplicate a **security decision** in two places
that can drift — a materially worse kind of duplication than the 30-line email helper in D10.

**Decision: resolve it in SQL, in a view owned by `wattup-frontend`.**

```sql
CREATE VIEW proforma_member AS
SELECT u.id, u.email, u.name, u.role,
       (u.banned IS NOT TRUE) AS active
FROM "user" u
WHERE (u.banned IS NOT TRUE)
  AND (
        EXISTS (SELECT 1 FROM user_permission up
                 WHERE up."userId" = u.id
                   AND up.permission = 'ACCESS_PROFORMA' AND up.granted)
     OR (EXISTS (SELECT 1 FROM role_permission rp
                  WHERE rp.role = u.role AND rp.permission = 'ACCESS_PROFORMA')
         AND NOT EXISTS (SELECT 1 FROM user_permission up
                          WHERE up."userId" = u.id
                            AND up.permission = 'ACCESS_PROFORMA' AND NOT up.granted))
      );
```

`DbMemberDirectory` (§8) becomes a single lookup against that view:

```sql
SELECT id, email, name, active FROM proforma_member WHERE lower(email) = $1
```

- **One definition of who may sign in**, in the database, owned by the app that owns the
  schema. No logic duplicated across apps.
- Pro-forma's Prisma schema maps a read-only model to the view and never migrates it, which is
  consistent with D3.
- Revocation stays immediate: unticking the permission changes what the view returns on the
  very next request.
- The view is part of the migration that introduces the tables, and it is covered by the D3 CI
  guard, so a frontend change that breaks it is caught at review.
