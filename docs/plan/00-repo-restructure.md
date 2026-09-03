# Phase 0 — Repository restructure, step by step

Turns the current single-app repository into two colocated, independently deployable apps
sharing one `.git`. **No behaviour changes.** Do this as its own branch and its own PR.

**Target:**

```
wattup/                      ← repo root. .git lives HERE and only here.
├─ .git/
├─ .gitignore                ← new, small, cross-cutting only
├─ CLAUDE.md                 ← new. Repo-wide rules for both apps.
├─ AGENTS.md   → CLAUDE.md   ← symlink, so non-Claude tools read the same file
├─ .claude/                  ← STAYS AT ROOT. Shared by both apps.
├─ .agents/                  ← STAYS AT ROOT. The real skill store.
├─ .agent/                   ← STAYS AT ROOT. Symlinks into .agents/
├─ skills-lock.json          ← STAYS AT ROOT. Manages .agents/
├─ .vscode/                  ← STAYS AT ROOT. You open the repo root, not an app.
├─ docs/                     ← stays at root, documents both apps
├─ wattup-frontend/
│  ├─ CLAUDE.md              ← app-specific rules
│  ├─ AGENTS.md → CLAUDE.md
│  └─ …everything else that is there today
└─ wattup-proforma/
   ├─ CLAUDE.md              ← app-specific rules
   └─ AGENTS.md → CLAUDE.md
```

**Why the agent folders stay at the root.** They are shared tooling, not application code. The
installed skills are `better-auth`, `resend`, `next-best-practices`, `frontend-design` and
`vercel-*` — and `wattup-proforma` is a Next.js app using Better Auth and Resend, so it needs
exactly the same set. Pushing them under `wattup-frontend/` would force a second copy and
double the drift problem described in step 3a.

**Why `CLAUDE.md` cascades.** Claude Code reads `CLAUDE.md` from the working directory upward
through every parent. Working inside `wattup-frontend/` therefore picks up the root file **and**
the app file. Repo-wide rules go in one place; app specifics stay next to the app.

**Before you start, know these four things:**

1. `.git` never moves. Every command below runs from the repository root.
2. `git mv` only moves **tracked** files. `.env`, `node_modules/` and the gitignored internal
   reports are invisible to it and must be handled separately — step 4.
3. `.gitignore` uses **root-anchored** paths (`/node_modules`, `/.next/`, `/build`). After the
   move those patterns no longer match anything. Step 5 fixes this. Skip it and you will
   commit `node_modules`.
4. **Change Vercel's Root Directory before you push**, or the next deploy builds an empty root
   and fails. Step 8.

This repo has two remotes — `origin` (`Deveripon/wattup-frontend`) and `ashraf`
(`asrafulhaq/wattup-usa`). Anyone else with a working copy will need to re-clone or reset
after this lands, so tell them before you merge.

---

## Step 1 — Safety net

```bash
cd "/Users/devripon/devripon/Final & Running Project/wattup-usa"

# Commit the docs written so far so the tree is clean
git add docs/
git commit -m "docs: pro-forma PRD review, ADRs and delivery plan"

# A tag you can return to if anything goes wrong
git tag pre-restructure
git status --short          # must print nothing
```

Confirm the working tree is clean before continuing. The move is easy to reverse from a clean
tree and unpleasant from a dirty one.

---

## Step 2 — Remove everything regenerable

These are untracked build artefacts. Deleting them keeps the move simple and avoids dragging
a 400 MB `node_modules` around.

```bash
rm -rf node_modules .next tsconfig.tsbuildinfo next-env.d.ts
```

They come back in step 7.

---

## Step 3 — Create the folder and move every tracked entry into it

```bash
mkdir wattup-frontend

git mv \
  app components hooks lib prisma public scripts styles \
  CLAUDE.md AGENTS.md \
  .gitignore README.md components.json data.tsx eslint.config.mjs example.env \
  next.config.ts package.json pnpm-lock.yaml pnpm-workspace.yaml postcss.config.mjs \
  prisma.config.ts proxy.ts scss.d.ts tsconfig.json \
  wattup-redirect-guide.html \
  wattup-frontend/
```

