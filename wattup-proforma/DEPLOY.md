# Deploying wattup-proforma

For the operator. What is built and how it behaves is `README.md` and `AGENTS.md`; this is
the Vercel project, the domain, the environment, the migration order and the cutover.

## The Vercel project

A second, separate Vercel project against the same GitHub repository as `wattup-frontend`,
never the same project:

| Setting | Value |
|---|---|
| Root Directory | `wattup-proforma` |
| Framework preset | Next.js |
| Include files outside Root Directory | off |
| Ignored Build Step | `git diff --quiet HEAD^ HEAD -- .`, run from this project's own Root Directory, so a push touching only `wattup-frontend` does not trigger a rebuild here |
| Node.js Version | 20.x or newer. Not pinned in this app's `package.json`; the frontend pins `>=20.9.0` in its own, and this app should not fall below that floor. Set it under Settings → General if the project default ever drifts under it |

Before creating it, confirm which Vercel account or team it belongs to (runbook Part 0.1,
question B). If it differs from the account holding `wattupusa.com`, Vercel asks for a
`_vercel` TXT verification record that is not in the PRD's DNS table; find that out before the
DNS work, not during it.

## The subdomain

Nothing in the code names a host. The subdomain is whatever `NEXT_PUBLIC_APP_URL` and
`BETTER_AUTH_URL` say, both pointed at the same origin. **Default: `proforma.wattupusa.com`**
(client decision A, 2026-09-03). The PRD's `hostproposal.wattupusa.com` works too, by setting
the env accordingly; no file needs editing either way.

The DNS steps (the Vercel CNAME target, the Squarespace record, verification) are operator
work with a common failure mode of its own, see
[`../docs/plan/RUNBOOK-dns-email-env.md`](../docs/plan/RUNBOOK-dns-email-env.md) Parts 2 and 4.
**Copy the CNAME target from this project's own Domains screen**, never from `www`'s: Vercel
issues a different target per project, and reusing the wrong one is the runbook's single most
common failure.

## Environment variables

Set on the wattup-proforma project, all three environments (Production, Preview, Development)
unless noted. Vercel bakes these in at build time: set them before the first deploy, or
redeploy after changing one. Values are never recorded here, only their shape and source.

| Variable | Required | Source | Production value shape |
|---|:--:|---|---|
| `DATABASE_URL` | yes | the shared Postgres, **pooled** endpoint (see below) | `postgresql://...pooler...` |
| `BETTER_AUTH_SECRET` | yes | generated for this app, `openssl rand -hex 32` | 64 hex characters, **different from the frontend's** |
| `BETTER_AUTH_URL` | yes | this app's own origin | `https://proforma.wattupusa.com` |
| `NEXT_PUBLIC_APP_URL` | yes | same origin as `BETTER_AUTH_URL` | `https://proforma.wattupusa.com` |
| `RESEND_API_KEY` | yes | **identical to the frontend's**, client decision 2 Sep 2026 | Resend API key |
| `MAIL_FROM` | yes | **identical to the frontend's** | `WattUp <noreply@wattupusa.com>` |
| `MAIL_REPLY_TO` | no | leave unset; the sender is `noreply` on purpose (decision E) | (not set) |
| `PROFORMA_ALLOWLIST` | no | **never set in Production** (see below) | Preview/Development only, comma-separated addresses |
| `SESSION_TTL_DAYS` | no | optional, default `7` | positive integer |
| `OTP_TTL_SECONDS` | no | optional, default `600` | positive integer |

### The pooled `DATABASE_URL` rule

Two serverless apps against one Postgres multiply connections. `DATABASE_URL` here must be the
**pooled** connection string (PgBouncer or the Neon pooler), never the direct one. The frontend
may use either; this app must not use the direct one.

### `BETTER_AUTH_SECRET` must differ from the frontend's

