# Authentication and authorisation audit — `wattup-frontend`

Scope: all 31 routes, all 10 server-action modules (54 exported actions), `proxy.ts`, and the
data-access layer in `lib/`. Found while planning the pro-forma work; **none of it depends on
that work, and F1 and F2 are live on production now.**

| # | Finding | Severity | Fix in |
|:--:|---|:--:|:--:|
| F1 | Unauthenticated file upload **and deletion** | **Critical** | ✅ merged (S.1) |
| F8 | `next` and `better-auth` carry a critical + 20 high advisories | **Critical** | ✅ merged (S.2) |
| F2 | Unauthenticated disclosure of unpublished articles | **High** | ✅ merged (S.3) |
| F9 | No custom rate limits; reset endpoints at the generic rate | **High** | ✅ merged (S.4) |
| F14 | Forgot/reset forms bypass the limiter via server actions | **High** | ✅ merged (S.4.4) |
| F13 | Seed script re-creates an unremovable SUPER_ADMIN on every build | **High** | ✅ merged (S.5.1); deploy check S.5.5 open |
| F15 | F8 regression: Better Auth 1.7 needs `account.issuer`; every account insert on main was refused | **High** | ✅ merged + migrated (S.2.8) |
| F3 | Six permissions defined but never enforced | Medium | 4a |
| F4 | Site-wide script injection gated only by role, and only at the page | Medium | 4a |
| F10 | Public sign-up blocked by a fragile path-string hook | Medium | 4a |
| F5 | `updateUserInformationById` upserts arbitrary profile rows | Low | 4a |
| F11 | CSP depends on `'unsafe-inline'` | Low, accepted | backlog |
| F12 | Cloudinary API key exposed to the browser unnecessarily | Low | ✅ merged (B.3) |
| F16 | Dashboard cookie cache keeps a captured session readable for up to 5 min after sign-out or ban | Low | backlog (B.15) |
| F6 | Hand-rolled scrypt verification in `updateEmail` | Low | ✅ merged (B.4) |
| F7 | Public contact forms have no rate limiting | Low | ✅ merged (B.6) |

### A note on how server actions are exposed

A `'use server'` export is a callable HTTP endpoint, not an internal function. Its action id is
a build-time hash, present in the client bundle for any action a client component references,
so it is discoverable rather than secret. Next.js's own guidance is that **every server action
must authorise itself**. Where a finding below rests on this, it is noted — F1's REST route is
the one case that needs no such preparation at all.

---

## F1 — Unauthenticated file upload and deletion · **Critical**

**`app/api/upload-image/route.ts`** is 27 lines and contains no session check, no permission
check and no origin check:

```ts
export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "tiptap";
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const result = await uploadSingleImage(file, { folder });
```

This is a plain REST route. It needs no action id and no prior knowledge — a single `curl`
reaches it.

**`app/_actions/image-actions.ts`** is worse in scope: six exports, **zero** guard calls
between them, and they are not all uploads.

| Export | Effect if called by a stranger |
|---|---|
| `uploadSingleImage`, `uploadMultipleImage` | arbitrary files into WattUp's Cloudinary |
| `deleteImages`, `deleteSingleImage` | **destroys existing media** — site images vanish |
| `moveImage` | relocates assets, breaking live URLs |
| `cleanupOldDrafts(hours)` | caller controls `hours`; a large value widens the delete window |

**Impact.** Arbitrary content hosted under WattUp's CDN domain, storage and bandwidth cost
abuse, and destructive deletion of production media. The `folder` parameter is caller-supplied
and unvalidated, so uploads can be placed anywhere in the account.

**Fix.** Session check plus `UPLOAD_MEDIA` / `DELETE_MEDIA` on every one of the seven entry
points, an origin check on the route, and a whitelist for `folder`. Until phase 4a exists,
gate on an authenticated session and tighten to the permission afterwards.

**Also do.** Review the Cloudinary account for files uploaded by anyone outside the team.

> **Status after review (2 Sep): fixed and merged**, in two commits. The second closed a vector
> the first left open: the server actions forwarded caller-supplied `publicId` with
> `overwrite: true` to Cloudinary, so any signed-in user could **replace the live homepage hero
> in place** with no database write. Actions now build a fresh `{ folder }` and forward nothing
> else. Two corrections to the text above: `cleanupOldDrafts` only ever logged and never called
> Cloudinary, so the `hours` widening was not a real exposure; and `deleteImages` /
> `deleteSingleImage` still accept **any** id from any signed-in user — that needs a media
> ownership model and is tracked as S.1.10 → phase 4a.

