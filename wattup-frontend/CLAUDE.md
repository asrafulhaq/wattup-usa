<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# wattup-frontend

The **wattupusa.com** public marketing site and the internal team dashboard, in one Next.js
application. WattUp USA builds and operates EV charging sites; the public half sells to drivers,
hosts, fleets and capital partners, and the dashboard half is where the team manages the
charging network, press releases, users and site settings.

> Repo-wide rules are in the root `CLAUDE.md`. This file is the complete context for this app.

---

## Stack

| | |
|---|---|
| Framework | Next.js **16.3.4**, App Router, React 19.2 |
| Language | TypeScript, strict |
| Database | PostgreSQL via **Prisma 7** with `@prisma/adapter-pg` |
| Auth | **Better Auth 1.7.2** with the `admin` plugin, Prisma adapter |
| Styling | Tailwind **v4**, shadcn/ui over Radix, some SCSS in `styles/` |
| Editor | TipTap 3 (extensive — `components/tiptap-*`) |
| Media | Cloudinary (`next-cloudinary`), signed server-side uploads |
| Maps | Mapbox GL via `react-map-gl` |
| Email | Resend |
| Motion | GSAP, Framer Motion, Lenis smooth scroll |
| Package manager | **pnpm** |
| Port | 3000 |

---

## Directory map

```
app/
  (frontend)/     15 public marketing pages
  (dashboard)/    11 dashboard pages, all under /dashboard
  (auth)/         /admin (login), /forgot-password, /reset-password
  _actions/       10 server-action modules, 54 exported actions
  api/            auth/[...all], upload-image
components/
  ui/             shadcn primitives
  dashboard/      dashboard-only: articles, locations, users, profile, settings
  locations/      public station finder, map, station detail
  home/ about/ hosts/ drivers/ faq/ contact/ …   per marketing page
  tiptap-*/       editor: extensions, node views, UI, templates
lib/
  auth.ts         Better Auth server config
  auth-client.ts  Better Auth React client
  permissions.ts  Role, ROLE_RANK, Permission, the ROLE_PERMISSIONS matrix, hasPermission(set)
  permissions-server.ts  getEffectivePermissions(userId): the resolved set, once per request
  permission-guard.ts    requirePermission(permission), getSessionPermissions(), UNAUTHORIZED
  permission-inventory.ts every endpoint and what it takes to call it; a test enforces it
  activity-log.ts logActivity(entry): the audit writer, never throws
  prisma.ts       Prisma singleton
  email.ts        Resend sendMail()
  mail/           email templates: base, contact, invite-user, reset-password
  locations/      14 modules — the largest subsystem. server/public/dashboard reads,
                  geocoding, filters, search, distance, map views, CA geometry
  dashboard/      overview.ts, users.ts — dashboard data loaders
  images/         13 modules of Cloudinary URL constants, one per marketing page
  validations/    zod schemas: contact, location
prisma/
  schema.prisma   19 models, 4 enums, 1 view (proforma_member). THE schema — this app owns it.
  migrations/     this app is the only one that runs them
  seed.ts         super admin + amenity catalogue
data.tsx          45 exports of marketing page copy and slide data (57 KB)
proxy.ts          route protection (Next 16's middleware)
hooks/            11 hooks, mostly TipTap and viewport helpers
```

---

## Routes

**Public** (`app/(frontend)/`) — `/`, `/about`, `/for-hosts`, `/for-drivers`,
`/fleet-solution`, `/capital-partners`, `/contact`, `/faq`, `/policy`, `/privacy-policy`,
`/terms-of-use`, `/press-release`, `/press-release/[slug]`, `/locations`, `/locations/[slug]`.

**Dashboard** (`app/(dashboard)/dashboard/`) — index, `articles` (+ create, edit/[id]),
`locations` (+ create, edit/[id], amenities), `users`, `profile`, `settings`.

**Auth** (`app/(auth)/`) — `/admin` is the login page, plus forgot and reset password.

`proxy.ts` protects `/dashboard/*` and bounces signed-in users away from the auth pages. It is
**sync and reads only the session cookie** — no database call. It is defence in depth; each
dashboard page independently resolves a session and checks a permission.

---

## Data model

**Auth core** — `User` (with `role: Role`, `banned`, and a `bio`), `Session`, `Account`,
`Verification`. Better Auth owns their shape; `User` carries two custom fields declared in
`lib/auth.ts` as `additionalFields`.

