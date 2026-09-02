September 2, 2026

**PRD, SITE PRO-FORMA BUILDER ACCESS CONTROL**

hostproposal.wattupusa.com | Build spec, v1

Current Build: [https://hostlocation-proforma.pplx.app/](https://hostlocation-proforma.pplx.app/) 

Source code: [Attached here](https://drive.google.com/file/d/1inPFZkAOGVZqQkAtFBMdCD_ws2SGcpqE/view?usp=sharing) to use.

New Vercel container, separate from the marketing site

**Scope:**

Replace the shared password gate with email plus one-time code, against a member list held in the wattupusa.com dashboard. Deploy to hostproposal.wattupusa.com. No change to model.js, doc.js, evpin.js, app.js or the interface\[for now\].

**What Changes:**

| Area | Now | Target |
| :---- | :---- | :---- |
| Identity | None. One shared password. | Email address, verified by code. |
| Member list | None. | Dashboard API, cached 5 minutes. |
| Revocation | Rotate password, redeploy. | Remove in dashboard, effective within 5 minutes. |
| Session | 30 day signed cookie. | 7 day signed cookie carrying the email, re-checked per request. |
| Storage | None. | Vercel KV. |
| Outbound mail | None. | Resend, on a send subdomain. |
| Audit | None. | Sign in log, 90 day retention. |

Keep from the current middleware: fail closed on missing environment variables, the constant time sameString helper, the safeNext same site redirect check, and the ungated assets path so the login screen renders its wordmark. Delete SITE\_PASSWORD and its code path entirely on cutover.

**Routes:**

| Route | Method | Behaviour |
| :---- | :---: | :---- |
| /login | GET | Two step screen. Email, then code. Ungated. |
| /api/auth/request-otp | POST | Body: email. Always 200 with the same generic body regardless of outcome. |
| /api/auth/verify-otp | POST | Body: email, code. On success sets the session cookie and returns the redirect target. |
| /api/auth/logout | POST | Clears the cookie. |
| Everything else | any | Gated. No valid session redirects to /login with the original path preserved. |

Middleware matcher excludes /login, /api/auth/, /assets/, /favicon and \_vercel. Nothing else. middleware.ts stays at the repository root, since nested it does not execute and the whole site serves open.

**Sign In Flow:**

| Step | Behaviour |
| :---: | :---- |
| 1 | Normalise the address. Trim, lowercase. |
| 2 | Check rate limits. On breach, return the generic response and send nothing. |
| 3 | Look up the address in the cached member list. Absent or active false, return the generic response and send nothing. |
| 4 | Generate a six digit code from crypto.getRandomValues. Handle it as a string throughout so leading zeros survive. |
| 5 | Store sha256(code \+ email \+ GATE\_SECRET) in KV, TTL 600, attempts at 0\. Never store or log the code itself. |
| 6 | Send via Resend. A provider error is logged and alerted, and still returns the generic response. |
| 7 | On verify, constant time compare. Increment attempts on failure. At 5, delete the key. |
| 8 | On success, delete the key, set the session cookie, redirect through safeNext. |

The generic response is a 200 reading: if that address is on the team list, a code is on its way. Status, body and timing envelope identical for a member and a non-member. The screen advances to code entry either way.

**Member List Contract:**

Built by whoever owns the dashboard. Single authenticated GET, bearer token in the Authorization header compared in constant time, token in an environment variable on both sides.

| Field | Type | Notes |
| :---- | :---: | :---- |
| email | string | Lowercased and trimmed by the dashboard. |
| name | string | Display only. Not used in access decisions. |
| active | bool | False entries are returned and treated as denied. |
| generated\_at | ISO 8601 | Staleness check on the cached copy. |

**Caching and failure:**

•	Cache under allowlist:v1 in KV, TTL 300 seconds. That interval is what makes dashboard removals take effect without a redeploy.

•	Upstream error, cached copy under 24 hours old: serve the cache, raise an alert. A dashboard outage must not sign the team out mid meeting.

•	Upstream error, no cached copy or one over 24 hours old: return 503\. Fail closed.

•	Phase 1 runs against FALLBACK\_ALLOWLIST, a comma separated list in an environment variable. The lookup reads the API when ALLOWLIST\_API\_URL is set and the variable when it is not, so this build does not block on the dashboard work.

**Sessions:**

•	Cookie wu\_session, value base64url(payload) plus an HMAC-SHA256 of that payload keyed on GATE\_SECRET.

•	Payload carries email, iat, exp. Nothing else.

•	Flags: HttpOnly, Secure, SameSite Lax, Path /.

•	Lifetime 7 days, from SESSION\_TTL\_DAYS.

•	Every gated request re-checks the cookie's email against the cached member list. A valid signature alone is not sufficient. Without this a removed member holds access until their cookie expires.

•	Failed re-check clears the cookie and redirects to /login.

•	Rotating GATE\_SECRET invalidates every session at once. This is the break glass path.

**Rate Limits:**

| Limit | Threshold | Window |
| :---- | :---: | :---: |
| Code requests per email | 5 | 1 hour |
| Code requests per IP | 20 | 1 hour |
| Verify attempts per code | 5 | Code lifetime |
| Gap between sends to one address | 60 seconds | Rolling |

A breach returns the generic response, never a distinct error, so probing reveals nothing. All counters keyed on a salted hash of the identifier, not the raw value.

**KV Keys:**

| Key | Value | TTL |
| :---- | :---- | :---: |
| otp:{hash(email)} | Code hash, attempt count, issued time. | 600s |
| rl:req:{hash(email)} | Counter. | 3600s |
| rl:ip:{hash(ip)} | Counter. | 3600s |
| rl:gap:{hash(email)} | Marker. | 60s |
| allowlist:v1 | Cached member list plus fetch time. | 300s |
| signin:{date} | Append only sign in log, being email, time, IP, user agent. | 90d |

**Email:**

•	Resend, sending from a send subdomain, not the apex.

•	Body carries the six digits as selectable text, the ten minute expiry, and a line saying an unrequested code can be ignored.

•	Plain text and HTML parts. HTML matches the dark login screen so it does not read as phishing.

•	Reply-To is a monitored inbox, not the no-reply address.

•	Codes never appear in a log line, an error body or an analytics event. Email addresses in logs are hashed or truncated.

**Environment Variables:**

| Variable | Required | Purpose |
| :---- | :---: | :---- |
| GATE\_SECRET | Yes | Signs session cookies, salts code hashes. 64 char hex. |
| RESEND\_API\_KEY | Yes | Transactional email. |
| MAIL\_FROM | Yes | Sending identity on the send subdomain. |
| MAIL\_REPLY\_TO | Yes | Monitored inbox. |
| KV\_REST\_API\_URL | Yes | Vercel KV. |
| KV\_REST\_API\_TOKEN | Yes | Vercel KV. |
| ALLOWLIST\_API\_URL | Phase 2 | Dashboard member endpoint. |
| ALLOWLIST\_API\_TOKEN | Phase 2 | Bearer token for the above. |
| FALLBACK\_ALLOWLIST | Phase 1 | Comma separated addresses, used when no API URL is set. |
| SESSION\_TTL\_DAYS | No | Default 7\. |
| OTP\_TTL\_SECONDS | No | Default 600\. |

Any missing required variable returns 503 with a plain text reason. Variables are baked in at deploy time, so a container deployed before they were set stays broken until it redeploys.

**DNS:**

Zone is at Squarespace, added under Custom Records. Nothing existing is edited or deleted, in particular the apex records, the www CNAME and the MX records.

| Type | Host | Value |
| :---: | :---- | :---- |
| CNAME | hostproposal | Target from the new container's own Domains screen in Vercel. Copy exactly, including the trailing period. |
| MX | send | From Resend. Region specific. |
| TXT | send | SPF, from Resend. |
| TXT | resend.\_domainkey.send | DKIM, from Resend. |
| TXT | \_dmarc | p=none with a reporting address, if none exists. |

•	Vercel issues a different CNAME target per container. Do not reuse the value www points at. It resolves to Vercel and looks right, but identifies the marketing container, producing a 404 that presents as a DNS fault.

•	Host fields take the label only. Squarespace appends the domain.

•	Sending from a subdomain is required, not preferred. Apex SPF does not cover subdomains, so none of this touches the SPF record authenticating company email, and only one SPF record per domain is permitted.

•	Before starting, confirm Squarespace is authoritative by nameserver lookup, and check for a CAA record that would block Let's Encrypt issuance.

**Security:**

•	No enumeration. Identical status, body and timing whether or not the address is a member.

•	noindex robots header and no-store cache header on every response. robots.txt disallows all.

•	Origin or Referer check on both POST endpoints, in addition to SameSite.

•	Constant time comparison on codes and on the bearer token.

•	Only public brand files in the ungated assets directory.

•	EVpin imports currently proxies through r.jina.ai and api.allorigins.win, which see every URL submitted. Decision needed: leave and document, replace with a first party proxy endpoint, or drop the URL field and keep the paste box.

**Acceptance:**

•	Request to the subdomain returns the login screen, never the application.

•	Direct request for js/model.js returns no JavaScript.

•	Members receive a code within 30 seconds and reach the tool after entering it.

•	Non-member receives no email and a response indistinguishable from the member case.

•	Code fails after 5 wrong attempts and cannot be retried.

•	Code fails after 10 minutes. A used code cannot be reused.

•	Dashboard removal revokes access within 5 minutes, no redeploy.

•	GATE\_SECRET rotation signs everyone out immediately.

•	Any missing required variable produces a 503, not an open site.

•	Simulated dashboard outage does not sign out valid sessions and does not block sign in while the cache is warm.

•	Subdomain absent from Google's index two weeks after launch.

**Open:**

A.Can the dashboard expose the member endpoint, and in what shape. Phase 2 depends on it. Phase 1 goes ahead on FALLBACK\_ALLOWLIST either way.

B.Subdomain spelling. Source DEPLOY.md and README.md say hlproposal. This spec says hostproposal.

C.Which Vercel account owns the new container.

D.Reply-To address for code emails.

E.Whether the sign in log surfaces in the dashboard or stays in logs.

---

End of the document