---

## F2 — Unauthenticated disclosure of unpublished articles · **High**

Four read actions in `app/_actions/postActions.ts` have no auth check **and no publication
filter**:

```ts
export async function getArticles(page = 1, pageSize = 10, status?: string) {
    const where: any = {};
    if (status) { where.status = status; }        // empty unless the CALLER asks
    const articles = await prisma.posts.findMany({ skip, take: pageSize, where });
```

`getArticles`, `getPaginatedArticles`, `getArticleById` and `getArticleBySlug` all return rows
regardless of status. Calling `getArticles(1, 100)` with no status returns **every post,
drafts included**. `getArticleBySlug` returns a draft to anyone who knows or guesses its slug.

That this is an oversight rather than a decision is visible two hundred lines further down —
`searchArticles` hardcodes the filter:

```ts
where: { OR: [...], status: 'Published' },
```

**Impact.** Unpublished press releases are readable outside the company. For an EV
infrastructure business those are unannounced partnerships, funding events and site launches:
market-sensitive, and embargoed for a reason.

**Contrast with locations, which are done correctly.** `lib/locations/server.ts` filters at the
data layer and says why: *"Unpublished sites are excluded here rather than filtered by the
caller."* That is the pattern the article reads should follow.

**Fix.** Default to `status: 'Published'` inside each read. Returning drafts requires a session
holding a post permission, and the caller must not be able to widen the scope by passing a
`status` argument.

---

## F3 — Six permissions defined but never enforced · Medium

`CREATE_POST`, `EDIT_OWN_POST`, `EDIT_ANY_POST`, `DELETE_OWN_POST`, `DELETE_ANY_POST` and
`PUBLISH_POST` are declared in the `Permission` enum, assigned in `ROLE_PERMISSIONS`, and
**checked nowhere**. `postActions.ts` calls `sessionWith` zero times; every write action gates
on `getAdminSession()`, which admits only `ADMIN` and `SUPER_ADMIN`.

Two consequences, in opposite directions:

- **The permission map lies.** An `EDITOR` holds `PUBLISH_POST` and cannot publish. The
  dashboard renders controls that fail.
- **Ownership cannot currently be checked at all.** `Posts.author` is a free-text `String`
  (`author String? @default("")`) with **no `authorId` and no relation to `User`**. So
  `EDIT_OWN_POST` is not one comparison away — it needs a schema migration adding an `authorId`
  relation plus a backfill of existing rows, which for free-text author names may not be
  mechanically resolvable. Until that exists, `EDIT_OWN_POST` and `EDIT_ANY_POST` are the same
  permission wearing two names.

**Fix.** Phase 4a.13 and 4a.14. This is not a privilege escalation today — the role gate is
stricter than the permission map — but it becomes one the moment the map is trusted without
the ownership check.

---

## F4 — Site-wide script injection gated only by role · Medium

`SiteSettings` carries `headScripts`, `bodyStartScripts` and `bodyEndScripts`, described in the
schema as *"Custom Script Injection (raw HTML)"*. Whoever can write those fields can execute
arbitrary JavaScript on **every page of the public marketing site**, including whatever a
visitor types into the contact forms.

`app/(dashboard)/dashboard/settings/page.tsx` checks `MANAGE_SITE_SETTINGS`, but the page check
is presentation. The action behind it, `settingsActions.updateSiteSettings`, gates on
`getAdminSession()` — so enforcement is by role, and the permission is decorative.

**Impact.** This is the highest-consequence capability in the dashboard. Today it is confined
to `ADMIN` and above by accident of the role gate, which is roughly the right audience; the
problem is that it is not the *stated* rule, so a future permission grant would not actually
widen or narrow it, and nothing records who changed it.

**Fix.** Gate the action on `MANAGE_SITE_SETTINGS`. **Recommend narrowing that permission to
`SUPER_ADMIN`** in the ADR 0002 §6 matrix — arbitrary script injection sits alongside
`MANAGE_PERMISSIONS` in blast radius, and an `ADMIN` who needs it can be granted it
individually. Write every change to `activity_log` with a diff of which script field changed.

