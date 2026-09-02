# WattUp Pro-Forma — master checklist

The single tracking document. Tick an item the moment it is done, **from evidence**: the
command that passed, the file that exists, the preview URL that loaded. Never from memory of
having intended to do it. If an item is half done, say which half in the Notes column.

**Reference docs:** [ADR 0001](../adr/0001-proforma-access-architecture.md) ·
[ADR 0002](../adr/0002-roles-and-permissions.md) ·
[Restructure](00-repo-restructure.md) · [Runbook](RUNBOOK-dns-email-env.md) ·
[PRD](<../Pro-Forma Access.md>) · [Bangla walkthrough](<../Pro-Forma Access (Bangla).md>)

---

## Progress

| Phase | Title | Owner | Blocked by | Status |
|:--:|---|:--:|---|:--:|
| S | Security fixes: F1, F8, F2, F9, F13 (+F14) | dev | — | ✅ **all merged to main** — nothing deployed yet (0.18) |
| 0 | Repository restructure | dev | — | ◐ steps 1-7 done; 0.17-0.21 need Vercel + push |
| 1 | Scaffold `wattup-proforma` | dev | 0 | ◐ done except the Vercel project (1.6-1.8) |
| 2 | The access gate | dev | 1 | ✅ **built and verified end to end with real codes** (2.40–2.45); phase review pending |
| 3 | Mount the tool behind it | dev | 2 | ◐ merged to main; 3.8 needs Vercel, 3.11 needs phase 2 |
| 4a | RBAC: roles and permissions | dev | S | ☐ not started |
| 4b | Activity log and member view | dev | 2, 3, 4a | ☐ not started |
| 4c | Dashboard UI | dev | 4a, 4b | ☐ not started |
| 5 | Hardening and tests | dev | 2 | ◐ 5a + review round 2 merged; migration pending; security review + 5b tests next |
| 6 | Cutover | client + dev | all | ☐ not started |
| B | Security backlog (F6, F7, F11, F12) | dev | — | ☐ not started |

**Answers needed from the client** — chase these in parallel, they block only what is listed:

