# Pro-Forma Builder: migration from static HTML/JS to Next.js

Status: **in progress**. Owner decisions taken 3 Sep 2026 (see §2).

The Site Pro-Forma Builder is today 2,252 lines of framework-free HTML, CSS and JavaScript
served out of `wattup-proforma/private/tool/` by a file-serving route. This plan moves the
**control panel** to React, Next.js and shadcn, and moves the **engine** into the bundle,
while holding the generated document byte-identical.

---

## 1. Spec: what is true when this is done

### 1.1 The document is unchanged

**The single hardest requirement.** For any given set of inputs the HTML the tool produces
is byte-identical to what today's build produces. Not "looks the same": identical.

This is testable and a test enforces it: `tests/proforma/engine-parity.test.ts` loads
`private/tool/js/{model,doc}.js` the old way, loads `lib/proforma/{model,document}.ts` the
new way, runs both over a matrix of inputs, and asserts the output strings are equal. The
old files stay in the repo as the reference the test compares against.

Consequences that follow from this and are not negotiable:

- `model.js` logic is ported with **zero** semantic change. The only edits are module
  mechanics: `export` on what the app needs, and the removal of nothing.
- `doc.js` likewise, including `docCss()`, every `.page` rule and the footer guard hooks.
- The document keeps its own colours and typography. **Theme switching never reaches it.**
  A dark-mode control panel still renders the same document.
- The preview stays an `iframe` with `srcdoc`, because that is what isolates the document's
  CSS from the app's, and it is what `print()` targets.

### 1.2 Every existing behaviour survives

The inventory below is the acceptance list. Each line is a behaviour of today's build that
must still work. Ticked when a test or a browser check proves it, never from intent.

**Form and sections**

- [ ] 8 sections, in order, with their numbers: 0 EVpin, 1 Location, 2 Charger hardware,
      3 Deployment & deal terms, 4 Permitted operating costs, 5 Site imagery,
      6 Market intelligence, 7 Preparer, validity & branding
- [ ] Every section `note` carried across **verbatim**, HTML and all, including the `<b>`
      in section 4's "Section 5.1(b)" and section 7's "Valid through"
- [ ] Every field `hint` carried across verbatim (hardware ×2, opex sensitivity, gallery)
- [ ] Every field `label`, `placeholder`, `unit`, `step`, `min`, `scale` preserved exactly
- [ ] Sections 0, 1 and 2 open on first load; the rest closed
- [ ] Open/closed state and rail scroll position survive a re-render
- [ ] Half-width fields pair into rows, in the same pairs as today
- [ ] The intro paragraph above the sections, verbatim

**Field types**

- [ ] `text` with placeholder
- [ ] `number` with unit suffix, `step`, `min`, and `scale` (a 20% utilization stores 0.20
      and displays 20)
- [ ] `select` returning a real boolean for the host-share basis, not the string
- [ ] `color` (accent, ink)
- [ ] `pctlist`: comma-separated percents, divided by 100, non-positive dropped, and
      **falls back to `[0.25, 0.20, 0.15, 0.10]` when nothing valid is left**
- [ ] `image` ×3 slots (cover, aerial, design): click to pick, drag and drop, thumbnail
      preview, "remove" clears it, drag-over highlight
- [ ] `gallery`: multi-add by click or drop, live caption editing, move up, move down,
      delete, disabled arrows at the ends, and the "N images · M added pages" counter
- [ ] `evpin`: URL box, "Import from link", Enter submits, "or paste the report text",
      textarea, "Read pasted text", status pill in three states (busy, ok, warn)

**EVpin import**

- [ ] URL path calls `/api/tool/evpin-fetch` (the first-party reader, privacy exception 1)
- [ ] Pasted text under 60 characters is refused with the same wording
- [ ] A fetch failure shows the message plus "Open the report, select all, and paste…"
- [ ] Fills location and market fields; blank values never overwrite
- [ ] Reports how many fields were filled, and lists them
- [ ] "Nothing recognisable in that report…" when it fills none
- [ ] Toast on success
- [ ] **FIXED, by owner decision:** utilization and retail price now write to the paths the
      model reads (`utilization`, `price_kwh`) instead of `deal.*`, which the model has
      never read. See §2.3.