---

## F5 — `updateUserInformationById` upserts arbitrary profile rows · Low

```ts
const profile = await prisma.profile.upsert({
    where: { id: id || 'default-profile-id' },
    update: updatePayload,
    create: { id: id || 'default-profile-id', ... },
});
```

Admin-gated, so not reachable by an ordinary user. But the caller supplies `id`, there is no
check that it corresponds to anything, and the `create` branch means a mistyped or invented id
silently produces a **new** profile row rather than failing. The `|| 'default-profile-id'`
fallback means an omitted id writes to a shared magic row.

**Fix.** Require a real id, drop the fallback, and use `update` rather than `upsert` unless
creation is genuinely intended here.

---

## F6 — Hand-rolled credential verification · Low · ✅ fixed

> **Fixed 2026-09-03** (`fix/auth-actions-credential-check`): `updateEmail` confirms the password with `auth.api.verifyPassword`, Better Auth 1.7.2's server-scoped endpoint (`metadata.scope: "server"`, so it is not routed under `/api/auth`): session from the request headers, credential row found by the library, comparison through `ctx.context.password.verify`. The action no longer reads the account table, so there is no hash format for it to depend on. A wrong password still answers "Incorrect current password"; the former "No password set on this account" branch collapses into it, since the library does not distinguish the two and telling them apart would mean reading the row again. Pinned by `wattup-frontend/tests/actions/auth-actions.test.ts` (Vitest, new to the frontend). **Residual, pre-existing and outside this fix:** `lib/auth.ts` sets no `user.changeEmail.enabled`, so `auth.api.changeEmail` throws CHANGE_EMAIL_DISABLED after the password check and the email change never completes; enabling it also needs `emailVerification.sendVerificationEmail`.

`auth-actions.updateEmail` verifies the current password by parsing Better Auth's stored hash
and re-deriving it:

```ts
const [N, r, p, salt, storedKey] = account.password.split(':');
scrypt(currentPassword, salt, 64, { N: Number(N), r: Number(r), p: Number(p) }, ...)
```

It is self-scoped to `session.user.id` and does use `timingSafeEqual`, so it is not a
vulnerability. It is fragile: it hardcodes Better Auth's hash serialisation, and a change to
that format on any future upgrade breaks password verification silently or throws. The
cost parameters are read from the stored string and passed straight to `scrypt`.

**Fix.** Use Better Auth's own credential verification rather than reimplementing it. Low
priority, but flag it on any `better-auth` version bump.

---

## F7 — Public contact forms have no rate limiting · Low · ✅ fixed

> **Fixed 2026-09-03** (`chore/frontend-backlog-sweep`): `lib/contact-rate-limit.ts`, five per address per ten minutes, HMAC-keyed, bounded to 500 keys, fails open; both inquiry actions check it before validation.

`contact-actions.ts` exposes `submitDriverInquiry` and `submitHostInquiry` with no guard, which
is correct for public forms, and no rate limiting or spam protection, which is not. They send
email, so the cost of abuse is borne by the Resend account and the monitored inbox.

**Fix.** The same limiter phase 5 builds for the pro-forma gate applies here.

---

## F8 — `next` and `better-auth` carry known vulnerabilities · **Critical**

Installed versions, verified against the advisory ranges:

| Package | Installed | Needs | Advisories that apply |
|---|:--:|:--:|:--:|
| `next` | **16.1.6** | **≥ 16.2.11** | 5 × middleware/proxy bypass, 2 × SSRF, 4 × DoS |
| `better-auth` | **1.6.9** | **≥ 1.6.22** | 1 critical, 7 high |

`pnpm audit` reports 152 advisories overall — 1 critical, 54 high — but most are transitive
build-chain packages. These two are **direct runtime dependencies**, and three of their
advisories land squarely on this project.

**`Next.js: Middleware / Proxy bypass in App Router` (< 16.2.11).** `proxy.ts` is what protects
`/dashboard/*`. A bypass class against the installed version undermines it directly.

> Mitigating, and worth stating accurately: `proxy.ts` is **not** the only protection. Every
> dashboard page independently resolves a session and checks a permission, so a bypass of the
> proxy alone does not open the dashboard. It removes a layer rather than the wall. That is
> defence in depth working as intended, and it is not a reason to delay the upgrade.

