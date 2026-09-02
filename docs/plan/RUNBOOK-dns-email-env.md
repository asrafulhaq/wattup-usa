# Runbook — DNS, Resend and environment variables

Everything in this document is **operator work**, not code. It is written to be executed in
order, top to bottom, with a verification step after each part.

**Do not start part 2 until the two blockers in part 0 are answered.**

| Part | What | When |
|:--:|---|---|
| 0 | Blockers and pre-flight checks | before anything |
| 1 | Secrets you generate | any time |
| 2 | Vercel: the subdomain | cutover |
| 3 | Resend: the sending domain | can be done early |
| 4 | Squarespace: all DNS records | cutover |
| 5 | Environment variables, both apps | before first deploy |
| 6 | End-to-end verification | cutover |
| 7 | Rollback | if needed |

---

## Part 0a — Operator to-do, client-owned (decided 2026-09-03)

These are yours, not the code's. Nothing in the repository depends on them except the push.

| | Item | Where |
|---|---|---|
| A | The pro-forma subdomain is whatever `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` say. **Default: `proforma.wattupusa.com`.** The PRD's `hostproposal` works too: set the env, nothing in code names the host | Part 2, Part 4, Part 5 |
| B | Vercel: frontend project Root Directory → `wattup-frontend` **saved before the first push** (checklist 0.18); Ignored Build Step on both projects (0.19, 1.7); a second project with Root Directory `wattup-proforma` (1.6); domains (Part 2); env (Part 5) | Part 2, Part 5 |
| J | Resend account owner login: obtain it (or be added as a team member) so the key can be rotated and the sending domain checked from the dashboard | Part 3 |
| K | Apex SPF: add `include:amazonses.com` to `wattupusa.com`'s SPF TXT so code emails stop failing SPF and landing in Spam | Part 3, 6.6a |
| E | No `Reply-To`: the sender is `noreply` by decision; nothing to set up | Part 3 |

---

## Part 0 — Blockers and pre-flight

### 0.1 Two answers needed first

**Subdomain spelling.** The source docs and the PRD disagree:

| Source | Says |
|---|---|
| `docs/Pro-Forma source/DEPLOY.md` line 3 | `hlproposal.wattupusa.com` |
| `docs/Pro-Forma source/README.md` heading | `hlproposal.wattupusa.com` |
| PRD, and the client verbally | `hostproposal.wattupusa.com` |

Get this in writing before creating any record. This runbook assumes **`hostproposal`**. If it
changes, only two documentation files need editing; no code depends on the name.

**Which Vercel account owns the pro-forma project.** If it is not the account that already
holds `wattupusa.com`, Vercel will require a `_vercel` TXT verification record — which is
**absent from the PRD's DNS table**. Find out now, not at the record-creation step.

### 0.2 Confirm Squarespace is authoritative

```bash
dig +short NS wattupusa.com
```

Expect Squarespace nameservers. If it returns something else — Cloudflare, Route 53, the
registrar's own — then **that** is where the records go, and the Squarespace instructions in
part 4 do not apply.

### 0.3 Check for a CAA record that would block certificate issuance

```bash
dig +short CAA wattupusa.com
```

Empty output is good: any CA may issue. If records exist, they must include `letsencrypt.org`
or Vercel cannot provision the certificate and the subdomain will serve a TLS error.

### 0.4 Record what exists today, so you can prove you broke nothing

```bash
dig +short A wattupusa.com
dig +short CNAME www.wattupusa.com
dig +short MX wattupusa.com
dig +short TXT wattupusa.com
```

Save that output. **Nothing in this runbook edits or deletes any of it.** The apex records, the
`www` CNAME and the MX records that carry company email are untouched throughout.

---

## Part 1 — Secrets you generate

Generate these now; they are needed in part 5. Generate **two different** auth secrets — the
apps must not share one, so that rotating the pro-forma's does not sign out the dashboard.

```bash
# wattup-proforma
openssl rand -hex 32

# wattup-frontend, only if you are rotating it — otherwise keep the existing value
openssl rand -hex 32
```

Store both in your password manager before pasting them into Vercel. A lost
`BETTER_AUTH_SECRET` signs out every user in that app.

---

## Part 2 — Vercel: attach the subdomain

1. Open the **wattup-proforma** project (the one whose Root Directory is `wattup-proforma`).
2. **Settings → Domains → Add** → `hostproposal.wattupusa.com`.
3. Vercel shows a CNAME target. **Copy it exactly, including the trailing period.**

