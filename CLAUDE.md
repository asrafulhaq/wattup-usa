# wattup-frontend

The wattupusa.com marketing site **and** the team dashboard. Next.js 16 App Router, React 19,
Prisma 7 on Postgres, Better Auth, pnpm. Port 3000.

> Repo-wide rules live in the root `CLAUDE.md`. This file covers only what is specific to this
> application.

## Things that are not what you would guess

- **Middleware is `proxy.ts`, not `middleware.ts`.** Next 16 renamed it. It sits at the app
  root and is sync — it reads the session cookie only, no database call.
- **`pnpm`, never `npm`.** There is a `pnpm-lock.yaml` and a `pnpm-workspace.yaml`, the latter
  carrying only `onlyBuiltDependencies`, not a `packages:` key. This is **not** a workspace
  root; the two apps in this repo install independently.
- **`prisma db seed` runs on every production build** (`"build": "next build && prisma db seed"`)
  and force-promotes `ADMIN_EMAIL` to `SUPER_ADMIN`, recreating the account from
  `ADMIN_PASSWORD` if it is missing. See finding F13. Do not treat a deleted admin as gone.
- There is no `src/`. `app/`, `components/`, `lib/` and `hooks/` are at the app root.

## Authorisation — the rule that matters most

**Every server action gates itself.** A `'use server'` export is a callable HTTP endpoint, not
an internal function. Hiding a control in the dashboard is presentation, not protection.

```ts
import { sessionWith, UNAUTHORIZED } from '@/app/_actions/permission-guard';

const session = await sessionWith(Permission.MANAGE_LOCATIONS);
if (!session) return UNAUTHORIZED;
```

- `sessionWith(permission)` is the guard. `app/_actions/permission-guard.ts`.
- **`getAdminSession()` is not a permission check.** It returns a session only for `ADMIN` and
  `SUPER_ADMIN`, so code using it is role-gated regardless of what the permission map says.
  Several modules still do this and are being migrated — do not copy the pattern.
- A page-level `hasPermission()` check guards rendering. It does **not** guard the action
  behind it. Both are needed.
- Roles live in two places that must change together: the `Role` enum in
  `prisma/schema.prisma`, and the static `createAccessControl` map in `lib/auth.ts`. A role
  missing from the second fails silently in admin-plugin calls.

## Public reads must filter at the data layer

Not at the caller. `lib/locations/server.ts` is the reference:

```ts
where: { published: true },   // excluded here rather than filtered by the caller
```

`postActions.ts` currently does not do this and leaks drafts — finding F2. When adding a public
read, the filter goes in the query, and a caller must not be able to widen it by passing an
argument.

## Before you finish

```bash
pnpm lint
pnpm build          # runs the seed; see the warning above
```

Both must pass. `pnpm dev` for local work; sign in at `/admin`, dashboard at `/dashboard`.

## Where the plan lives

Active work, findings and decisions are in `../docs/` once the repo restructure lands, and in
`docs/` until then:

- `adr/0001-proforma-access-architecture.md` — the pro-forma app's architecture
- `adr/0002-roles-and-permissions.md` — the role and permission redesign
- `plan/CHECKLIST.md` — the tracking document; tick items from evidence
- `plan/SECURITY-FINDINGS.md` — 13 findings, F1 and F8 are live and unfixed
