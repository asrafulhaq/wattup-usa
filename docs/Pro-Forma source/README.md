# WattUpUSA Site Pro-Forma Builder

Client-side calculator that renders the 6-page WattUpUSA host revenue pro-forma live in the
browser. No server, no data leaves the machine.

- `js/model.js` — exact JS port of the Python `model.py` (verified to the cent against
  `proforma/data.json` for the 8052 Talbert reference case).
- `js/doc.js`   — exact JS port of `build_html.py`; returns the standalone 6-page Letter HTML.
- `js/app.js`   — form, live preview, image upload, JSON import/export, print-to-PDF.

Export JSON produces a file that the Python pipeline (`build.py`) accepts unchanged.

## Deploying to hlproposal.wattupusa.com

Static files served from Vercel, with `middleware.ts` acting as a password gate at
the edge. Two environment variables are required in the Vercel project (all
environments):

| Variable | Purpose |
| --- | --- |
| `SITE_PASSWORD` | The team password typed into the login screen. |
| `GATE_SECRET` | Random 64-char hex string used to sign the session cookie. |

If either is missing the site returns 503 rather than serving unprotected — it
fails closed on purpose. Changing `SITE_PASSWORD` locks everyone out until they
re-enter it; changing `GATE_SECRET` invalidates every existing session.

`/assets/` is intentionally left ungated so the login screen can render the
wordmark. `/__logout` clears the session cookie.