**Charging network** — the largest domain.
`Location` has ~35 fields spanning three concerns: **public** (slug, name, address, lat/lng,
`status`, `goLiveYear`, `maxPowerKw`, `chargerCount`, `pricePerKwh`, `published`, SEO fields)
and **internal** (`pipelineRef`, `apn`, `siteScore`, `switchgearCount`, `salesRep`,
`initialNotes`, `noticeAddress`). Joined to `Amenity` through `LocationAmenity`, and to
`LocationConnector` for connector types. `StationStatus` and `ConnectorType` are enums.

> `status` (can a driver charge here today) is deliberately separate from `goLiveYear` (a
> project milestone). Do not conflate them.

**Content** — `Posts` for press releases: `title`, `slug`, `content`, `status`
(`'Draft'` / `'Published'` as a **string, not an enum**), `featured`, `publishedAt`.

> **`Posts.author` is a free-text `String`.** There is no `authorId`, and no relation to
> `User`. Implementing `EDIT_OWN_POST` / `DELETE_OWN_POST` therefore needs a schema migration
> to add an `authorId` relation and backfill it — it is not a comparison you can just write.

**Site** — `SiteSettings` is a singleton row (`id = "singleton"`) holding analytics IDs,
organisation schema for AEO, and **raw HTML script-injection fields** (`headScripts`,
`bodyStartScripts`, `bodyEndScripts`). Whoever can write those executes JavaScript on every
public page. Treat it as the highest-blast-radius capability in the app.

**Profile / SocialLink** — author profile shown on press releases, separate from `User`.

---

## Authorisation — the most important section

**Every server action gates itself.** A `'use server'` export is a callable HTTP endpoint whose
id is discoverable in the client bundle. Hiding a control in the UI is presentation, not
protection.

```ts
import { requirePermission, UNAUTHORIZED } from '@/lib/permission-guard';

export async function updateLocation(id: string, raw: unknown) {
    const authorised = await requirePermission(Permission.MANAGE_LOCATIONS);
    if (!authorised) return UNAUTHORIZED;
    …
}
```

- **`requirePermission(permission)`** is the guard. It resolves the caller's permissions from
  the database on this request and returns `{ session, permissions }` or null. It lives in
  `lib/`, deliberately not in a `'use server'` module, which would make the guard itself an
  endpoint. `getSessionPermissions()` is the same pair with no permission asked, for pages
  deciding what to draw and for the few actions scoped to the caller's own account.
- **A role decides nothing on its own.** The authority is the resolved set: role defaults from
  `role_permission`, minus `user_permission` revokes (never for `SUPER_ADMIN`), plus grants.
  `lib/permissions-server.ts` resolves it once per request; `lib/permissions.ts` keeps the
  in-code `ROLE_PERMISSIONS` matrix that the migration seeded, and a test proves the two agree.
  `hasPermission(set, permission)` is synchronous and takes that set, never a role.
- A page-level `hasPermission()` check controls rendering. The action behind it still needs its
  own guard. Both, always. `lib/permission-inventory.ts` lists every endpoint with its
  permission or an explicit reason it has none, and `pnpm test` fails on an export that is
  not in it or an entry the code does not back.
- **Roles live in three places that must change together:** the `Role` enum in
  `prisma/schema.prisma`, `Role` and `ROLE_RANK` in `lib/permissions.ts`, and a seed row per
  permission in a migration. Better Auth's `createAccessControl` map in `lib/auth.ts` is
  derived from `ROLE_PERMISSIONS`, so it follows.
- Public registration is closed twice: `emailAndPassword.disableSignUp` in `lib/auth.ts`, and
  the `before` hook matching `/sign-up/email` under it.
- Every permission change and every user change writes an `activity_log` row through
  `lib/activity-log.ts`, which never throws and masks addresses in its own error line.

Current roles, ranked: `SUPER_ADMIN` 100, `ADMIN` 80, `NETWORK_MANAGER` 60, `EDITOR` 50,
`SALES` 40. There is no default role. 27 values in the `Permission` enum, four of them
reserved and unused. The matrix is `docs/adr/0002-roles-and-permissions.md` section 6.

---

## Public reads must filter at the data layer

Not at the caller. `lib/locations/server.ts` is the reference implementation and says why:

```ts
where: { published: true },   // excluded here rather than filtered by the caller
```

`postActions.ts` does **not** do this and currently returns drafts to unauthenticated callers
(finding F2). When you add a public read, the filter belongs in the query, and a caller must
not be able to widen it by passing an argument.