**`Better Auth: Account takeover via pre-account hijacking` (>= 1.1.3, < 1.6.22).** This is an
attack class against verification and sign-in flows, which is precisely what phase 2 builds
with `emailOTP`. **Upgrading past 1.6.22 is a prerequisite for phase 2, not a nice-to-have.**

**`Better Auth has insecure cryptographic defaults` (< 1.6.11)** — relevant to session signing
and token generation.

`package.json` declares `"better-auth": "^1.4.7"` while the lockfile resolved 1.6.9, so both
upgrades are in-range lockfile bumps rather than major migrations. Pin explicit minimums after
upgrading so a fresh install cannot resolve backwards.

**Fix.** Upgrade both, run the full gate — `lint`, `typecheck`, `build`, and a manual sign-in,
password-reset and dashboard pass — and re-run `pnpm audit`. Do it in phase S, before the
pro-forma work depends on either library.

---

> **Status (2 Sep): fixed and merged.** `next` 16.1.6 → 16.3.4, `better-auth` 1.6.9 → 1.7.2, no
> application code changed. `pnpm audit` 152 → 109 advisories, 0 critical, neither package
> present. The upgrade run also proved F9's `/sign-in/email` rule live: five bad sign-ins
> returned 401, the sixth 429. One new item from the audit: `dompurify` 3.4.1, the rich-text
> sanitiser, has 10 advisories patched in ≥ 3.4.13 — tracked as B.11.

---

## F15 — F8 regression: `account.issuer` missing after the Better Auth 1.7 upgrade · **High** · ✅ fixed

Better Auth 1.7 added a required `issuer` field to its `account` model (plus a unique index on
`issuer, accountId`), synthesised for every provider — credential accounts get
`local:credential`. The F8 upgrade to 1.7.2 did not add the column, so on `main` **every
account insert was refused** with `Unknown argument issuer`: the dashboard's invite flow and
the admin seed were both broken. It went unnoticed because F8's runtime checks exercised
sign-in, which only reads. Found while seeding a second super admin.

**Fix (merged, migrated):** nullable `issuer` on `account`, on the frontend-owned
`proforma_account`, and on the pro-forma mirror model, with the unique index. The one
pre-existing credential row keeps `NULL`; Better Auth fills every new row. Migration
`20260902190000_account_issuer`, generated with `migrate diff` and applied with `migrate deploy`.

**Lesson, applied:** a dependency upgrade's verification must include one **write** path —
here, creating a user — not just reads. Added to S.2.5.

**Related, older:** `seed.ts`'s own create path for the primary admin has been broken since the
May RBAC migration — the admin plugin stamps `role: "user"`, which the enum no longer contains.
It survives only because `admin@wattup.com` already exists and takes the promote branch.
`seed-admins.ts` sets `defaultRole` explicitly; `seed.ts` should too (S.5.7).

---

## F9 — No rate limiting on any auth endpoint · **High**

`lib/auth.ts` configures no `rateLimit` block at all. Better Auth's defaults apply — enabled in
production, roughly 100 requests per 10-second window — and there are **no `customRules`** for
the endpoints that need them.

`/api/auth/sign-in/email` and `/api/auth/forget-password` are therefore reachable at the
generic default rate. That is ample for password guessing against a known admin address, and
for using password-reset as an email bomb.

**Fix.** Add `rateLimit.customRules` with tight windows on `sign-in`, `forget-password` and
`reset-password`. Phase 5 builds a limiter for the pro-forma gate; the same work covers this,
but this half should not wait for it — it is a few lines of configuration.

---

> **Correction after review (2 Sep):** the original wording "no rate limiting" overstated it.
> Better Auth 1.6.9 ships built-in rules for `/sign-in*` (3 per 10 s) and
> `/request-password-reset` (3 per 60 s). What was missing: any explicit configuration, any rule
> on `/reset-password`, and — the real gap — the app's own forms never hit the HTTP limiter at
> all (F14). **Fixed:** explicit `rateLimit` block, five custom rules including the
> `/reset-password/*` link-click callback, memory storage for now (B.10).

---

## F14 — Forgot/reset forms bypass the rate limiter · **High** · ✅ fixed