**Five things are deliberately absent from that list** and stay at the root:
`docs/`, `.claude/`, `.agents/`, `.agent/`, `skills-lock.json` and `.vscode/`.

Verify nothing tracked was left behind that should have moved:

```bash
git ls-files | grep -vE '^(wattup-frontend|docs|\.claude|\.agents?|\.vscode)/' | grep -v '^skills-lock.json$'
```

That should print nothing. If it prints a path, `git mv` it into `wattup-frontend/` too.

---

## Step 3a — Deduplicate the skill folders

Optional, but this is the moment for it. The three agent folders are currently inconsistent:

| Path | What it holds |
|---|---|
| `.agents/skills/` | the real store, managed by `skills-lock.json` |
| `.agent/skills/` | 3 symlinks into `.agents/skills/` |
| `.claude/skills/` | 2 symlinks, and **6 real directories duplicating `.agents/skills/`** |

The 6 copies are byte-identical to their originals today, and will silently drift the next time
`skills-lock.json` updates the store. Someone began with copies and switched to symlinks
partway; finish the job:

```bash
cd .claude/skills
for s in better-auth-best-practices better-auth-security-best-practices \
         create-auth-skill email-and-password-best-practices \
         organization-best-practices two-factor-authentication-best-practices; do
  # only convert if it is a real directory, not already a symlink
  if [ -d "$s" ] && [ ! -L "$s" ]; then
    diff -r "$s" "../../.agents/skills/$s" >/dev/null \
      && rm -rf "$s" && ln -s "../../.agents/skills/$s" "$s" \
      && echo "linked $s" \
      || echo "SKIPPED $s — content differs, inspect before replacing"
  fi
done
cd ../..
ls -l .claude/skills            # every entry should now be a symlink
```

The `diff` guard means a skill that has been **locally edited** is reported rather than
overwritten. If any are skipped, look at what changed before deciding.

---

## Step 4 — Move the untracked files git could not see

`.env` is gitignored, so step 3 did not touch it. **It is still sitting at the root and the app
will not start without it.**

```bash
mv .env wattup-frontend/.env

# The gitignored internal reports, if you want them with the app rather than at the root
mv REMEDIATION_PLAN.md OWNER_ACTION_REQUEST.md wattup-frontend/ 2>/dev/null || true
mv risk_findings_*.csv wattup-risk-report.html wattup-frontend/ 2>/dev/null || true

# Housekeeping
find . -name '.DS_Store' -not -path './.git/*' -delete
```

Check the root now holds only what it should:

```bash
ls -A          # expect: .git  .gitignore(none yet)  docs  wattup-frontend
```

---

## Step 5 — Fix the ignore files

The moved `.gitignore` is now `wattup-frontend/.gitignore`, and its root-anchored patterns are
correct again *relative to that folder*, so it needs no edit. What is missing is a root one.

```bash
cat > .gitignore <<'EOF'
# Cross-cutting only. Each app keeps its own .gitignore.
.DS_Store
*.pem
.vercel
*.tsbuildinfo

# Never commit dependencies or build output from any app
**/node_modules/
**/.next/
**/out/
**/build/

# env files, at any depth
**/.env
**/.env.*
!**/.env.example
EOF
```

Prove it works before committing:

```bash
git status --short | grep -c node_modules      # must print 0
```

---

## Step 5a — Agent instruction files

`wattup-frontend/CLAUDE.md` already exists and moved down with the app in step 3, along with
its `AGENTS.md` symlink. Two more are needed.

Each file is the **complete context for its scope** — what the thing is, how it is put together,
and the rules that are not guessable — not a list of gotchas. An agent starting cold should be
able to work from it.

### The root file