**Compute and preview**

- [ ] Recompute is animation-frame debounced
- [ ] Cover falls back to the shipped station render when no cover is uploaded
- [ ] Aerial and design images reach the document only when set
- [ ] Page count is `6 + ceil(gallery / 6)` and the status line reads
      "N pages · US Letter · live preview"
- [ ] Five KPI cards, same labels, same order, same tone classes:
      Host revenue / mo (hi), 10-year host revenue, vs. flat lease 10-yr (good),
      Operating cost $/kWh (warn), OpEx % of gross (warn)
- [ ] The footer-collision guard runs after every render, scales an overflowing page's
      `.pad` down, never below 0.88, and logs what it scaled

**Zoom and viewer**

- [ ] Range 0.25 to 1.4, step 0.01, default 0.62, live percentage readout
- [ ] "Fit width" computes from the viewer width less 48px, clamped 0.25 to 1.0
- [ ] Frame height is `11in × pageCount × 96dpi`, paper width `8.5in × 96dpi`
- [ ] Window resize reapplies zoom

**Documents out**

- [ ] "Save as PDF" prints the live frame, and falls back to opening a tab if print throws
- [ ] "Open document" opens a blob URL in a new tab; if the popup is blocked it downloads
      the HTML instead and says so
- [ ] Both use the **live** frame's HTML so footer-guard scaling is included, falling back
      to the raw string
- [ ] Filename slug is `WattUpUSA_ProForma_<address, non-alphanumerics to underscore>`
- [ ] "Export JSON" downloads `<slug>_inputs.json`, pretty-printed, with the toast
      "drop it into the Python pipeline as-is"
- [ ] "Load JSON" merges over the defaults with today's exact semantics: `location` merged
      onto the default location, `design` and `market` **replaced** by the file's values
- [ ] Invalid JSON says "That file is not valid JSON" and changes nothing

**Scenarios**

- [ ] Save prompts for a name, defaulting to the address
- [ ] The picker only appears once at least one is saved
- [ ] Loading one merges it over the defaults
- [ ] **CHANGED, by owner decision:** persisted in `localStorage`, not memory. See §2.2.

**Session and shell**

- [ ] Reset asks for confirmation, then restores defaults and clears images and gallery
- [ ] Toasts appear and clear after ~2.6s
- [ ] Last state is restored on load, seeding the reference site's address when there is none

### 1.3 What is new

- Polished control panel: shadcn primitives, the frontend's design tokens, motion on every
  meaningful transition (section expand, field focus, KPI value changes, toasts, drop zones)
- **Theme switching**, control panel only, honouring the system preference, no flash on load
- **Sign out**, always visible, ending the session properly rather than the current
  hostname-sniffing link that only appears on `wattupusa.com`
- Scenario management surface, including clearing what is stored on the device
- Faster boot: today's `boot()` awaits three asset fetches **sequentially** before first
  render. They become parallel, and the SVGs are inlined at build time.

### 1.4 Out of scope

- The document's design, layout, typography or colours: frozen by §1.1
- The financial model's numbers
- The gate, the login screen, the OTP flow, `activity_log`
- The two halves of the live build we still lack: the last-page validity term and the
  "Prepared for" line (they need the newer source; see `wattup-proforma/AGENTS.md`)

---

## 2. Owner decisions, 3 Sep 2026

### 2.1 Control panel shape: polished accordion rail

Same three-zone layout as today. The rail keeps every section one scroll away, because the
tool's whole premise is "fill the left, watch it build on the right". Rebuilt with shadcn
Accordion, motion transitions, unit-suffixed inputs and hint tooltips.