Found by the F9 implementer and confirmed by both reviewers. `app/_actions/auth-actions.ts`
exported `requestPasswordReset` and `resetPassword` as `'use server'` actions that called
`auth.api.requestPasswordReset` / `auth.api.resetPassword` **directly**. Better Auth's rate
limiter lives only in its HTTP handler, so those two public endpoints — the production path
for the forgot-password and reset-password pages — were unlimited regardless of F9's rules.
An anonymous caller could replay the action id from the client bundle and send a reset email
per call through Resend: exactly the email-bomb F9 names.

**Fix (merged):** both forms now call `authClient.requestPasswordReset` /
`authClient.resetPassword` over HTTP — the same path `sign-in-form.tsx` already used — so F9's
rules apply. The two server actions were **deleted**, not guarded; a leftover export is a
leftover bypass. Better Auth returns the same `{ status: true }` for known and unknown
addresses, so no enumeration was introduced.

---

## F10 — Public sign-up blocked by a fragile string match · Medium

```ts
hooks: {
  before: async context => {
    if (!context.request) return;
    const url = new URL(context.request.url);
    if (url.pathname.endsWith('/sign-up/email')) { throw new APIError('FORBIDDEN', ...); }
  },
},
```

Registration is closed by matching one path suffix. Better Auth provides a first-class option
for this. The hook is load-bearing security resting on a string comparison: if a future version
adds another sign-up route, renames the path, or accepts the same operation under a different
endpoint, **public registration silently reopens** and nothing fails visibly.

Note also `if (!context.request) return;` — any invocation without a `request` skips the check
entirely.

**Fix.** Use the built-in `emailAndPassword.disableSignUp` option and keep the hook as a second
layer. Add a test that asserts a sign-up attempt is refused, so a regression is caught by CI
rather than by a stranger creating an account.

---

## F11 — CSP depends on `'unsafe-inline'` · Low, accepted

`next.config.ts` sets a genuinely well-considered CSP — HSTS with preload, `frame-ancestors`,
`object-src 'none'`, `base-uri`, `form-action`, and per-vendor allowlists with comments
explaining each. The one weakness is `script-src 'unsafe-inline'`, and the file already
documents why: the GTM loader and admin-injected scripts are inline.

Worth recording that this **interacts with F4**: the CSP cannot mitigate admin-injected script,
because that injection is the reason the directive is there. The two findings share a root, and
the nonce migration the comment describes would close both.

**Fix.** Backlog. Migrate GTM and the injected-script fields to a nonce, then drop
`'unsafe-inline'`. Not urgent, but it is the single change that would most improve the
front-end security posture.

---

## F12 — Cloudinary API key exposed to the browser · Low · ✅ fixed

> **Fixed 2026-09-03** (`chore/frontend-backlog-sweep`): `lib/cloudinary.ts` is `server-only` and reads `CLOUDINARY_*` only. `NEXT_PUBLIC_CLOUDINARY_API_KEY` is read by nothing; delete it from every environment (runbook).

`lib/cloudinary.ts` reads `NEXT_PUBLIC_CLOUDINARY_API_KEY`, so the key ships in the client
bundle. Uploads are **signed server-side** — `api_secret` is server-only and there are no
unsigned upload presets anywhere in the codebase — so the key alone is not sufficient to
upload. This is unnecessary exposure rather than a vulnerability.

**Fix.** Drop the `NEXT_PUBLIC_` fallbacks. The config runs server-side only; the prefixed names
serve no purpose and invite someone to add a client-side upload path later that would be
genuinely unsafe.

---

## F16 — Dashboard cookie cache outlives sign-out and ban · Low

**Found** during the signed-in walkthrough (checklist 0.17), on 2026-09-03.

`wattup-frontend/lib/auth.ts` enables Better Auth's `cookieCache` with a 5 minute `maxAge`, and
`proxy.ts` decides the redirect from cookie **presence** only (no database read, by design).
So a `session_data` cookie that was copied before sign-out keeps rendering dashboard **pages**
for up to five minutes after the session row is gone: `/dashboard` and `/api/auth/get-session`
both answered 200 to replayed cookies after a successful sign-out. The normal path is fine: sign-out
clears both cookies and the next request 307s to `/admin`.

