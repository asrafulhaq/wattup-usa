# wattup

Two independently deployable applications for **WattUp USA**, an EV charging network operator,
in one repository sharing one PostgreSQL database.

| Path | What it is | Domain | Port |
|---|---|---|:--:|
| `wattup-frontend/` | Marketing site **and** team dashboard | wattupusa.com | 3000 |
| `wattup-proforma/` | Site Pro-Forma Builder, behind an email + one-time-code gate | proforma.wattupusa.com (default; the host comes from env) | 3001 |

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
- **Git hooks live in `.githooks/`, and they are not husky.** Husky wants a root
  `package.json`, which the rule above forbids, so these are plain committed shell scripts
  activated by `core.hooksPath`. Each app's `prepare` script sets that on install, so
  `pnpm install` in **either** app wires up both hooks. `pre-commit` lints the apps you
  staged; `pre-push` runs the full CI gate (lint, typegen, typecheck, test) on the apps the
  push changes. Neither ever runs `pnpm build`, because that would invoke
  `migrate-on-deploy.mjs` against the shared production database. Bypass with `SKIP_HOOKS=1`.
- **Secrets are per-app.** `BETTER_AUTH_SECRET` in particular must differ, so rotating one
  app's sessions does not sign out the other's users.
- **No attribution trailer** in any commit message or PR body.

## Documentation

`docs/` covers both apps and is where decisions live.

| Path | What |
|---|---|
| `adr/0001-proforma-access-architecture.md` | 14 decisions: layout, deployment, identity, data |
| `adr/0002-roles-and-permissions.md` | roles, permissions, the matrix awaiting sign-off |
| `plan/CHECKLIST.md` | **the tracking document.** Tick from evidence, never intent; the agent that builds a branch ticks its own items and adds the branch to the PR queue there |
| `plan/SECURITY-FINDINGS.md` | 16 findings, 7 fixed |
| `plan/RUNBOOK-dns-email-env.md` | DNS, Resend, env — operator work |
| `plan/00-repo-restructure.md` | how this layout came to be |
| `Pro-Forma Access.md` | the client PRD, superseded in parts by ADR 0001 §16 |

## Before starting anything

`docs/plan/SECURITY-FINDINGS.md` lists 16 findings, F15 and F16 added since the audit, 7 fixed. **Phase S is complete on `main` — F1, F2, F8, F9, F13, F14 all fixed — but nothing is deployed yet:** push is gated on the Vercel Root Directory change (checklist 0.18).
F8 (the dependency upgrade) is done on both apps: `next` 16.3.4, `better-auth` 1.7.2.

**`DATABASE_URL` points at a remote Neon database.** `pnpm build` in `wattup-frontend` is
`node scripts/migrate-on-deploy.mjs && next build`. It still does not run the seed (finding
F13). It reads the database at build time to prerender static pages, and on a **production
Vercel deploy only** it first applies pending migrations; `VERCEL_ENV` gates that, so local
builds and Preview deploys skip it and never touch the shared production database. Migrations
must therefore be **additive**: Vercel builds before it promotes, so a migration lands while
the previous version is still serving.
`pnpm db:seed` still writes to that database — it force-promotes `ADMIN_EMAIL` to
`SUPER_ADMIN` and recreates it from `ADMIN_PASSWORD` — so treat it as a deliberate,
production-affecting action, never a routine step.