If both apps shared a secret and a `session` table, a session minted here would be a
structurally valid dashboard session; separate secrets and separate session tables
(`proforma_session`, mapped in this app's schema) make that false by construction, not by
convention. Rotating this app's secret signs out every pro-forma user and touches nothing in
the dashboard, which is the intended break-glass path. Do not use the same value twice.

### `PROFORMA_ALLOWLIST` must be unset in production

It is a development convenience only. The code itself ignores it in production even when it
is set, `getMemberDirectory()` logs one warning and answers from the `proforma_member` view
regardless (checklist 4b.4), so a leftover value cannot widen access. Leave it unset in
Production anyway: a set-but-ignored variable is a misconfiguration worth not having.

## Migrations: this app never runs one

`wattup-proforma` has no `migrate` or `db push` script and `prisma.config.ts` declares no
migrations path, deliberately. `wattup-frontend` owns the schema and is the only app that
migrates it, with `prisma migrate deploy`. Before this app is deployed for the first time,
confirm every migration below has been applied to the target database, in order:

| Migration | Status | What it gives this app |
|---|---|---|
| `20260902180000_proforma_auth_tables` | applied | `proforma_session`, `proforma_account`, `proforma_verification`, without these a sign-in cannot write a session |
| `20260902190000_account_issuer` | applied | the `issuer` column Better Auth 1.7 requires on `proforma_account` |
| `20260902200000_proforma_rate_limit` | applied | `proforma_rate_limit`; until it exists the limiter runs in memory only (fails open, ADR 0001 section 10, not a launch blocker, but per-instance limits on serverless are weaker) |
| `20260903100000_rbac_permissions` | **applied 2026-09-03** | `activity_log`, `role_permission`, `user_permission`, and the **`proforma_member` view**, which is the migration that turns membership on. Until it lands, every membership lookup answers no member (fail closed) and every audit write is a no-op (logged once, never thrown) |
| `20260903110000_auth_rate_limit` | **pending, not yet applied** | `auth_rate_limit`, the frontend's own Better Auth rate-limit table (finding F9); this app neither reads nor writes it. Named here only so migrations are applied in the order they were written |

`proforma_member` existing is the one that matters most: before it, `DbMemberDirectory` catches
Prisma's P2021 and treats it as no member (fail closed, checklist 2.13), so a deploy ahead of
that migration is safe but useless, nobody can sign in.

**Also new, on the frontend, from the same wave of work as the two migrations above:**
`CRON_SECRET` and `ACTIVITY_LOG_RETENTION_DAYS`. These are `wattup-frontend`'s own environment
variables, not this app's, and they gate a daily Vercel cron that purges `activity_log`, the
same table this app writes to. `CRON_SECRET` is required in the frontend's Production
environment (`openssl rand -hex 32`; Vercel sends it as `Authorization: Bearer` on the cron
call, and the purge route answers 401 to anything else, including every call while it is
unset). `ACTIVITY_LOG_RETENTION_DAYS` is optional, default `90`, and should stay unset until
the client confirms the number, open question F. Set both on the frontend project at the same
time as this app's cutover, since they touch the table both apps share.

## Cutover checklist

Operator order, following
[`RUNBOOK-dns-email-env.md`](../docs/plan/RUNBOOK-dns-email-env.md) and Phase 6 of
[`CHECKLIST.md`](../docs/plan/CHECKLIST.md):

1. Confirm the subdomain spelling in writing (`proforma` vs `hostproposal`), and which Vercel
   account owns this project.
2. Confirm Squarespace is authoritative, check for a blocking CAA record, snapshot the
   existing DNS (apex A, `www` CNAME, MX, TXT) so a mistake is provable.
3. Generate `BETTER_AUTH_SECRET` for this app and store it in the password manager.
4. Add the domain on this Vercel project; copy the CNAME target from this project's own
   Domains screen.
5. Create the DNS record at Squarespace (add only, never edit or delete an existing row), plus
   the `_vercel` TXT if Vercel asked for one. Verify with `dig`.
6. Set every environment variable in the table above, in Production. Confirm the migrations
   table above is fully applied against the target database, `20260903100000_rbac_permissions`
   included.
7. Set `CRON_SECRET` (and `ACTIVITY_LOG_RETENTION_DAYS` if the client has answered) on the
   frontend project.
8. Redeploy this project, variables are baked in at build time, so a deploy started before
   they were set stays broken.
9. Run the verification block below in full.
10. Tell the team: everyone already using the old shared-password build is signed out at
    cutover, because the cookie name changes.
11. Retire the old password-gated deployment only after verification passes.

## Verification

```bash
DOMAIN=proforma.wattupusa.com   # or hostproposal.wattupusa.com, whichever was chosen

# 1. / redirects to the tool, which redirects a signed-out visitor to /login
curl -sI "https://$DOMAIN/" | head -1                         # expect 307 or 302

# 2. /login itself is reachable, ungated
curl -sI "https://$DOMAIN/login" | head -1                    # expect 200

# 3. A gated file is not reachable signed out. THE important check.
curl -sI "https://$DOMAIN/tool/js/model.js" | head -1          # expect a redirect (302), never 200 JS

# 4. Search engines are told to stay away
curl -sI "https://$DOMAIN/" | grep -i "x-robots-tag"           # noindex, nofollow
curl -s  "https://$DOMAIN/robots.txt"                           # Disallow: /

# 5. Enumeration: byte-identical for a member and a non-member
curl -s -X POST "https://$DOMAIN/api/gate/request-code" \
     -H 'content-type: application/json' -d '{"email":"<a real member>"}'
curl -s -X POST "https://$DOMAIN/api/gate/request-code" \
     -H 'content-type: application/json' -d '{"email":"nobody@example.com"}'
```

By hand:

- [ ] A member receives the code within 30 seconds and it signs them in; a non-member receives
      no email and the screen behaves identically.
- [ ] The code fails after 5 wrong attempts and after its expiry.
- [ ] Revoking `ACCESS_PROFORMA` in the dashboard blocks the next sign-in request.
- [ ] The sign-in appears in the dashboard's activity log with IP and user agent.
- [ ] The OTP email is not flagged as spam. This needs the apex SPF fix
      (`include:amazonses.com`, runbook Part 3 and checklist 6.6a); until then DKIM alone
      delivers to Spam rather than the inbox.
- [ ] `wattupusa.com` and `www` still serve the marketing site unchanged, and company email
      still flows.

## Rollback

| Symptom | What to flip back |
|---|---|
| Subdomain 404s | Wrong CNAME target, almost certainly `www`'s. Re-copy from this project's own Domains screen. |
| TLS error | Certificate not issued; check the CAA record. |
| Codes not arriving | Check Resend's delivery log before touching DNS or the API key. |
| Site returns 503 | A required variable is missing, the fail-closed path working as designed. Set it and redeploy. |
| Everyone signed out unexpectedly | `BETTER_AUTH_SECRET` changed. Restore the value from the password manager. |
| Company email stops | Nothing here touches apex MX or SPF (the one deliberate SPF edit is additive, `-all` kept). Compare against the pre-cutover DNS snapshot and restore any row that changed. |

To abandon the cutover entirely, remove the subdomain's CNAME record. It stops resolving, the
old password-gated build (still live until checklist 6.14 retires it) is unaffected, and no
other DNS record is touched. The Resend and `_vercel` records are harmless to leave in place.