**Reach.** Reads only. Every server action resolves the session fresh (ADR 0001 D13), so a
revoked session cannot write. It needs a cookie captured while the session was live, which
already implies a bigger problem. Compare the pro-forma app, where the same class was closed with
`disableCookieCache: true` on every gated request (checklist 3.13).

**Fix options**, for the backlog (B.15): pass `disableCookieCache: true` in the dashboard's
`getSession()` for page shells as the pro-forma gate does (one extra DB read per page render), or
shorten `maxAge` to 60 s, or accept and record. Recommend the first: the dashboard is low
traffic and the pro-forma app already pays this cost.

---

## F13 — The seed re-creates an unremovable SUPER_ADMIN on every build · **High**

`package.json` runs the seed as part of the production build:

```json
"build": "next build && prisma db seed"
```

`prisma/seed.ts` then, on **every deploy**:

- if `ADMIN_EMAIL` exists → force-promotes it back to `SUPER_ADMIN`;
- if it does not exist → **re-creates it** with `ADMIN_PASSWORD` from the environment, and sets
  `emailVerified: true`.

Three consequences follow, and none of them is visible from the dashboard:

1. **That account cannot be demoted.** An admin who lowers its role sees the change reverted by
   the next deploy.
2. **That account cannot be deleted.** Deleting it causes the next deploy to recreate it, with
   a password that has not changed.
3. **`ADMIN_PASSWORD` is a live, permanently valid credential sitting in the environment**,
   readable by anyone with access to the Vercel project settings, and never rotated by use.

The seed also builds its own Better Auth instance with `emailAndPassword: { enabled: true }` and
none of the production `hooks`, so it bypasses the sign-up block by construction. That is
reasonable *for a bootstrap script* and unreasonable *for something that runs on every build*.

**Whether this is a deliberate break-glass account or a leftover bootstrap is the question to
settle.** Either way the current shape is wrong: a break-glass credential should be rotated,
stored in a password manager rather than an env var, and used deliberately — not re-asserted
automatically on every deploy.

Note for phase 4a: this account will hold `ACCESS_PROFORMA` by default.

**Fix.** Take `prisma db seed` out of the `build` script and run it as a one-off bootstrap
command. Remove `ADMIN_PASSWORD` from the environment once the account exists. If a break-glass
path is wanted, make it explicit and documented rather than a side effect of deploying.

---

## What is already right

Stated so nobody "fixes" it later, and because it says something about where the real risk is.

- **`.env` has never been committed** — verified across all branches. `example.env` holds no
  real values.
- **No raw SQL anywhere.** Every query goes through Prisma's query builder.
- **Rich text is sanitised** with DOMPurify before `dangerouslySetInnerHTML`, and JSON-LD goes
  through `safeJsonLd()`.
- **Cloudinary uploads are signed server-side.** No unsigned presets.
- **Unpublished locations are filtered at the data layer**, not by the caller — the exact
  pattern F2 says the article reads should copy.
- **`revokeSessionsOnPasswordReset: true`**, and cookies are `HttpOnly` / `Secure` in production.
- **`permission-guard.ts` is the right shape** and its comment already states the principle the
  rest of this document keeps returning to: *"Hiding a control in the dashboard is presentation,
  not protection: a server action is a callable endpoint, so each one gates itself here."*

The gap is not that this codebase lacks security thinking. It is that the thinking was applied
thoroughly in some modules — locations, CSP, the permission guard — and not carried across to
others: articles, media, and dependency currency.

---

## Suggested order

**Phase S, in this order:**

1. **F1** — destructive, trivially reachable by a plain `curl`, unrelated to everything else.
   Its own PR, today.
2. **F8** — the dependency upgrades. `better-auth ≥ 1.6.22` is a **prerequisite for phase 2**,
   since pre-account hijacking is an attack class against the exact flow that phase builds.
3. **F2** — one default per read. Same day as F1 if possible.
4. **F9** — a few lines of `rateLimit.customRules`.
5. **F13** — remove `prisma db seed` from the build script; decide the break-glass question.

**Phase 4a**, where the permission plumbing is already being rebuilt: F3, F4, F5, F10.

**Backlog:** F11, F16 (F6, F7 and F12 fixed). F11 is the highest-value of these and closes F4's root cause.

Nothing here blocks the pro-forma work except F8, and the pro-forma work blocks none of it.