`````bash
cat > CLAUDE.md <<'EOF'
# wattup

Two independently deployable applications for **WattUp USA**, an EV charging network operator,
in one repository sharing one PostgreSQL database.

| Path | What it is | Domain | Port |
|---|---|---|:--:|
| `wattup-frontend/` | Marketing site **and** team dashboard | wattupusa.com | 3000 |
| `wattup-proforma/` | Site Pro-Forma Builder, behind an email + one-time-code gate | hostproposal.wattupusa.com | 3001 |

Both are Next.js 16 / React 19 / TypeScript / Prisma / Better Auth / Resend, on pnpm. Each has
its own `CLAUDE.md` with the full picture for that app; read the one for whichever you are in.

## Structure

```
wattup/
├─ CLAUDE.md, AGENTS.md→CLAUDE.md   repo-wide rules (this file)
├─ .claude/ .agents/ .agent/        shared agent tooling and skills
├─ skills-lock.json                 manages .agents/skills
├─ docs/                            ADRs, plans, runbooks, the PRD
├─ wattup-frontend/                 owns the database schema
└─ wattup-proforma/                 reads it, never migrates it
```

## Rules that bind both apps

- **This is not a pnpm workspace.** No root `package.json`, no root lockfile, no `packages:`
  key anywhere. Each app installs independently and must still build if lifted out of the repo.
  Do not add a workspace root. Do not create a shared package — copy the code and note the copy.
- **`wattup-frontend` owns the schema and is the only app that runs migrations.**
  `wattup-proforma` keeps a narrow read-mostly Prisma schema and deliberately has **no**
  `migrate` or `db push` script. Never add one.
- **They share a database but never call each other.** Coupling is through Postgres — the
  `user` table, the `proforma_member` view, and `activity_log` — not HTTP. A change to those
  three surfaces affects both apps.
- **`pnpm`, never `npm`,** and always from inside an app directory, never the root.
- **Secrets are per-app.** `BETTER_AUTH_SECRET` in particular must differ, so rotating one
  app's sessions does not sign out the other's users.
- **No attribution trailer** in any commit message or PR body.

## Documentation

`docs/` covers both apps and is where decisions live.

| Path | What |
|---|---|
| `adr/0001-proforma-access-architecture.md` | 14 decisions: layout, deployment, identity, data |
| `adr/0002-roles-and-permissions.md` | roles, permissions, the matrix awaiting sign-off |
| `plan/CHECKLIST.md` | **the tracking document.** Tick from evidence, never intent |
| `plan/SECURITY-FINDINGS.md` | 13 open findings |
| `plan/RUNBOOK-dns-email-env.md` | DNS, Resend, env — operator work |
| `plan/00-repo-restructure.md` | how this layout came to be |
| `Pro-Forma Access.md` | the client PRD, superseded in parts by ADR 0001 §16 |

## Before starting anything

`docs/plan/SECURITY-FINDINGS.md` lists 13 open findings; **F1 and F8 are live on production**.
F8 in particular — `better-auth` below 1.6.22 carries an account-takeover advisory against
verification flows — **blocks the pro-forma gate work**.
EOF

ln -s CLAUDE.md AGENTS.md
`````

### The pro-forma file

Write this at step 9, when the app is scaffolded, since it describes code that does not exist
yet. Content, adjusted for whatever actually gets built:

```markdown
# wattup-proforma

The **Site Pro-Forma Builder**: a browser-only calculator that renders WattUp's six-page host
revenue pro-forma live, for pitching landlords and site hosts. This app is a **new front door
in front of an unchanged tool** — email plus a six-digit code, replacing a shared password.

Deployed to hostproposal.wattupusa.com, separate from the marketing site.

## Two halves

**The tool** — `private/tool/`, unchanged from `docs/Pro-Forma source/`. Plain HTML, CSS and
four JavaScript files: `model.js` (the financial model, ported from Python and verified to the
cent), `doc.js` (renders the six-page document), `evpin.js` (parses EVpin site reports),
`app.js` (form, live preview, JSON import/export, print). No framework, no server state.
Everything a user types lives in the browser tab. **Do not modify these files.**

**The gate** — everything else. Next.js 16, Better Auth with `emailOTP`, Prisma against the
shared Postgres.

## Rules that are not guessable

- **Better Auth's OTP endpoints are never exposed to the browser.** Only two first-party routes
  are public, `POST /api/gate/request-code` and `POST /api/gate/verify-code`, and they normalise
  everything observable. Better Auth deliberately leaks user existence at verify
  (`USER_NOT_FOUND` vs `INVALID_OTP`); this app's entire security premise is that it must not.
  **Every failure returns one identical response.**
- **Both endpoints must be indistinguishable for a member and a non-member** in status, body
  and timing. The email is sent *after* the response via `after()`, never awaited on the
  response path, because a Resend round trip is measurable.
- **Tool files live in `private/tool/`, never `public/`.** A file in `public/` has a URL, and no
  matcher mistake may be allowed to serve the model. This also needs
  `outputFileTracingIncludes` in `next.config.ts`, or the route works in dev and 404s in prod.
- **No migrations here.** `wattup-frontend` owns the schema. This app maps a narrow read-only
  model to the `proforma_member` view and its own `proforma_session` / `proforma_verification`
  tables.
- **`emailOTP` plugin defaults are wrong for this app** and are overridden deliberately:
  `storeOTP: 'hashed'` (default `'plain'` would store codes in clear), `expiresIn: 600`
  (default 300), `allowedAttempts: 5` (default 3), `disableSignUp: true` (default `false`
  would create a user on sign-in and make the allowlist meaningless).
- **Who may sign in** is the `ACCESS_PROFORMA` permission, resolved by the `proforma_member`
  SQL view. Never reimplement permission resolution here.
- **Codes never appear** in a log line, an error body or an analytics event. Emails in logs are
  hashed or truncated.

## Reference

`../docs/adr/0001-proforma-access-architecture.md` is the architecture, `../docs/plan/CHECKLIST.md`
phases 1-3 and 5 are the build, and `../docs/Pro-Forma Access.md` is the client PRD — read
§16 of the ADR first for where the two disagree and why.
```

### Why a symlink rather than two files

`AGENTS.md` is the convention most non-Claude agent tools read; `CLAUDE.md` is what Claude Code
reads. A symlink gives one file two names, so they cannot drift. Git stores symlinks natively —
`git ls-files -s` shows mode `120000`.

---

## Step 6 — Commit the move on its own

```bash
git checkout -b chore/monorepo-restructure
git add -A
git commit -m "chore: move the dashboard into wattup-frontend/

Prepares the repository for a second, independently deployable app.
No behaviour changes: every file keeps its content, only its path moves.
Root .gitignore added for cross-cutting artefacts."
```

`git mv` preserves history. Confirm:

```bash
git log --follow --oneline -- wattup-frontend/lib/auth.ts | head -5
```

You should see the file's real history, not a single "added" commit.

---

## Step 7 — Verify the frontend still works

**Do not skip this.** It is the whole point of doing the move separately.

```bash
cd wattup-frontend
pnpm install            # postinstall runs prisma generate
pnpm exec next build    # NOT `pnpm build` — see the warning below
```

> **Historical note:** at the time of the restructure, `pnpm build` ran `prisma db seed` against
> the remote Neon database (finding F13), so this step used `pnpm exec next build`. F13 is fixed:
> `build` is now plain `next build`. It still **reads** the database at build time to prerender
> the sitemap and press-release pages, but no longer writes to it.

A clean build means the move changed nothing. If the build fails, the cause is almost always
one of: a missing `.env` (step 4), a path in `next.config.ts` that pointed outside the app, or
a `tsconfig.json` path alias. Fix it here, before the new app exists.

```bash
pnpm dev      # open http://localhost:3000, sign in, load /dashboard
cd ..
```

---

## Step 8 — Update Vercel before pushing

In the Vercel dashboard, on the **existing** project:

**Settings → Build and Deployment → Root Directory** → `wattup-frontend` → Save.

While there, also set **Settings → Git → Ignored Build Step** to:

```bash
git diff --quiet HEAD^ HEAD -- .
```

