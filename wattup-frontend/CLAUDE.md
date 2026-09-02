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
| Framework | Next.js **16.1.6**, App Router, React 19.2 |
| Language | TypeScript, strict |
| Database | PostgreSQL via **Prisma 7** with `@prisma/adapter-pg` |
| Auth | **Better Auth 1.6.x** with the `admin` plugin, Prisma adapter |
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
  permissions.ts  Role, Permission, ROLE_PERMISSIONS map, hasPermission()
  prisma.ts       Prisma singleton
  email.ts        Resend sendMail()
  mail/           email templates: base, contact, invite-user, reset-password
  locations/      14 modules — the largest subsystem. server/public/dashboard reads,
                  geocoding, filters, search, distance, map views, CA geometry
  dashboard/      overview.ts, users.ts — dashboard data loaders
  images/         13 modules of Cloudinary URL constants, one per marketing page
  validations/    zod schemas: contact, location
prisma/
  schema.prisma   16 models, 4 enums. THE schema — this app owns it.
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
import { sessionWith, UNAUTHORIZED } from '@/app/_actions/permission-guard';

export async function updateLocation(id: string, raw: unknown) {
    const session = await sessionWith(Permission.MANAGE_LOCATIONS);
    if (!session) return UNAUTHORIZED;
    …
}
```

- **`sessionWith(permission)`** is the guard. It is deliberately not exported from a
  `'use server'` module, which would make the guard itself an endpoint.
- **`getAdminSession()` is not a permission check.** It returns a session only for `ADMIN` and
  `SUPER_ADMIN`. Modules still using it are role-gated no matter what the permission map says.
  `postActions.ts`, `settingsActions.ts` and `userActions.ts` do this. **Do not copy it.**
- A page-level `hasPermission()` check controls rendering. The action behind it still needs its
  own guard. Both, always.
- **Roles live in two places that must change together:** the `Role` enum in
  `prisma/schema.prisma`, and the static `createAccessControl` map in `lib/auth.ts`. A role
  present in one and not the other fails silently in admin-plugin calls.
- Public registration is blocked by a `before` hook in `lib/auth.ts` matching
  `/sign-up/email`. It is a string comparison, and it is load-bearing.

Current roles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`, `COLLABORATOR`. 18 permissions in the
`Permission` enum. **This is being redesigned** — see `docs/adr/0002-roles-and-permissions.md`.

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
pnpm build            # next build && prisma db seed  ← see the warning below
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
3. **`prisma db seed` runs on every production build.** It force-promotes `ADMIN_EMAIL` to
   `SUPER_ADMIN` and recreates the account from `ADMIN_PASSWORD` if missing, so that account
   cannot be demoted or deleted through the dashboard. Finding F13.
4. **No `src/` directory.** Everything is at the app root.
5. **`Posts.status` is a string**, not an enum. `'Draft'` and `'Published'`, spelled exactly so.
6. **There is no user detail page.** `/dashboard/users` lists users but rows do not open.

---

## Active work and known issues

`docs/plan/SECURITY-FINDINGS.md` holds **13 open findings**. The ones that will affect what you
write here:

| | |
|---|---|
| **F1** | `app/api/upload-image/route.ts` and all six exports of `image-actions.ts` have **no auth at all**. Live. |
| **F8** | `next` needs ≥ 16.2.11, `better-auth` needs ≥ 1.6.22. Both have middleware-bypass / account-takeover advisories. |
| **F2** | Article reads leak drafts. |
| **F13** | The build seed resurrects an unremovable `SUPER_ADMIN`. |
| **F9** | No `rateLimit` config in `lib/auth.ts`. |
| **F3** | Six post permissions defined but never enforced. |

Decisions and the tracked plan:

- `docs/adr/0001-proforma-access-architecture.md` — the second app and its access gate
- `docs/adr/0002-roles-and-permissions.md` — the RBAC redesign that lands in this app
- `docs/plan/CHECKLIST.md` — tick items from evidence, never from intent