### 2.2 Scenarios persist in `localStorage`

They vanish on reload today. They will survive, which is what the code's `LS_KEY` and
`LS_LAST` names always intended. **Because this writes a landlord's deal terms to the
device, a visible "clear saved scenarios" control ships with it.**

### 2.3 The EVpin path bug is fixed

`applyEvpin` writes `deal.utilization` and `deal.price_kwh`; `buildModel` reads
`utilization` and `price_kwh` from the top level. Every report import has silently dropped
both. Fixed to write the paths the model reads. This is a deliberate behaviour change and
the one place the migration is not a pure port.

---

## 3. Implementation plan

Risky part first: the engine port, because §1.1 is the requirement everything else rests on.

### Stage A — engine port and parity proof

| File | What |
|---|---|
| `lib/proforma/model.ts` | `model.js`, mechanically exported. Logic untouched |
| `lib/proforma/document.ts` | `doc.js`, mechanically exported. Logic untouched |
| `lib/proforma/evpin.ts` | `evpin.js` parser and `evpinFetchText`, untouched |
| `lib/proforma/sections.ts` | the `SECTIONS` config, notes and hints verbatim |
| `lib/proforma/state.ts` | types, `getPath`, `setPath`, `deepClone` |
| `tests/proforma/engine-parity.test.ts` | old vs new, byte-identical, over an input matrix |

**What could break:** a subtle transcription slip in 947 lines of engine. **What catches
it:** the parity test, which fails on a single differing character.

### Stage B — scaffolding

Dependencies to add: `framer-motion`, `next-themes`, `lucide-react`, `clsx`,
`tailwind-merge`, `class-variance-authority`, `sonner`, `tw-animate-css`, and the Radix
primitives shadcn pulls in. Design tokens copied by hand from `wattup-frontend/app/globals.css`
per ADR 0001 §3, which forbids importing across the apps.

**What could break:** token drift between the apps. **What catches it:** the tokens are
copied wholesale, and `AGENTS.md` already carries the hand-sync rule.

### Stage C — assets

The four brand SVGs inline as build-time constants. The station render moves to
`public/proforma/`, fetched once and converted to a data URL for the srcdoc and for print.

**Flagged:** this gives the render a public URL. It is WattUp's own product render, already
public on wattupusa.com and on the live pro-forma, so the exposure is nil, but it is a
change from "nothing under `private/tool/` has a URL" and is recorded here deliberately.

### Stage D — the control panel

`components/builder/`: topbar, rail, section, nine field components, KPI strip, preview
frame, zoom bar, theme toggle, sign-out. All client components under one `'use client'`
root that owns the state.

### Stage E — routing and cleanup

`app/tool/page.tsx` replaces `app/tool/[[...path]]/route.ts`. The catch-all route and its
36 tests go with it: they exist to protect a file-serving route that will no longer exist,
and removing the route removes the whole class of path-traversal risk rather than
mitigating it. `outputFileTracingIncludes` and `skipTrailingSlashRedirect` become
unnecessary and are removed with the reasons recorded.

**What could break:** the login redirect targets `/tool/` with a trailing slash.
**What catches it:** an explicit test plus a browser check of the whole signed-out to
signed-in to builder path.

### Stage F — verification

- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, all green
- The parity test, green
- Every line of §1.2 checked in a browser at `localhost:3001`
- A print-to-PDF compared against one produced by today's build

---

## 4. Flagged for the owner, not actioned

**`Cache-Control: no-store` is applied to every path**, `/_next/static/*` included
(`next.config.ts` headers). Those files are content-hashed build artefacts, identical for
every visitor and carrying no user data, so the header costs a full re-download of the app
shell on every single load and caps how fast the builder can ever feel. Allowing
`public, max-age=31536000, immutable` for `/_next/static/` only would be the single largest
repeat-load win available. **Not changed:** it is a deliberate security header and the
decision to narrow it is the owner's.