That makes the project skip a build when a push touched only the other app. Vercel treats
exit code 0 as "skip", and the command runs from the configured root directory.

Now push:

```bash
git push -u origin chore/monorepo-restructure
```

Open the PR, let the preview deploy run, and **confirm the preview URL loads the dashboard**
before merging. If Root Directory was not saved, the preview fails — that is the check working.

---

## Step 9 — Create the pro-forma app

From the repository root, after the restructure PR is merged:

```bash
cd "/Users/devripon/devripon/Final & Running Project/wattup-usa"   # the repo root
git checkout main && git pull

pnpm create next-app@latest wattup-proforma \
  --typescript --tailwind --eslint --app \
  --no-src-dir --import-alias "@/*" --use-pnpm
```

**Then immediately check for a nested `.git`:**

```bash
ls -a wattup-proforma | grep '^\.git$'
```

`create-next-app` skips `git init` when it detects it is already inside a repository, so this
should print nothing. **If it prints `.git`, delete it** — a nested repository would make the
folder invisible to the root repo's history:

```bash
rm -rf wattup-proforma/.git
```

Then confirm the root repo sees the files as its own:

```bash
git status --short | head        # expect: ?? wattup-proforma/
```

### Trim what the generator gives you

```bash
cd wattup-proforma
rm -f README.md
rm -rf public/*.svg app/favicon.ico
```

Give it its own workspace settings file, mirroring the frontend's:

```bash
cat > pnpm-workspace.yaml <<'EOF'
onlyBuiltDependencies:
  - '@prisma/engines'
  - esbuild
  - prisma
EOF
```

> This file has no `packages:` key, so it is **not** a workspace root — it only carries pnpm's
> build-script allowlist. That is deliberate: ADR 0001 §3 keeps the two apps as independent
> installs, each with its own lockfile, so either can be lifted out of the repo and still work.

### Commit it separately

```bash
cd ..
git add wattup-proforma
git commit -m "chore: scaffold wattup-proforma

Next.js app that will host the Site Pro-Forma Builder behind an
email plus one-time-code gate. Independent install and lockfile."
```

---

## Step 10 — The second Vercel project

Create a **new** Vercel project against the same GitHub repository:

| Setting | Value |
|---|---|
| Repository | the same one |
| Root Directory | `wattup-proforma` |
| Framework preset | Next.js |
| Include files outside root directory | **off** |
| Ignored Build Step | `git diff --quiet HEAD^ HEAD -- .` |

Leave the domain alone for now — it deploys to a `.vercel.app` URL, which is what phases 1 to 5
are built and tested against. `hostproposal.wattupusa.com` is attached at cutover, per the DNS
runbook.

> **Before creating it, answer open question B in ADR 0001:** which Vercel account or team owns
> this project. If it is not the one that already holds `wattupusa.com`, adding the subdomain
> later will require a `_vercel` TXT verification record that the PRD's DNS table omits.

---

## Step 11 — Rename the outer folder (done)

The repository directory was still called `wattup-frontend`, giving the confusing path
`wattup-frontend/wattup-frontend/`. Renamed to match the layout:

```bash
cd "/Users/devripon/devripon/Final & Running Project"
mv wattup-frontend wattup
```

Git is unaffected — `.git` moves with the directory, and branches, tags and remotes are
untouched. pnpm is unaffected too: its `node_modules` symlinks are relative, so they still
resolve and `pnpm exec next build` passes from the new path without reinstalling.

**Anything holding the old path needs reopening**: editor windows, terminals, and any tool
that keyed state to the old directory name.

---

## If it goes wrong

Nothing here is destructive as long as step 1 was done. Before the commit in step 6:

```bash
git reset --hard pre-restructure
git clean -fd            # removes the empty wattup-frontend/ folder
```

Then restore `.env` from wherever you keep it, and `pnpm install`.

After the commit, `git revert` the merge, or reset the branch — the tag is still there. Delete
it once the restructure is merged and the frontend has deployed successfully:

```bash
git tag -d pre-restructure
```
