# Deploying the Site Pro-Forma Builder

Target: **hlproposal.wattupusa.com**, password gated, team only.

This is a plain static site — HTML, CSS and three JavaScript files. There is no
framework, no build step, no database and no backend API. The only server-side
piece is `middleware.ts`, which Vercel runs at the edge to check the password
before any file is served.

## File map

```
index.html          Shell: header, input rail, live document preview
middleware.ts       Password gate + branded login screen (server-side)
css/app.css         Dark shell styling
js/model.js         The financial model. Mirrors the Python model.py exactly
js/doc.js           Renders the 6-page document, incl. the image gallery pages
js/evpin.js         Parses a pasted or fetched EVpin site report
js/app.js           Form generation, state, JSON import/export, print
assets/*.svg        WattUp wordmarks and W mark used in the UI and document
assets/brand/*.jpg  The original supplied logo files, kept for reference
package.json        Declares no build script, so Vercel serves the files as-is
```

`js/model.js` is the file that matters most. Every figure in the document comes
from it — throughput, the six Permitted Operating Cost categories, the host
share, the 10-year escalation and both charts. If a deal assumption changes,
change it there and the whole document follows.

---

## Option A — separate Vercel project (recommended)

Nothing touches the marketing site. Roughly ten minutes.

1. **Push this folder to a Git repo** (or drag it into Vercel's dashboard
   importer).

2. **Create the Vercel project.** Framework preset: **Other**. Leave the build
   command and output directory empty. Vercel serves the files directly and
   compiles `middleware.ts` on its own.

3. **Add the two environment variables** under Settings → Environment
   Variables, ticked for Production, Preview and Development:

   | Name | Value |
   | --- | --- |
   | `SITE_PASSWORD` | The team password people will type in |
   | `GATE_SECRET` | A random 64-character hex string |

   Generate the secret with either of these:

   ```bash
   openssl rand -hex 32
   # or
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   If either variable is missing the site returns a 503 instead of serving
   unprotected. That is deliberate — it fails closed.

4. **Add the domain.** Settings → Domains → add `hlproposal.wattupusa.com`.

5. **Add the DNS record** at whichever registrar or DNS host holds
   wattupusa.com:

   ```
   Type:  CNAME
   Name:  hlproposal
   Value: (use the exact target Vercel shows you on the Domains screen)
   ```

   Vercel issues a per-project CNAME target, so copy the value off that screen
   rather than reusing the one your `www` record points at. Certificate issues
   automatically once the record resolves, usually within a few minutes.

6. **Redeploy** after setting the environment variables — variables are baked in
   at deploy time, so a project deployed before you added them stays broken
   until it redeploys.

### Verifying it worked

```bash
# Should return 200 and the login HTML, never the app itself
curl -sI https://hlproposal.wattupusa.com | head -1

# Should NOT return your app's markup
curl -s https://hlproposal.wattupusa.com | grep -c "Site Pro-Forma Builder"

# A gated file should not be reachable directly
curl -s https://hlproposal.wattupusa.com/js/model.js | head -5
```

That last one is the important check. If it returns JavaScript, the gate is not
running — confirm `middleware.ts` sits at the repository root, not inside a
subfolder.

---

## Option B — a folder inside the existing Next.js site

Only worth it if you specifically want `wattupusa.com/hlproposal` instead of a
subdomain. Two things to know before you take this route.

**The middleware will collide.** Your Next.js app almost certainly has its own
middleware, and a project only gets one. You would need to merge the password
check into the existing file rather than dropping `middleware.ts` in alongside
it. On Next.js 16 and later the file is `proxy.ts`, not `middleware.ts`.

**The login screen uses absolute asset paths.** `middleware.ts` references
`/assets/logo_type_light.svg` and `/assets/favicon.svg`. Mounted under a
subfolder those resolve to the wrong place and the wordmark disappears. Update
both to match wherever the files land, e.g. `/hlproposal/assets/...`.

The app's own files use relative paths throughout, so `index.html` itself works
from any subfolder without modification.

Steps: copy everything except `middleware.ts` and `package.json` into
`public/hlproposal/` in the Next.js repo, merge the gate logic into your
existing middleware with the matcher scoped to `/hlproposal/:path*`, add the two
environment variables to that project, and deploy.

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SITE_PASSWORD` | Yes | Plain string. Compared server-side; never sent to the browser. |
| `GATE_SECRET` | Yes | Signs the session cookie. Any 64-char hex value. |

**Rotating the password:** change `SITE_PASSWORD` and redeploy. Existing
sessions keep working until their cookie expires, because the cookie is signed
against `GATE_SECRET`, not the password. To force everyone out immediately,
change `GATE_SECRET` as well — that invalidates every existing session on the
spot.

Sessions last 30 days. Adjust `MAX_AGE` at the top of `middleware.ts` to change
that.

`/assets/` is deliberately left ungated so the login screen can show the
wordmark before sign-in. Only public brand files live there. `/__logout` clears
the session cookie, and the header's Sign out link points at it.

---

## Things worth knowing about the app

**Nothing is stored anywhere.** No database, no cookies beyond the session
ticket, no analytics. Everything a user types lives in that browser tab and
disappears on reload. **Export JSON** is the durable save path — tell the team
to export a site's inputs and re-load the file later rather than trusting the
in-session scenario dropdown.

**The exported JSON is interchangeable with the Python pipeline.** It matches the
`inputs.json` shape the command-line pro-forma generator consumes, so a file
exported from the browser can be fed straight to the scripted build and produce
a byte-identical model.

**PDFs come out of the browser's print dialog.** The Save as PDF button opens
print with the page size and margins already set. Chrome gives the best result;
make sure "Background graphics" stays enabled or the dark cover prints white.

**EVpin import reaches out through a public read proxy.** Pasting an EVpin link
routes the request via `r.jina.ai`, falling back to `api.allorigins.win`, because
EVpin does not send CORS headers that would let the browser read the page
directly. Those services are outside WattUpUSA's control and see the URL you
submit. The paste-the-report-text box next to it avoids any network call at all —
use that for anything sensitive, or swap in your own proxy by editing the
`EVPIN_READERS` list at the top of `js/evpin.js`.

**Free-text fields are escaped** before they reach the document markup, so an
imported report cannot inject markup into a pro-forma you hand to a landlord.
The preview iframe is sandboxed as a second layer.

---

## Running it locally

```bash
cd proforma-calc
python3 -m http.server 8080
# then open http://localhost:8080
```

The gate does not run under a plain static server — `middleware.ts` only
executes on Vercel — so local browsing is ungated. To exercise the gate locally,
use `vercel dev` with the two environment variables set in `.env.local`.