> **The single most common failure in this whole runbook:** Vercel issues a *different* CNAME
> target per project. Do not reuse the value that `www` points at. It also resolves to Vercel
> and looks correct, but it identifies the **marketing** project, and the result is a 404 that
> presents as a DNS fault and wastes an afternoon.

4. If Vercel asks for domain verification via a `_vercel` TXT record, the project is in a
   different account from the one holding `wattupusa.com` (see 0.1). Note the record; it goes
   in at part 4 alongside the rest.

---

## Part 3 — Resend: the sending domain

> **VOID as of 2 Sep 2026.** The client decided the pro-forma app uses the frontend's existing
> Resend key and its already-verified apex sender `noreply@wattupusa.com`.
>
> **One consequence, found when the first real code landed in Spam:** the apex SPF record is
> `v=spf1 include:_spf.google.com -all` and does not include Resend's sending infrastructure
> (Amazon SES), so every email from the apex **fails SPF**. DKIM is in place and DMARC is
> `p=quarantine`, so mail is delivered on DKIM alone, but to Spam. **Edit the existing apex
> `TXT` to** `v=spf1 include:_spf.google.com include:amazonses.com -all` — one record, one
> added `include:`; keep `-all`. Verify with `dig +short TXT wattupusa.com`. This is the single
> exception to "never edit an existing record" in this runbook, and it also fixes the
> dashboard's own password-reset and invite emails, which have had the same problem. **Do not add
> `send.wattupusa.com` to Resend and do not create rows 2–6 in Part 4.** Only the
> `hostproposal` CNAME (row 1), the `_vercel` TXT if asked (row 7), and the `_dmarc` check
> (row 8) remain. Kept below for the record.

Sending is from the subdomain `send.wattupusa.com`, **never the apex**. This is required, not a
preference: only one SPF record is permitted per domain, and an apex SPF does not cover
subdomains. Using a subdomain means none of this touches the SPF record that authenticates
company email.

1. Resend → **Domains → Add Domain** → `send.wattupusa.com`.
2. Pick the region closest to your users. **The MX value is region-specific**, so this choice
   changes the records you are about to copy.
3. Resend now lists the DNS records. **Copy them from that screen verbatim.**

Expect roughly this shape:

| Type | Name | Value | Note |
|:---:|---|---|---|
| MX | `send` | `feedback-smtp.<region>.amazonses.com` (priority 10) | bounce and complaint return path |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | SPF |
| CNAME | `<selector>._domainkey` | `<selector>.dkim.amazonses.com.` | **DKIM, ×3** |
| CNAME | `links` | `links1.resend-dns.com` | only if link tracking is on |

> **Do not copy record *types* from the PRD.** The PRD's DNS table lists DKIM as a single `TXT`
> at `resend._domainkey.send`. Resend's current domain API returns DKIM as **three CNAME
> records**. Resend has shipped both shapes historically and it varies by account and region,
> so the dashboard is the authority and the PRD table is not.

4. Create an API key scoped to **sending only**, for this domain. Do not reuse the dashboard's
   key — a separate key can be revoked without taking down password-reset email.

---

> **Account ownership (open question J):** the Resend account holding `wattupusa.com` has API
> keys named `Wattup USA` and `Wattup`, created 18–19 May 2026, and its owner login is not known
> to the team. Ask the client for the login (or to add a team member) before cutover, so key
> rotation and dashboard checks are possible without going through a third party.
>
> **Key permission:** the shared key should be **`sending_access`**, not full access. Resend's
> API returns the body of any sent message to a full-access key, which makes the key a
> pro-forma sign-in credential for anyone who holds it (security review). A sending-only key
> cannot retrieve sent mail. Set this when creating or rotating the key.

---

## Part 4 — Squarespace: create the records

Squarespace → **Settings → Domains →** `wattupusa.com` **→ DNS Settings → Custom Records**.

**Two Squarespace-specific rules:**

- The **Host** field takes the label only — `hostproposal`, `send`, `resend._domainkey.send`.
  Squarespace appends `.wattupusa.com` itself. Typing the full domain produces
  `hostproposal.wattupusa.com.wattupusa.com`, which silently does nothing.
- **Add only. Never edit or delete an existing row**, in particular the apex `A` records, the
  `www` CNAME, and the `MX` records.

Records to add:

| # | Type | Host | Value | From |
|:--:|:---:|---|---|---|
| 1 | CNAME | `hostproposal` | Vercel's target, trailing period included | part 2 |
| 2 | MX | `send` | `feedback-smtp.<region>.amazonses.com`, priority 10 | part 3 |
| 3 | TXT | `send` | `v=spf1 include:amazonses.com ~all` | part 3 |
| 4 | CNAME | `<selector1>._domainkey.send` | from Resend | part 3 |
| 5 | CNAME | `<selector2>._domainkey.send` | from Resend | part 3 |
| 6 | CNAME | `<selector3>._domainkey.send` | from Resend | part 3 |
| 7 | TXT | `_vercel` | Vercel's verification value | part 2, **only if asked** |
| 8 | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:<inbox>` | **only if none exists** |

**Record 8, carefully.** Check first:

```bash
dig +short TXT _dmarc.wattupusa.com
```

If that returns anything, **stop and leave it alone** — it governs email for the whole domain
including company mail. Only create it when the result is empty. `p=none` is monitor-only and
changes no delivery behaviour.

### Verify DNS

Propagation is usually minutes. Then:

```bash
dig +short CNAME hostproposal.wattupusa.com     # Vercel's target
dig +short MX    send.wattupusa.com             # feedback-smtp...
dig +short TXT   send.wattupusa.com             # v=spf1 include:amazonses.com ~all
dig +short CNAME <selector1>._domainkey.send.wattupusa.com

# Prove nothing was disturbed — compare against what you saved in 0.4
dig +short A     wattupusa.com
dig +short MX    wattupusa.com
dig +short CNAME www.wattupusa.com
```

Then click **Verify** in Resend, and confirm Vercel shows the domain as valid with a certificate
issued.

---

## Part 5 — Environment variables

Vercel bakes variables in at build time. **A deployment created before the variables were set
stays broken until it redeploys.** Set them first, then deploy.

Tick all three environments — Production, Preview, Development — unless noted.

### wattup-proforma

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | the **pooled** connection string | Not the direct one. Two serverless apps on one Postgres multiply connections. |
| `BETTER_AUTH_SECRET` | from part 1 | **Different from the dashboard's.** |
| `BETTER_AUTH_URL` | `https://hostproposal.wattupusa.com` | Preview: leave Vercel's URL. |
| `RESEND_API_KEY` | **identical to the frontend's** | Client decision, 2 Sep. |
| `MAIL_FROM` | `WattUp <noreply@wattupusa.com>` | **Identical to the frontend's.** Apex sender, already verified. |
| `MAIL_REPLY_TO` | a **monitored** inbox | Not no-reply. Open question D. |
| `PROFORMA_ALLOWLIST` | comma-separated emails | **Preview and Development only.** Never set in Production — it bypasses the database check. |
| `SESSION_TTL_DAYS` | `7` | Optional, this is the default. |
| `OTP_TTL_SECONDS` | `600` | Optional, this is the default. |

### wattup-frontend

Existing variables are unchanged. Confirm these are present and correct after the restructure,
since the Root Directory change means a fresh build:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | unchanged |
| `BETTER_AUTH_SECRET` | unchanged — do not rotate during this work |
| `BETTER_AUTH_URL` | `https://wattupusa.com` |
| `RESEND_API_KEY` | unchanged, keeps its own key |
| `MAIL_FROM`, `MAIL_REPLY_TO` | unchanged |
| Cloudinary, Mapbox | unchanged |

### Full environment inventory — for a move to a different Vercel account

The client may move both projects to a fresh Vercel. If that happens, **every variable below
has to be recreated by hand** — Vercel does not carry environment variables across accounts,
and a missing one produces a build that succeeds and a site that fails at runtime.

Values are not recorded here. Read them from the current project's settings, or from
`wattup-frontend/.env`, and move them through your password manager rather than a chat window.

**`wattup-frontend` — 25 variables currently set:**