- [x] **A.** Subdomain: **decided 2026-09-03**: the app derives its host from `NEXT_PUBLIC_APP_URL` / `BETTER_AUTH_URL` only (verified: no hard-coded host in `wattup-proforma` code), and the default name is **`proforma`** (`proforma.wattupusa.com`); the PRD's `hostproposal` stays available by setting the env. Runbook Part 0a
- [x] **L. OTP rotation vs reuse.** **Decided 2026-09-03** (client: do what is most secure): keep `resendStrategy: 'rotate'` with the keyed HMAC store (2.37a). Reasons: a code is single-use per issue and never re-sent; the store stays irreversible without the app secret (`'encrypted'` + `'reuse'` would make every stored code decryptable by anyone holding `BETTER_AUTH_SECRET` and extend a code's life on every third-party resend); the nuisance case (a stranger forcing a member's code to rotate) is bounded by the 60 s per-address gap and 20/h per address, and the member can always use the newest code in their inbox. No code change
- [◐] **K. Apex SPF edit** (client-owned, 2026-09-03: \"will be fixed\"; runbook Part 0a and 6.6a; verify after) (found in 2f): add `include:amazonses.com` to `wattupusa.com`'s SPF TXT so Resend mail stops failing SPF and landing in Spam. Your DNS action; see runbook Part 3 and 6.6a
- [◐] **B.** Vercel and deployment: **client does it** (2026-09-03). Nothing here depends on it except the push itself; every step is in the runbook (Part 0a operator list, Part 2, Part 5). Root Directory (0.18), Ignored Build Step (0.19, 1.7), the pro-forma project (1.6), domains (6.4) and env (6.8) are the operator's checklist
- [x] **C.** Matrix: **decided 2026-09-03**: seed the ADR 0002 §6 matrix as recommended (EDITOR keeps `DELETE_ANY_POST`, behaviour preserving); the client adjusts role defaults **from the dashboard**, so 4c gains a Roles page editing `role_permission` (4c.13 to 4c.16)
- [x] **D.** `NETWORK_MANAGER` and `SALES` **confirmed 2026-09-03**
- [x] **E.** No `Reply-To`: **decided 2026-09-03**, the code email is `noreply` on purpose and that is fine. 2.37 closed
- [x] **F.** **Decided 2026-09-03**: `VIEW_ACTIVITY_LOG` defaults to `ADMIN` (and `SUPER_ADMIN`) and an admin can give it to any role from the dashboard Roles page (4c.13). Retention stays the proposed 90 days, configurable by `ACTIVITY_LOG_RETENTION_DAYS` (4b.8)
- [x] **I.** **Decided 2026-09-03**: drop `EDIT_OWN_POST` / `DELETE_OWN_POST` as ADR 0002 §7 recommends. `Posts.author` stays free text. The two enum values are retired (removed from code and seeds, kept in the database enum like the reserved four; 4a.14)
- [◐] **J. Resend account ownership.** (client-owned, 2026-09-03: \"will be fixed later\"; runbook Part 0a) Both apps send through one Resend account whose owner login is unknown to us. What is known: domain `wattupusa.com` verified 2026-05-18 19:58 UTC, API keys `Wattup USA` (2026-05-18 20:09) and `Wattup` (2026-05-19 09:40), region us-east-1; the integration commit landed the next morning. The API exposes no owner and the dashboard needs a login. **Ask the client to provide the account's login email (or transfer/add a team member) so the key can be rotated and the SPF fix verified from the dashboard.** → blocks 6 (cutover ownership), and any key rotation
- [x] **G.** ~~Is `COLLABORATOR` still in use~~ → **removed; client confirms nobody holds it.** Verify with the count query at 4a.24 before migrating.
- [x] **H.** ~~Default role~~ → **no implicit default; role is an explicit choice at creation.**

---

## Phase S — Security fixes, standalone and first

From the full audit in [SECURITY-FINDINGS.md](SECURITY-FINDINGS.md). **All four are live on
production now**, none depends on the pro-forma work, and F8 blocks phase 2.

### S.1 — F1: unauthenticated upload and deletion · Critical

- [x] S.1.1 Session + permission check on `app/api/upload-image/route.ts`
- [x] S.1.2 Session checks on **all six** exports in `app/_actions/image-actions.ts` — `deleteImages` and `cleanupOldDrafts` included, they are destructive
- [x] S.1.3 Origin check on the upload route
- [x] S.1.4 Whitelist the caller-supplied `folder` parameter
- [x] S.1.5 Verify: unauthenticated `POST /api/upload-image` returns 401
- [x] S.1.6 Upload gate, live: signed in and same-origin the route reaches the body check (`400 No file provided`, nothing sent to Cloudinary); the same call without a session → 401. Structure was verified earlier (same-origin fetch, `folder=tiptap` allowed, unchanged return shape)
- [x] S.1.7 Audit Cloudinary for files uploaded from outside the team: 1,613 assets, 1,435 orphaned, 1,577 outside the allowlist, 1,460 in the unauthenticated window, of which only 14 went through the app and all by the team; the account is shared with other products (1,360 assets) and deletions in the window cannot be seen from the inventory. `docs/plan/CLOUDINARY-AUDIT.md`
- [x] S.1.8 ~~Check whether `cleanupOldDrafts` has already deleted anything~~ — **premise was false**: it only ever logged and never called Cloudinary. Clamp kept for when it is wired in
- [x] S.1.9 **Follow-up (review):** `publicId`/`overwrite` passthrough closed — actions build a fresh `{ folder }` and forward nothing else; allowlist moved to `lib/image-service.ts` and enforced on the actions and `moveImage` too
- [ ] S.1.10 **Residual → 4a:** `deleteImages` / `deleteSingleImage` accept any id. Needs a media-ownership model (none exists). Any signed-in user can delete any asset until then

> No `UPLOAD_MEDIA` permission exists until 4a. Gate on an authenticated session now, tighten
> to the permission at 4a.16.

### S.2 — F8: dependency upgrades · Critical

- [x] S.2.1 `next` 16.1.6 → **16.3.4** (5 × middleware/proxy bypass, 2 × SSRF, DoS closed)
- [x] S.2.2 `better-auth` 1.6.9 → **1.7.2** (1 critical closed; `lib/auth.ts` compiled unchanged — admin plugin, sign-up hook, rate rules, `nextCookies` all intact)
- [x] S.2.3 Pinned `^16.3.4` / `^1.7.2`; `eslint-config-next` and `@next/eslint-plugin-next` aligned to 16.3.4
- [x] S.2.4 tsc clean; lint delta **zero** (17/23 before and after — rule set unchanged); `pnpm build` green on Next 16.3.4 with Proxy
- [x] S.2.5 Runtime probes on 16.3.4: `/dashboard` → 307 to `/admin?callbackUrl=`, `/` `/admin` `/locations` → 200, sign-up → 403 (hook fires first), **six bogus sign-ins → 401 ×5 then 429** (F9 proven live). Signed-in walk done in 0.17; the write path was exercised by creating the second admin, which is what surfaced F15
- [x] S.2.6 `pnpm audit` 152 → **109, 0 critical**; `next` and `better-auth` absent. Remaining is transitive build-chain (hono via shadcn/prisma dev, picomatch, brace-expansion, nanoid…) **except `dompurify` 3.4.1 — the rich-text sanitiser, 10 advisories, patched ≥ 3.4.13 → B.11**
- [x] S.2.7 Gate cleared (pro-forma had installed 1.7.2 fresh anyway; the frontend now matches)

### S.3 — F2: unpublished articles readable by anyone · High

- [x] S.3.1 `getArticles` defaults to `status: 'Published'`
- [x] S.3.2 Same for `getPaginatedArticles`, `getArticleById`, `getArticleBySlug`
- [x] S.3.3 A caller cannot widen scope by passing `status` — drafts need a session with a post permission
- [x] S.3.4 Follow the pattern `lib/locations/server.ts` already uses: filter at the data layer, not at the caller
- [x] S.3.5a Seen from both sides in 0.17: the signed-in dashboard list shows `Draft`; the public press-release page has zero draft markers
- [x] S.3.5 An unauthenticated call returns no draft — by construction: `PUBLISHED` is inside every public query and the dashboard functions delegate to those on refusal
- [x] S.3.6 **Follow-up (review):** drafts require `CREATE_POST`, not just a session; refusal takes the identical Published-only path as no-session. Also: public "Show more" (page 2+) was leaking drafts too — closed

### S.4 — F9: no rate limiting on auth endpoints · High

- [x] S.4.1 `rateLimit.customRules` in `lib/auth.ts` for `sign-in/email`
- [x] S.4.2 Rules for `forget-password` and `reset-password`
- [x] S.4.3 Verified live during F8: six bogus sign-ins → 401 ×5 then **429**
- [x] S.4.4 **F14 (found in review):** the app's own forgot/reset forms called `auth.api.*` from server actions, bypassing the HTTP limiter entirely. Forms now use `authClient` over HTTP; the two bypass actions are **deleted**, not guarded
- [x] S.4.5 **Follow-up (review):** `/reset-password/*` wildcard so the link-click GET callback (a token-validity oracle) is limited too
- [ ] S.4.6 **Note:** memory storage is per-instance on serverless — effective limit is N× the numbers. Move to `database`/secondary storage once a `rateLimit` table can be migrated (needs a frontend migration). Backlog B.10

### S.5 — F13: seed re-creates an unremovable SUPER_ADMIN · High

- [x] S.5.1 `prisma db seed` removed from `build`; `pnpm db:seed` is the explicit one-off; `seed.ts` header states the force-promote/recreate behaviour; `prisma.config.ts` seed hook is `pnpm run seed`
- [ ] S.5.2 Decide: deliberate break-glass account, or leftover bootstrap?
- [ ] S.5.3 If break-glass — rotate the password, move it to the password manager, document the procedure
- [ ] S.5.4 Remove `ADMIN_PASSWORD` from the deployed environment once the account exists
- [ ] S.5.5 Verify on a real deploy that the account is no longer re-promoted — **also check the Vercel project's Build Command override**: if one was ever set to `next build && prisma db seed`, the `package.json` change is void and this cannot be seen from git
- [ ] S.5.6 Clean up the stale `NEW_API_KEY` / `NEW_API_SECRET` / `NEW_CLOUD_NAME` Cloudinary vars, or confirm they are live and rotate them
- [ ] S.5.7 `seed.ts` create path is broken since the RBAC migration (admin plugin stamps `role: "user"`); set `admin({ defaultRole })` as `seed-admins.ts` does
- [x] S.5.8 **Second super admin seeded:** `devripon.io@gmail.com` via the new `pnpm seed:admins` (`ADMIN_EMAILS`, uses `ADMIN_PASSWORD`, touches user + account only). `admin@wattup.com` untouched. Every check from here runs as this account

- [◐] S.6 Each fix merged to `main` as its own branch (F1 ×2 commits, F2 ×2, F9 ×2, F13, F14). **Not deployed** — push is gated on the Vercel Root Directory change (0.18)

---

## Phase 0 — Repository restructure

Follow [00-repo-restructure.md](00-repo-restructure.md). No behaviour changes.

- [x] 0.1 Working tree clean, `pre-restructure` tag created
- [x] 0.2 `node_modules`, `.next`, `tsconfig.tsbuildinfo`, `next-env.d.ts` removed
- [x] 0.3 `mkdir wattup-frontend` and `git mv` every tracked entry **except** `docs/`, `.claude/`, `.agents/`, `.agent/`, `skills-lock.json`, `.vscode/`
- [x] 0.4 Agent folders confirmed still at the **root** — they are shared tooling, and `wattup-proforma` needs the same Better Auth / Resend / Next skills
- [x] 0.5 `.claude/skills` deduplicated: 6 real directories converted to symlinks into `.agents/skills/`, with a `diff` guard so a locally edited skill is reported not overwritten
- [x] 0.6 Root `CLAUDE.md` written; `AGENTS.md` symlinked to it
- [x] 0.7 `wattup-frontend/CLAUDE.md` present (moved down with the app) and its `AGENTS.md` symlink intact
- [x] 0.8 Verify the cascade: from `wattup-frontend/`, both the root and app `CLAUDE.md` apply
- [x] 0.9 `git ls-files | grep -vE '^(wattup-frontend|docs|\.claude|\.agents?|\.vscode)/' | grep -v '^skills-lock.json$'` prints nothing
- [x] 0.10 `.env` moved by hand — **git could not see it**
- [x] 0.11 Gitignored internal reports moved; `.DS_Store` files deleted
- [x] 0.12 Root `.gitignore` written with `**/`-prefixed patterns
- [x] 0.13 `git status --short | grep -c node_modules` prints 0
- [x] 0.14 Branch `chore/monorepo-restructure`, move committed alone
- [x] 0.15 `git log --follow` on a moved file shows real history
- [x] 0.16 `pnpm install` + `pnpm exec next build` pass in `wattup-frontend/` (**not** `pnpm build` — it seeds the remote database)
- [x] 0.16a Outer directory renamed `wattup-frontend` → `wattup`; git, pnpm symlinks and the build all verified from the new path
- [x] 0.17 Signed-in walkthrough as `devripon.io@gmail.com` (SUPER_ADMIN): sign-in 200; all nine dashboard pages 200 with the session and 307 without; sign-out 200 and `/dashboard` then 307s. Post-F1/F2/F8/F14/F15, on the restructured tree
- [ ] 0.18 Vercel Root Directory → `wattup-frontend` **saved before pushing** *(on whichever account holds the project at that time)*
- [ ] 0.19 Ignored Build Step set on the frontend project
- [ ] 0.20 Pushed; preview deploy loads the dashboard
- [ ] 0.21 Merged; production deploy green; `pre-restructure` tag deleted

---

## Phase 1 — Scaffold `wattup-proforma`

- [x] 1.1 `pnpm create next-app@latest wattup-proforma …` from the repo root
- [x] 1.2 **No nested `.git`** — `ls -a wattup-proforma | grep '^\.git$'` prints nothing
- [x] 1.3 Generator boilerplate trimmed; own `pnpm-workspace.yaml` written
- [x] 1.4 Own `pnpm-lock.yaml` exists; **no root `package.json`**
- [x] 1.5 Committed separately
- [ ] 1.6 Second Vercel project created, Root Directory `wattup-proforma` *(deferred: client may move both projects to a fresh Vercel — see answer B)*
- [ ] 1.7 Ignored Build Step set on the pro-forma project
- [ ] 1.8 Deploys green to its `.vercel.app` URL
- [x] 1.9 Prisma added; schema holds only `user` (narrow), `proforma_session`, `proforma_verification`
- [x] 1.10 **No `migrate` or `db push` script in `package.json`** — the frontend owns the schema
- [x] 1.11 `DATABASE_URL` uses the **pooled** connection string
- [x] 1.12 Better Auth skeleton boots; `/api/auth/get-session` returns 200, and `email-otp` / `sign-in` / `sign-up` already return **404** (ADR 0001 §7 enforced from day one)
- [x] 1.13 Lift-out test: copied outside the repo, installed from its own lockfile, built clean

---

## Phase 2 — The access gate

> **Blocked on a database migration that only `wattup-frontend` can make.** Better Auth needs
> `proforma_session`, `proforma_account` and `proforma_verification` to exist. Per ADR 0001 §5
> the frontend owns the schema, so those three models must be added to
> `wattup-frontend/prisma/schema.prisma` and migrated from there. It is additive — three new
> tables, nothing existing touched — but it writes to the shared Neon database, so it needs a
> deliberate go-ahead. Tracked as 2.0 below.

- [x] 2.0 `proforma_session`, `proforma_account`, `proforma_verification` added to the frontend schema and **migrated** (`20260902180000_proforma_auth_tables`, applied via `migrate deploy`, verified by read-only introspection). SQL generated with `migrate diff` first, which exposed drift deliberately left out — see 4a.41
- [x] 2.0a **Pro-forma schema bug (fixed):** `Session`/`Account`/`Verification` ids are `String @id` with **no `@default(cuid())`**, and Better Auth runs with `generateId: false` — inserts will fail. Add the default to all three before any sign-in is attempted
- [x] 2.0b `safeNext` belongs at the **consumer**: the `/login` page receives `?next=` from anyone and must validate it there (the Phase 3 route validates the producer side, which is always `/tool…`)

**The riskiest phase.** Deliberately built and tested before DNS exists, against
`PROFORMA_ALLOWLIST` rather than the database.

### 2a — Better Auth configuration

- [x] 2.1 `emailOTP` plugin added
- [x] 2.2 `storeOTP: 'hashed'` — **plugin default is `'plain'`, which violates the PRD**
- [x] 2.3 `expiresIn: 600` — plugin default is 300
- [x] 2.4 `allowedAttempts: 5` — plugin default is 3
- [x] 2.5 `disableSignUp: true` — otherwise sign-in **creates** users
- [x] 2.6 `emailAndPassword` disabled
- [x] 2.7 Session table mapped to `proforma_session`, not the shared `session`
- [x] 2.8 Distinct cookie prefix and a **different** `BETTER_AUTH_SECRET`
- [x] 2.9 Fail closed: missing required env var → 503 with a plain-text reason

### 2b — Member directory

- [x] 2.10 `MemberDirectory` interface defined
- [x] 2.11 `EnvMemberDirectory` reading `PROFORMA_ALLOWLIST`
- [x] 2.12 Email normalisation: trim, lowercase, applied on **every** path
- [x] 2.13 `DbMemberDirectory` reads the `proforma_member` view (typed via a read-only Prisma model); until 4b creates the view it catches P2021, logs once, and returns null — fail closed. **4b must emit `lower(u.email) AS email`** or normalised lookups miss mixed-case rows
- [x] 2.13a `requireMember()` now decides membership fully: forced-DB-read session → not banned → directory says active. `PROFORMA_ALLOWLIST` is ignored in production with a loud warning (4b.4 enforced in code)

### 2c — The two wrapped routes

> Better Auth's OTP endpoints are **never** exposed to the browser. See ADR 0001 §7.

- [x] 2.14 **(allowlist since round 2: exactly `/get-session` and `/sign-out`; `update-user` etc. → 404)** Better Auth's OTP routes confirmed unreachable from outside
- [x] 2.15 `POST /api/gate/request-code` — normalise, rate limit, look up, send, always 200
- [x] 2.16 One generic body regardless of outcome, member or not
- [x] 2.17 Email sent **after** the response via `after()` — and so is the decision itself (rate-limit stub → directory → OTP issue), nested `after()` for the Resend send. Proven in the dev log: the member's `passed to Better Auth` line lands ~1 s after its `200` line
- [x] 2.18 `POST /api/gate/verify-code` — success sets the session
- [x] 2.19 **All** verify failures collapse to one identical response: wrong code, expired, never issued, attempts exhausted, member removed mid-flow
- [x] 2.20 Allowlist re-checked at verify, before the session is issued
- [x] 2.21 Real failure reason logged server-side with a correlation id, never returned
- [x] 2.22 Sign-out is Better Auth's `POST /api/auth/sign-out` (reachable; only `email-otp`/`sign-in`/`sign-up` are closed) — the tool's link already targets it
- [x] 2.23 **(hardened after the security review: control characters refused, then resolved through the URL parser and required to stay same-origin — `/%09/evil.com` used to pass)** `safeNext` same-site redirect check ported from the old middleware
- [x] 2.24a Both gate routes require `content-type: application/json` — closes CSRF via `text/plain` form posts (added beyond spec)
- [x] 2.24b Known, documented, accepted: the removed-between-request-and-verify branch returns the identical 400 but carries cookie-expiry `set-cookie` headers from the sign-out. Reachable only by someone holding a valid code for that user
- [x] 2.24 Constant-time comparison retained where codes or tokens are compared

### 2d — The login screen

- [x] 2.25 Two-step screen: email, then code. Ungated.
- [x] 2.26 Advances to code entry **whether or not** the address is a member
- [x] 2.27 Copy does not imply a code is definitely coming
- [x] 2.28 Code input: `inputmode="numeric"`, `autocomplete="one-time-code"`
- [x] 2.29 Leading zeros survive — code handled as a **string** throughout
- [x] 2.30 Built on **wattup-frontend's design tokens** (copied by hand, light + dark blocks, referenced by name); wordmark renders before sign-in. Client instruction 2 Sep: one brand across both apps. **Scheme settled: `/admin` mounts no theme provider and is always light, so the gate is too** (client: design the login like the frontend's). Dark flip verified working with a temporary `dark` class, then reverted
- [x] 2.31 Resend-code affordance respecting the 60-second gap — cooldown starts on the **first** send, resend keeps the field, same-address re-submit inside the gap goes to step 2 with the remaining cooldown (code review round 2)
- [x] 2.32 Error states for expired and exhausted codes, using the one generic message

### 2e — Email

- [x] 2.33 Own Resend client in `wattup-proforma` (copied, not imported); **same key and apex sender as the frontend** by client decision — ADR D10 superseded, runbook Part 3 void
- [x] 2.34 OTP template: HTML **and** plain text, on the frontend's mail base (`lib/mail-base.ts`, a whole-file copy of the frontend's `lib/mail/base.ts`) — rendered documents identical to the reset-password mail except the body cell
- [x] 2.35 Six digits as selectable text (`<code>`, 36px monospace, `#197dff` on `#eff6ff`), not an image
- [x] 2.36 10-minute expiry and single use stated; "ignore if you did not request this" line present; subject `<code> is your WattUp sign-in code`
- [x] 2.37 No `Reply-To` by decision E (2026-09-03): the sender is `noreply` and that is intended
- [x] 2.37a OTP storage is a **keyed HMAC** under `BETTER_AUTH_SECRET`, not Better Auth's unkeyed `'hashed'`: a reader of the shared database cannot crack a six-digit space back to a live code (security review, Low)
- [x] 2.37b `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are now required: production can no longer silently fall back to `localhost:3001` for `baseURL`, `trustedOrigins` and the email logo link
- [x] 2.38 **The code appears in no log line, error body or analytics event**
- [x] 2.39 Emails in application logs are hashed or truncated

### 2f — Verify the phase

- [x] 2.40 Member: request-code → 200 generic, decision in `after()`, Resend `delivered`; verify-code with the real code → 200, `wup.session_token` (7 d) + `wup.session_data` (5 min) set, `{redirectTo:"/tool/"}`
- [x] 2.41 Non-member: request-code → 200 identical body; Resend's API shows **zero** emails to that address before and after — nothing sent
- [x] 2.42 **Timing closed by construction.** First cut measured member 1,110 ms vs non-member 3 ms (Better Auth's DB round trips, not Resend). Fixed by moving the membership decision *and* OTP issue into `after()` — the response has zero dependence on who asked. Re-measured: member 3.1/2.9/3.9/3.0/2.5 ms, non-member 2.8/2.7/2.6/2.1/2.3 ms
- [x] 2.42a **verify-code measured too** (code review asked): member-with-live-record wrong code 1.315/1.319/1.294 s vs non-member 1.308/1.290/1.458/1.349/1.328 s at ~270 ms Neon RTT from this machine — indistinguishable; a one-query difference would show as a ~270 ms step. Per-IP limit still added to verify-code in the fix-up to bound sampling
- [x] 2.43 5 wrong attempts → 400 ×5, then the **correct** code → 400: the record is destroyed at the fifth attempt (`allowedAttempts: 5`), verified against a real code and an empty `proforma_verification` afterwards
- [x] 2.44 A used code cannot be reused (same code again → 400). Expiry: with `OTP_TTL_SECONDS=20` on the process, a real code verified 26 s after issue → 400
- [x] 2.45 Two real codes requested back to back: the first → 400, the second → 200 (`resendStrategy: 'rotate'`)

---

## Phase 3 — Mount the tool

- [x] 3.1 Tool files copied to `wattup-proforma/private/tool/` — **not** `public/`
- [x] 3.2 `model.js`, `doc.js`, `evpin.js`, `app.js` byte-identical to source
- [x] 3.3 Only the wordmark and favicon in `public/`
- [x] 3.4 Gated route handler serving `private/tool/` after a session check
- [x] 3.5 Content-Type map for `.html`, `.js`, `.css`, `.svg`; everything else refused
- [x] 3.6 `Cache-Control: private, no-store` on served files
- [x] 3.7 **`outputFileTracingIncludes` set in `next.config.ts`** — without it the route works in dev and 404s in production
- [ ] 3.8 Verified on a **preview deploy** — blocked on the Vercel project (1.6); locally the `.nft.json` lists all 15 `private/tool/**` files, which is the tracing proof
- [x] 3.9 Sign-out link in `index.html:31` changed from `GET /__logout` to a POST — the one interface change
- [x] 3.10 The `*.wattupusa.com` hostname check still reveals the link
- [x] 3.11 Tool served behind the gate with a real session: `/tool/` → 200 HTML, `js/model.js` → 200 JS **byte-identical to source**, `css/app.css` → 200; `/login` while signed in → 307 to `/tool/`
- [x] 3.13 **Follow-up (review):** `lib/gate.ts` `requireMember()` — `getSession` with `disableCookieCache: true` (forced DB read), then `user.banned` re-check; the one place a gated request decides membership, phase 2 swaps in the `proforma_member` lookup. `X-Frame-Options: DENY` + `frame-ancestors 'none'` on every gated response (tool's own `srcdoc` preview verified unaffected). Content-Type map trimmed to the four the spec names
- [x] 3.12 Unauthenticated request for `model.js` → 302 to `/login?next=…`, no JavaScript — re-verified against the same URL that returns JS with a session

---

## Phase 4a — RBAC

Per [ADR 0002](../adr/0002-roles-and-permissions.md). **The largest single piece of work**, and
entirely inside `wattup-frontend`. Its own branch, its own PR. *(needs answers C, D, G)*

### Schema

- [ ] 4a.1 `role_permission` and `user_permission` models added
- [ ] 4a.2 5 new permissions: `VIEW_LOCATIONS`, `MANAGE_PERMISSIONS`, `UPLOAD_MEDIA`, `DELETE_MEDIA`, `VIEW_ACTIVITY_LOG`, `ACCESS_PROFORMA`
- [ ] 4a.3 2 new roles: `NETWORK_MANAGER`, `SALES`
- [ ] 4a.4 Seed migration populates `role_permission` from ADR 0002 §6
- [ ] 4a.5 Migration verified **behaviour-preserving** for the three surviving roles

### Remove `COLLABORATOR` (ADR 0002 §4.1, §4.2)

- [ ] 4a.24 **Hard gate:** `SELECT count(*) FROM "user" WHERE role = 'COLLABORATOR';` returns **0**. If not, stop and reassign first.
- [ ] 4a.25 Enum recreated — PostgreSQL has no `DROP VALUE`. Follow the pattern in `20260518120000_rbac_roles_permissions/migration.sql`
- [ ] 4a.26 `@default(COLLABORATOR)` **removed** from `User.role`, not repointed
- [ ] 4a.27 `lib/permissions.ts`: `Role`, `ROLE_PERMISSIONS`, `ROLE_LABELS`, `ROLE_BADGE_CLASSES`, `ASSIGNABLE_ROLES`, `ALL_ROLES` — 7 sites
- [ ] 4a.28 `lib/auth.ts`: `collaboratorAc`, `additionalFields.role.defaultValue`, `admin({ defaultRole })`, `roles` map
- [ ] 4a.29 `invite-user-dialog.tsx`: `z.enum` list, and **no preselected role**
- [ ] 4a.30 `createUser` requires an explicit validated role, no fallback
- [ ] 4a.31 Warning logged if the unreachable `defaultRole` ever fires
- [ ] 4a.32 Verify: creating a user without a role is refused, not silently defaulted

### Resolution

- [ ] 4a.6 `getEffectivePermissions(userId)`: role defaults − revokes + grants
- [ ] 4a.7 `hasPermission(set, permission)` stays **synchronous**; only arg 1 changes
- [ ] 4a.8 All 27 call sites migrated
- [ ] 4a.9 Resolved once per request, not per call
- [ ] 4a.10 Server actions and the pro-forma gate resolve **fresh**, never from cookie cache
- [ ] 4a.11 Explicit numeric ranks replace `canManageRole`'s array-position comparison
- [ ] 4a.12 Better Auth's `createAccessControl` map updated for the new roles

### Close the enforcement gaps (F3 — ADR 0002 §2.1)

- [ ] 4a.13 **F3:** all 10 actions in `postActions.ts` gated by permission, not `getAdminSession()`
- [ ] 4a.14 **F3 — decision needed:** `Posts.author` is free text with **no `authorId` relation**, so ownership cannot be checked. Either add the relation + backfill, or drop `EDIT_OWN_POST` / `DELETE_OWN_POST` from the enum. ADR 0002 §7 recommends dropping them.
- [ ] 4a.15 `settingsActions.ts` gated by `MANAGE_SITE_SETTINGS`
- [ ] 4a.16 `image-actions.ts` and the upload route tightened to `UPLOAD_MEDIA` / `DELETE_MEDIA` (from S.1)
- [ ] 4a.17 `VIEW_LOCATIONS` added to network read paths
- [ ] 4a.18 Verify: an `EDITOR` can now actually create and publish an article
- [ ] 4a.19 Verify: a `COLLABORATOR` can edit their own draft and **not** someone else's

### Guards

- [ ] 4a.20 A user cannot edit their own permissions
- [ ] 4a.21 `SUPER_ADMIN` permissions cannot be revoked by override
- [ ] 4a.22 `MANAGE_PERMISSIONS` is `SUPER_ADMIN` only
- [ ] 4a.23 Every permission change writes an `activity_log` row: actor, target, permission, direction
- [ ] 4a.41 **Reconcile schema drift found during 2.0:** the live `Permission` enum has 22 values, `main` has 17 — the DB carries `UPLOAD_MEDIA`, `DELETE_ANY_MEDIA`, `DELETE_OWN_MEDIA`, `MANAGE_PROFILE`, `VIEW_ANALYTICS` never committed; `SocialLink` has a redundant index on its PK. No column uses `Permission`, so inert, but `migrate dev` will refuse until reconciled. Three of the five are wanted here anyway — add them to the schema rather than drop them

### Completeness — every action gated, proven not assumed

Client requirement: **all role and permission gates enforce on every action.** Coverage is
asserted mechanically, because a hand-audit of 54 actions decays the moment someone adds the
55th.

- [ ] 4a.33 Inventory every exported server action → the permission it requires, or an explicit `PUBLIC` / `SELF_SCOPED` marking with a reason
- [ ] 4a.34 The inventory lives in the repo, next to `permission-guard.ts`, not in a doc
- [ ] 4a.35 **Automated test** enumerating every `'use server'` export and failing on any not present in the inventory
- [ ] 4a.36 Same coverage test for `app/api/**/route.ts` handlers
- [ ] 4a.37 Verify the test actually fails: add a dummy unguarded action, confirm red, remove it
- [ ] 4a.38 F4: `updateSiteSettings` gated on `MANAGE_SITE_SETTINGS`; consider narrowing it to `SUPER_ADMIN` — arbitrary site-wide script injection
- [ ] 4a.39 F5: `updateUserInformationById` requires a real id; drop the `'default-profile-id'` fallback and the `create` branch
- [ ] 4a.40 F10: use Better Auth's built-in `disableSignUp`; keep the hook as a second layer; add a test asserting sign-up is refused

---

## Phase 4b — Activity log and member view

- [◐] 4b.1 `ActivityLog` model + migration; indexed on `[app, createdAt]` and `[email, createdAt]` (plus `[userId, createdAt]`, `[actorUserId, createdAt]`; columns are ADR 0001 §9 plus `actorUserId`, `actorEmail`, `correlationId`). **Pro-forma mirror done** (`feat/proforma-activity-log`); the frontend model + migration ride with 4a branch 1
- [ ] 4b.2 `proforma_member` SQL view created in the same migration (4a branch 1; ADR 0001 §18 SQL with `lower(u.email)` and the SUPER_ADMIN revoke guard)
- [x] 4b.3 `DbMemberDirectory` reads the view; `getMemberDirectory()` ignores `PROFORMA_ALLOWLIST` in production with a one-time warning (was already on main; test tightened, `example.env` and the in-file comment corrected, they claimed a production bypass that never existed)
- [x] 4b.4 `PROFORMA_ALLOWLIST` is ignored in production by code (4b.3), so an operator leaving it set cannot widen access; the runbook still says to leave it unset
- [x] 4b.5 `lib/activity-log.ts` + both gate routes write `code.requested`, `code.refused` (meta.reason: rate_limited_ip / not_member / banned / rate_limited_email / send_failed), `signin.success`, `signin.failed` (invalid_code / expired / attempts_exhausted / not_member / banned / rate_limited_ip / unknown, Better Auth's code in meta.code), each with IP (same `clientIp` the limiter keys on), user agent (≤512 chars) and the correlation id. **Every write is inside `after()`**; tests pin zero `create` calls at the moment each response exists, and byte-identical responses when the write rejects. Until the 4a migration lands the insert fails P2021, reported once and swallowed
- [ ] 4b.6 Dashboard writes its own auth events to the same table
- [x] 4b.7 Full email in the row; every log line the writer emits carries `maskEmail(email)` (asserted: the logged string holds the masked form, not the address)
- [ ] 4b.8 90-day purge scheduled *(needs answer F)*
- [ ] 4b.9 Verify: revoking `ACCESS_PROFORMA` blocks the **next** request, no redeploy
- [ ] 4b.10 Verify: banning a user blocks an existing pro-forma session
- [ ] 4b.11 CI guard fails a frontend migration touching `user`, `activity_log`, `proforma_*` or the view without a note

---

## Phase 4c — Dashboard UI

- [ ] 4c.1 `dashboard/users/[id]/page.tsx` created, reachable by clicking a row
- [ ] 4c.2 Identity section — `VIEW_USERS`
- [ ] 4c.3 Role section with the change control — `CHANGE_USER_ROLE`
- [ ] 4c.4 Permission section with toggles — `MANAGE_PERMISSIONS`
- [ ] 4c.5 **Provenance shown**: from role / granted / revoked, per permission
- [ ] 4c.6 Activity section, paginated, both apps — `VIEW_ACTIVITY_LOG`
- [ ] 4c.7 Sign-in history with IP and user agent — `VIEW_ACTIVITY_LOG`
- [ ] 4c.8 Profile page shows the signed-in user's own role, using `ROLE_LABELS` / `ROLE_BADGE_CLASSES`
- [ ] 4c.9 Profile page lists own effective permissions, read-only
- [ ] 4c.10 New role badge colours added for `NETWORK_MANAGER` and `SALES`
- [ ] 4c.11 Users list filterable by the new roles
- [ ] 4c.12 Every control hidden without permission **and** refused server-side

### Roles page (decision C and F, 2026-09-03)

- [ ] 4c.13 `dashboard/roles/page.tsx`: a role × permission matrix editing `role_permission`; gated by `MANAGE_PERMISSIONS` (client-adjustable itself)
- [ ] 4c.14 `SUPER_ADMIN` row locked to every permission; a role cannot lose a permission the acting user is relying on to make the change
- [ ] 4c.15 Every change writes `activity_log` `role_permission.changed` with actor, role, permission, direction
- [ ] 4c.16 The pro-forma view and `getEffectivePermissions` pick the change up on the next request, no redeploy (verify live)

---

## Phase 5 — Hardening and tests

- [x] 5.1 **(per address AND source since the security review — one IP could otherwise lock a known address out for an hour, silently; a global per-address ceiling of 20/h still bounds inbox flooding)** Rate limit: 5 code requests per email per hour
- [x] 5.2 **(verify-code has its own bucket at 100/h since the security review — sharing request-code's had halved every NAT's capacity; IPv6 bucketed by /64)** Rate limit: 20 code requests per IP per hour
- [x] 5.3 Rate limit: 60-second gap between sends to one address — a gap refusal does not consume the hourly budget
- [x] 5.4 Verify attempts capped at 5 per code
- [x] 5.5 A breach returns the **generic** response, never a distinct error
- [x] 5.6 Counters keyed on a salted hash, never the raw email or IP
- [x] 5.7 **Rate-limiter failure degrades, it does not block** — `FailOpenStore`: any store error is logged once per process, memory answers for 60 s, the request continues. Identity (`requireMember`) untouched and still fail-closed
- [x] 5.7a Hit order: **IP counter before the directory lookup** (probes count), gap + hourly **after it, members only**. Verified live: 6th same-minute → `gap`, 6th hourly → `email`, 21st from one IP → `ip`, every body byte-identical
- [x] 5.7b `proforma_rate_limit` migrated (`20260902200000_proforma_rate_limit`, applied via `migrate deploy`); the Prisma store took over — no "unavailable" warning after restart, and rows appear in the table on the first request
- [x] 5.8 Origin/Referer check on both POST endpoints, accepting the request's own host so previews work
- [x] 5.9 `noindex` robots header and `no-store` cache header on every response
- [x] 5.10 `robots.txt` disallows all
- [x] 5.11 `tests/gate/request-code.test.ts`, `verify-code.test.ts`: member, non-member, banned, malformed, removed-mid-flow all `toEqual` after correlation-id normalisation; nothing decided before the response (directory/limits/send have zero calls when the response exists). Mutation proof: moving the lookup before `after()` fails 5 tests
- [x] 5.12 `tests/tool/tool-route.test.ts`: signed-out `model.js` → redirect with no body; traversal, encoded slashes, non-allowlisted extensions → 404; frame headers on every gated response
- [x] 5.13 `tests/lib/require-member.test.ts` + verify-code: `getSession` called with `disableCookieCache: true`; banned and directory-removed sessions refused; removed-mid-flow signs out the just-issued `wup.session_token` (wire-level set-cookie expiry is an `it.todo`, it lives in the `nextCookies` after-hook)
- [x] 5.14 Our side pinned in `tests/lib/auth-config.test.ts`: `allowedAttempts` 5, `expiresIn` 600 / `OTP_TTL_SECONDS`, `resendStrategy: 'rotate'`, `disableSignUp`, HMAC `storeOTP`, deferred send. Better Auth's own four behaviours are `it.todo`s citing the live proofs in 2.43–2.45
- [ ] 5.15 Decide the EVpin proxy question — recommendation: first-party `api/evpin-fetch`, repoint `EVPIN_READERS`
- [x] 5.16 Pro-forma on main after the 5b merge: `pnpm test` 219 passed / 5 todo, `typecheck` clean, `lint` clean, `next build` ok. Frontend on main after the sweep merge: `tsc` clean, lint at the pre-existing 40, build 61/61 (Vitest arrives with 4a)

### Review gate

> Reviewers run **once per completed phase**, not per task (user decision, 2 Sep 2026), and only
> when the user says so. **Phase S + Phase 3 batch: security + code review run over the combined
> diff; 2 High, 1 Medium, 3 Should-fix, nits — all folded into the branches before merge.**
> **Phase 2 + Phase 5a: reviewed together once 5a merges** (user decision, 2 Sep) — one
> adversarial security pass and one code-vs-spec pass over the finished gate: `lib/gate.ts`,
> `lib/member-directory.ts`, `lib/rate-limit.ts`, both `app/api/gate/*` routes, `app/login/*`,
> `app/tool/*`, `next.config.ts`.

- [ ] 5.17 Ask whether to run the security review, and on which diff
- [ ] 5.18 Ask whether to run the code review
- [ ] 5.19 Findings addressed, or a written reason for each disagreement
- [ ] 5.20 Re-check after fixes; ask again before re-running reviewers

---

## Phase 6 — Cutover

Follow [RUNBOOK-dns-email-env.md](RUNBOOK-dns-email-env.md). *(needs answers A, B, E)*

- [ ] 6.1 Subdomain spelling confirmed **in writing**
- [ ] 6.2 Squarespace confirmed authoritative; CAA checked; existing records snapshotted
- [ ] 6.3 Secrets generated and stored in the password manager
- [ ] 6.4 Vercel domain added; **CNAME copied from the pro-forma project's own screen**
- [x] 6.5 ~~Resend domain added and verified~~ — **not needed**: the frontend's apex sender is already verified and is shared
- [ ] 6.6 DNS records created; **nothing existing edited or deleted** — **except one deliberate edit**: the apex SPF must gain `include:amazonses.com` (see 6.6a)
- [ ] 6.6a **Deliverability (found in 2f):** the apex SPF is `v=spf1 include:_spf.google.com -all` — Resend/SES is not in it, so every code email **fails SPF**; DMARC (`p=quarantine`) passes on DKIM alone, so Gmail delivers to Spam rather than rejecting. Edit the apex TXT to `v=spf1 include:_spf.google.com include:amazonses.com -all`. This replaces the `send.` subdomain the PRD used to sidestep exactly this
- [ ] 6.7 Apex, `www` and MX verified unchanged against the snapshot
- [ ] 6.8 Production env vars set, then **redeployed** — Vercel bakes them at build time
- [ ] 6.9 Part 6 verification block passes in full
- [ ] 6.10 Team told: **everyone is signed out at cutover** (cookie name changed)
- [◐] 6.11 OTP email in Gmail: **logo was broken — SVG `<img>`, which Gmail/Outlook refuse; fixed with Cloudinary `f_png` renditions in both apps' mail bases** (also fixes the dashboard's reset/invite mail). Spam placement: SPF fix pending (K). Outlook render still to check
- [ ] 6.12 `SITE_PASSWORD` and its entire code path deleted — no half-removal
- [ ] 6.13 `DEPLOY.md` and `README.md` updated: subdomain, the new gate, the build step
- [ ] 6.14 Old password-gated deployment retired
- [ ] 6.15 **Two weeks later:** subdomain absent from Google's index

---

## Phase B — Security backlog

Lower-severity findings from [SECURITY-FINDINGS.md](SECURITY-FINDINGS.md). Not urgent, but
tracked here so they are not lost. None blocks any other phase.

- [ ] B.1 **F11:** migrate GTM and the admin-injected script fields to a CSP nonce, then drop `script-src 'unsafe-inline'`
- [ ] B.2 **F11:** this also closes F4's root cause — the CSP currently cannot mitigate admin-injected script by design
- [x] B.3 **F12:** `lib/cloudinary.ts` is `import 'server-only'` and reads `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` only; `example.env` regrouped, cloud name stays public for delivery URLs. **Operator:** delete `NEXT_PUBLIC_CLOUDINARY_API_KEY` from Vercel and local envs, nothing reads it (runbook)
- [x] B.4 **F6:** `updateEmail` confirms the password with `auth.api.verifyPassword`, Better Auth 1.7.2's server-scoped endpoint (session from the request headers, credential row and `ctx.context.password.verify` inside the library, `scope: "server"` so never routed under `/api/auth`); the account table is no longer read and the scrypt parse is gone. Pinned by `wattup-frontend/tests/actions/auth-actions.test.ts`: "is decided by Better Auth's verifyPassword, given the submitted password and the same headers, before changeEmail", "never reads the account row", and "is refused with the existing message, and changeEmail is never called". Vitest 4.1.11 added to the frontend for it (`pnpm test`, 15 tests)
- [x] B.5 **F6:** nothing left to re-check: the app no longer holds the hash format, so a `better-auth` upgrade cannot break the check silently; if the parse ever came back, the "never reads the account row" test fails. Residual found on the way, pre-existing and outside B.4: `lib/auth.ts` sets no `user.changeEmail.enabled`, so `auth.api.changeEmail` throws CHANGE_EMAIL_DISABLED and the email change never completes (pinned by "reports a changeEmail failure by its message"); recorded under F6 in SECURITY-FINDINGS
- [x] B.6 **F7:** `lib/contact-rate-limit.ts`, 5 per address per 10 min in a bounded Map (500 keys, oldest window evicted), HMAC(BETTER_AUTH_SECRET) keys, IPv6 by /64 (copied from the pro-forma limiter, noted in file), fails open; both actions check it before validation. Proven by a direct-call script (6th hit refused, window reset, eviction, header parsing)
- [ ] B.7 Re-run `pnpm audit`; triage whatever remains after the F8 upgrades
- [ ] B.8 `searchArticles` is `'use cache'` with no `cacheTag('posts')` — suggestions go stale for the cache window after a publish/unpublish (pre-existing, found in review)
- [ ] B.9 `/api/upload-image` buffers the whole body with no size limit (Vercel caps at 4.5 MB; a standalone host does not), and every upload/delete calls `revalidatePath('/')` — any signed-in user can bust the homepage cache on demand
- [ ] B.10 Rate-limit storage → `database` or secondary storage once a `rateLimit` table can be migrated (see S.4.6)
- [x] B.11 **`dompurify` 3.4.1 → 3.4.14** (`pnpm audit` dompurify advisories 10 → 0, total 109 → 106) — it is the sanitiser in front of `dangerouslySetInnerHTML` for rich text; 4 low + 6 moderate advisories (found by the F8 audit)
- [ ] B.12 App-level `zod` 3 → 4: `better-auth`/`better-call` run on zod 4 internally while `lib/validations/` uses 3.25 — works today via separate lockfile snapshots, but a peer warning on every install and two zod copies in the bundle
- [◐] B.16 **F18:** eleven public ids in `lib/images/*.ts` were missing from the Cloudinary account; **4 fixed, 7 left.** Fixed: `hero1Md` (home.ts, the site-wide OG image) → `og-image_wk8avs`, an unreferenced but correctly-sized (1200x630) OG asset already in the account; `forDriverPageHero`/`forDriverPageHeroMobile` (drivers.ts, the drivers hero fallback) → `hero-image_ajsueo` / `hero_image_layered_mobile_np7nxt`, the same-folder assets the live `/for-drivers` route already renders; `corePrincipals` (about.ts) → repointed to `public/assets/images/about/core-principals.png`, since no Cloudinary sibling or search hit exists — note `components/about/core-principles.tsx`, its only consumer, is currently commented out on the about page, so this was not actually reachable on a live page despite the audit's wording. Also fixed a related bug found while verifying: `app/layout.tsx` built the OG tag from the bare public id (`homeImages.hero1Md`) instead of the built URL (`homeImageUrls.hero1Md`), so it always 404ed as a broken relative path regardless of the id. Left, each with a `// MISSING (F18):` comment in `lib/images/home.ts` naming what was looked for: `hero1`, `hero2`, `hero2Md`, `homepageHero1`, `slide_1_full`, `slide_2_full`, `slide_3_full` — none has a same-name sibling or a cloudinary search hit, and all are confirmed unused by any component or page today. `scripts/check-image-ids.ts` added: HEAD-checks every URL `lib/images/` builds, exits 1 on any non-200; run today, 180/187 ok, the 7 failures are exactly the seven left above. Read-only against Cloudinary and the database throughout. `fix/missing-image-ids`
- [ ] B.15 **Dashboard cookie-cache tail (found in 0.17):** `lib/auth.ts` keeps `cookieCache` at 5 min and `proxy.ts` checks cookie presence only, so a *captured* `session_data` cookie keeps rendering dashboard **pages** for up to 5 min after sign-out or ban (a real browser drops the cookies on sign-out — the normal path 307s). Server actions resolve fresh per ADR D13, so no writes; reads only. Same class as the pro-forma finding fixed with `disableCookieCache` on gated requests — apply it to `getSession()` in the dashboard's page shells, or accept and record
- [x] B.14 **Email dark mode, properly:** the shared mail base's dark block darkens the cards but leaves text `#2d2d2d`, and it has no `<meta name="color-scheme">`, so clients that honour `prefers-color-scheme` (Apple/iOS Mail) render light, and adding the metas without fixing text colours would make them unreadable. The logo is now self-backgrounded so it survives Gmail's inversion; a real dark theme for the dashboard's and pro-forma's mail needs a design pass on the frontend's `lib/mail/base.ts` (text/muted/border colours), then resync the copy. Done on `feat/email-dark-mode` (`d5020ac` frontend, `bdf61ed` pro-forma): both colour-scheme metas plus `:root`, one `DARK_RULES` list emitted as the media block and as `[data-ogsc]`/`[data-ogsb]` twins, values from `.dark` in `globals.css` as hex, light text as solid hex so Gmail's inversion has no alpha to composite; verified by `pnpm exec tsx scripts/render-mail.ts` (5 templates, "dark coverage OK") and a scratch render of the OTP mail; `lib/mail-base.ts` resynced (diff: header and port only). Gates: frontend tsc + build clean, lint baseline unchanged; pro-forma tsc, lint, 256 tests, build clean. Not verified in a real Outlook.com or Gmail dark client yet
- [ ] B.13 `next dev` 16.3 writes a `nextjs-agent-rules` block into `CLAUDE.md`/`AGENTS.md` on every run — committed in both apps now so the tree stays clean; if Next changes the text, recommit rather than fight it

---

## PR queue — merge in this order

> **Who ticks.** Since 2026-09-03 the agent that builds a branch ticks its own items above, with one evidence clause each, and inserts its row here before the `docs/tracking` row, in one final docs commit on its branch. The integrator resolves numbering overlaps at merge and uses `docs/tracking` only for items no branch owns. Everything is merged into local `main` in this order; nothing is pushed until the client's Vercel answer (B, 0.18).

Client decision (3 Sep): nothing is pushed until everything is done and tested locally. Every task
lives on its own branch; `main` is the local integration branch we test against. At the end, each
branch is pushed and merged **in this order**, one PR each, so every PR shows only its own commits.
Docs updates now ride `docs/tracking` (merged into local `main` after each update) and go last.

| # | Branch | Tip | Landed in local main as |
|--:|---|---|---|
| 1 | `docs/proforma-planning` | `dd19925` | fast-forward (early, linear) |
| 2 | `chore/monorepo-restructure` | `9d06724` | fast-forward (early, linear) |
| 3 | `fix/f14-reset-form-bypass` | `c8b2ec2` | `0d6b63f` |
| 4 | `fix/f9-auth-rate-limit` | `44c3ef1` | `cb3117a` |
| 5 | `fix/f2-article-drafts` | `d2b11e1` | `e44b143` |
| 6 | `fix/f13-seed-on-build` | `d0e098a` | `596c71e` |
| 7 | `fix/f1-upload-auth` | `3b3fc60` | `73b3bf0` |
| 8 | `feat/proforma-mount-tool` | `88f9832` | `093f262` |
| 9 | `feat/proforma-member-directory` | `0beef36` | `e011728` |
| 10 | `fix/f8-dependency-upgrade` | `c0cfe86` | `26b31de` |
| 11 | `feat/proforma-gate-routes` | `eae2c4b` | `445ba58` |
| 12 | `feat/seed-additional-admins` | `805c120` | `c25dca2` |
| 13 | `fix/seed-admins-role-and-password` | `8c53103` | `0a1148b` |
| 14 | `fix/seed-admins-no-autosignin` | `8a218e9` | `bac0f22` |
| 15 | `feat/proforma-otp-email-brand` | `0374a24` | `6af4ee9` |
| 16 | `feat/proforma-login` | `d038ab2` | `7415c12` |
| 17 | `fix/f15-account-issuer` | `ff7cac0` | `eadba94` |
| 18 | `fix/email-logo-png` | `ed49020` | `c62de28` |
| 19 | `fix/email-logo-self-backgrounded` | `1c550aa` | `9887cc5` |
| 20 | `feat/proforma-hardening` | `3eb41d6` | `c955fa5` |
| 21 | `chore/login-form-stale-comment` | `bd496ad` | `8a00394` |
| 22 | `fix/gate-review-round-2` | `b91edf4` | `cbea111` |
| 23 | `fix/gate-security-round-2` | `830a17f` | `dfd55fa` |
| 24 | `chore/frontend-backlog-sweep` | `2581934` | B.11 dompurify 3.4.14, B.3/F12 server-only Cloudinary, B.6/F7 contact limiter. Gate on main after merge: tsc clean, lint baseline 40, build 61/61 |
| 25 | `feat/proforma-tests` | `9bbf8c4` | 5b: Vitest 4.1.11, 11 files, 219 tests + 5 todo; tests and config only, no app code. Two mutation proofs in the report |
| 26 | `feat/proforma-activity-log` | `2484fcd` | 4b pro-forma side: `ActivityLog` mirror, never-throwing writer, four `after()` writes, production directory rule. 256 tests. Gate on main: build, typecheck, lint, test green |
| 27 | `feat/email-dark-mode` | `bdf61ed` | B.14: colour-scheme metas, complete dark block with Outlook twins, solid light text, render script + coverage check in both mail bases (pro-forma copy resynced); one docs tick commit sits on top. Gate: frontend tsc + build clean (lint baseline 40 unchanged), pro-forma tsc, lint, 256 tests, build clean |
| 28 | `fix/auth-actions-credential-check` | `fd1cc02` | B.4/B.5, F6: `updateEmail` verifies through `auth.api.verifyPassword`, no hash read or parsed; Vitest 4.1.11 added to the frontend with 15 tests. Gate: tsc clean, lint at the 40 baseline, test 15/15, `next build` green. The docs commit for this row sits on top of `fd1cc02` |
| 29 | `chore/cloudinary-audit` | `17446dd` | S.1.7: `docs/plan/CLOUDINARY-AUDIT.md` only, no code, nothing deleted; Cloudinary and the database were read, never written |
| 30 | `fix/missing-image-ids` | `8cb620b` | B.16/F18: 4 of 11 missing ids repointed (`hero1Md`, `forDriverPageHero`, `forDriverPageHeroMobile`, `corePrincipals`), 7 left with `// MISSING (F18)` comments (unused dead code, no candidate found); fixed a related `app/layout.tsx` OG-URL bug found while verifying; `scripts/check-image-ids.ts` added as a regression check. Cloudinary and the database read-only throughout. Gate: tsc clean, lint baseline 40 unchanged, test 15/15, build 61/61. The docs commit for this row sits on top of `8cb620b` |
| 31 | `docs/tracking` | (moving) | last — checklist, ADRs, findings, runbook |

36 commits sit directly on `main` (early fast-forwards and the docs commits made before this rule); the docs ones are folded into `docs/tracking` at the end by cherry-pick.

---

## Notes

Use this space for anything half-done, blocked, or decided differently from the plan.

| Date | Item | Note |
|---|---|---|
| | | |