---

## Conventions

- **Server Components by default.** `'use client'` only where interactivity demands it.
- **Server actions live in `app/_actions/`**, one module per domain, and return
  `{ success, data | error }` rather than throwing.
- **Validation is zod**, in `lib/validations/`, applied inside the action — never trust the form.
- **Forms** are `react-hook-form` + `@hookform/resolvers`.
- **Rich text** is sanitised with DOMPurify before `dangerouslySetInnerHTML`
  (`components/rich-text-content.tsx`). JSON-LD goes through `lib/safe-json-ld.ts`.
- **Images** are Cloudinary; URL constants for marketing pages live in `lib/images/`. Uploads
  are signed server-side — there are no unsigned presets, keep it that way.
- **Cache tags**: reads use `'use cache'` with `cacheTag('posts')` etc.; writes call
  `revalidatePath` or `updateTag`.
- **Marketing copy lives in `data.tsx`**, not inline in components.
- **CSP is real** and configured in `next.config.ts` with per-directive comments. Adding a
  third-party script means adding its origin there, deliberately.

---

## Commands

```bash
pnpm dev              # localhost:3000; log in at /admin
pnpm lint
pnpm test             # Vitest: permissions, resolution, guards, audit rows, endpoint inventory
pnpm build            # next build. Reads the database at build time; no longer writes (seed removed)
pnpm db:seed          # one-off bootstrap, writes to DATABASE_URL  ← see the warning below
pnpm seed:admins      # add/promote SUPER_ADMINs from ADMIN_EMAILS only; touches user + account, nothing else
pnpm db:studio        # Prisma Studio
pnpm db:push          # schema → database, no migration
pnpm migrate:dev      # create a migration
```

`pnpm lint` and `pnpm build` must both pass before anything is considered done.

---

## Things that will surprise you

1. **Middleware is `proxy.ts`, not `middleware.ts`.** Next 16 renamed it.
2. **`pnpm-workspace.yaml` exists but this is not a workspace.** It has no `packages:` key and
   carries only `onlyBuiltDependencies`. The two apps in this repo install independently.
3. **`prisma/seed.ts` is a one-off bootstrap, run by hand with `pnpm db:seed`, never by the
   build.** It used to run on every production build (finding F13). It still force-promotes
   `ADMIN_EMAIL` to `SUPER_ADMIN` and recreates the account from `ADMIN_PASSWORD` if
   missing, and it writes to whatever `DATABASE_URL` points at, so running it against
   production is a deliberate, production-affecting action. Whether that break-glass
   account should exist at all is still an open question for the client.
4. **No `src/` directory.** Everything is at the app root.
5. **`Posts.status` is a string**, not an enum. `'Draft'` and `'Published'`, spelled exactly so.
6. **There is no user detail page.** `/dashboard/users` lists users but rows do not open.

---

## Active work and known issues

`docs/plan/SECURITY-FINDINGS.md` holds **13 open findings**. The ones that will affect what you
write here:

| | |
|---|---|
| **F1** | ✅ fixed on `main`: session + origin + folder allowlist on the route; session on all six actions; `publicId`/`overwrite` never forwarded. Residual: delete-by-any-id → 4a. |
| **F8** | ✅ fixed on `main`: `next` 16.3.4, `better-auth` 1.7.2, no code changes. Audit 152 → 109, 0 critical. |
| **F2** | ✅ fixed on `main`: public reads filter `Published` inside the query; dashboard reads need `CREATE_POST` and are uncached. |
| **F13** | The seed resurrected an unremovable `SUPER_ADMIN` on every build. The build no longer runs it; whether the account should exist at all is still open. |
| **F9** | ✅ fixed on `main`: explicit `rateLimit` block, five custom rules. **F14** (forms bypassed it via server actions) also fixed: forms use `authClient`, bypass actions deleted. |
| **F3** | ✅ fixed on the `feat/rbac-*` branches: every article action gates on its own permission; `EDIT_OWN_POST` / `DELETE_OWN_POST` stay in the enum unused pending ADR 0002 §7. **F4** and **F5** fixed there too. |

Decisions and the tracked plan:

- `docs/adr/0001-proforma-access-architecture.md` — the second app and its access gate
- `docs/adr/0002-roles-and-permissions.md` — the RBAC redesign that lands in this app
- `docs/plan/CHECKLIST.md` — tick items from evidence, never from intent