| Group | Variables |
|---|---|
| Database | `DATABASE_URL` |
| Auth | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` |
| Bootstrap | `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` — **see finding F13** |
| Email | `RESEND_API_KEY`, `MAIL_FROM`, `CONTACT_EMAIL` |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_URL` |
| Cloudinary, public | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` only (delivery URLs). **`NEXT_PUBLIC_CLOUDINARY_API_KEY` is read by nothing since F12 was fixed: delete it from Vercel and from every `.env`** |
| Maps | `MAPBOX_ACCESS_TOKEN` |
| Analytics | `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`, `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` |
| Consent | `NEXT_PUBLIC_COOKIEBOT_CBID`, `NEXT_PUBLIC_COOKIEYES_ID` |
| App | `NEXT_PUBLIC_APP_URL` |
| **Unidentified** | `NEW_API_KEY`, `NEW_API_SECRET`, `NEW_CLOUD_NAME` |

**Three things to settle during a move rather than after:**

1. **`NEW_API_KEY` / `NEW_API_SECRET` / `NEW_CLOUD_NAME`** look like a second, possibly
   abandoned Cloudinary account. Either they are live credentials nobody is tracking, or they
   are dead ones that should have been revoked. A migration is the natural moment to find out.
   Do not copy them forward without knowing which.
2. **`ADMIN_PASSWORD`** should not survive the move. Finding F13 recommends removing it from
   the deployed environment entirely once the account exists.
3. **`MAPBOX_ACCESS_TOKEN`** is a public `pk.` token on a personal Mapbox account. Confirm it
   carries URL restrictions scoped to the WattUp domains, and that the account it belongs to is
   one the company controls rather than an individual's.

**After recreating them, redeploy.** Vercel bakes variables in at build time, so a project that
already deployed will not pick them up until it builds again.

### The fail-closed rule

Any missing required variable must produce a **503 with a plain-text reason**, never a working
site with the gate disabled. This mirrors the current password gate's deliberate behaviour and
is on the acceptance list.

---

## Part 6 — End-to-end verification

Run at cutover, in this order. Every line is a pass/fail.

```bash
# 1. The subdomain serves the login screen, never the tool
curl -sI https://hostproposal.wattupusa.com | head -1              # expect 200
curl -s  https://hostproposal.wattupusa.com | grep -ci "pro-forma builder"

# 2. A gated file is not reachable. THE important one.
curl -s https://hostproposal.wattupusa.com/js/model.js | head -5   # expect no JavaScript

# 3. Search engines are told to stay away
curl -sI https://hostproposal.wattupusa.com | grep -i "x-robots-tag"   # noindex
curl -s  https://hostproposal.wattupusa.com/robots.txt                 # Disallow: /

# 4. Enumeration: these two must be byte-identical
curl -s -X POST https://hostproposal.wattupusa.com/api/gate/request-code \
     -H 'content-type: application/json' -d '{"email":"<a real member>"}'
curl -s -X POST https://hostproposal.wattupusa.com/api/gate/request-code \
     -H 'content-type: application/json' -d '{"email":"nobody@example.com"}'
```

By hand:

- [ ] A member receives the code within 30 seconds; it signs them in.
- [ ] A non-member receives no email, and the screen behaves identically.
- [ ] The code fails after 5 wrong attempts, and after 10 minutes.
- [ ] Revoking `ACCESS_PROFORMA` in the dashboard blocks the next request.
- [ ] The sign-in appears in the dashboard activity log with IP and user agent.
- [ ] The OTP email renders correctly in Gmail **and** Outlook, and is not flagged as spam.
- [ ] `wattupusa.com` and `www` still serve the marketing site, and company email still flows.

**Two weeks later:** confirm the subdomain is absent from Google's index. This is a
post-launch check, not a release gate — it depends on Google, and it is trivially true for a
site nothing links to.

---

## Part 7 — Rollback

The old shared-password build stays deployed and reachable at its current URL until part 6
passes in full. Nothing is deleted during cutover.

| Symptom | Action |
|---|---|
| Subdomain 404s | Wrong CNAME target — almost certainly `www`'s. Re-copy from the pro-forma project's own Domains screen. |
| TLS error | Certificate not issued. Check the CAA record from 0.3. |
| Codes not arriving | Resend domain not verified, or the API key is not scoped to it. Check Resend's delivery log before touching DNS. |
| Site returns 503 | A required variable is missing. That is the fail-closed path working. Set it and **redeploy** — Vercel bakes variables at build time. |
| Everyone signed out | `BETTER_AUTH_SECRET` changed. Restore the value from your password manager. |
| Company email stops | Nothing in this runbook touches apex MX or SPF. Compare against the 0.4 snapshot and restore any row that changed. |

To abandon the cutover entirely: remove the `hostproposal` CNAME. The subdomain stops
resolving, the old build is unaffected, and every other record is untouched. The Resend records
are harmless to leave in place.
