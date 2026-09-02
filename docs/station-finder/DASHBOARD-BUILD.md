# Locations dashboard: making the sheet editable

Branch: `feat/locations-station-finder`
Follows: the station finder, which reads a generated file (`lib/locations/data.ts`)

The client's requirement, verbatim:

> The dashboard should allow us to enable or disable facilities, update information, and
> make changes easily. In short, it should be flexible and fully manageable.

## 1. Instruction

Move the station data from a build time generated TypeScript file into Postgres, and
give the dashboard the screens to manage it. The public finder must keep working, and
the shape it consumes must not change.

Ambiguity worth naming, resolved rather than asked:

- **"facilities" means amenities**, both the catalogue and per site assignment. The
  catalogue itself has to be editable, or a label typo needs a developer.
- **"enable or disable"** is two different switches, and both are wanted: turn an
  amenity off across the whole network, and turn one off for a single site.
- **Publishing.** Not asked for by name, but a site that is signed and not yet ready to
  announce has to be hideable without deleting the record. Added.

## 2. Spec: what is true when this is done

1. `/locations` and `/locations/[slug]` render from the database. `lib/locations/data.ts`
   no longer exists, and nothing in `app/` or `components/` reads a generated file.
2. `PublicStation`, the shape the browser receives, is byte for byte the same set of
   fields it is today. No component that renders a station changes because of where the
   data now comes from.
3. The private columns still never reach the browser. `lib/locations/public.ts` remains
   the one place that decision is made, and `scripts/verify-public-projection.mjs`
   still proves it.
4. Seeding is idempotent. `pnpm db:seed` run twice leaves 27 locations and 15 amenities,
   not 54 and 30, and it does not overwrite an edit made in the dashboard to a field the
   sheet does not own.
5. `/dashboard/locations` lists every site with status, publish state, city, chargers and
   amenity count, and filters by status and publish state.
6. A site can be created and edited in full: name, address, coordinates, market, status,
   go live year, charger count, peak kW, price per kWh, connectors, amenities, publish,
   and the private sheet columns.
7. Saving an address without touching the coordinates re-geocodes it through Mapbox, and
   the result is shown for confirmation rather than silently applied. Coordinates can
   always be typed by hand.
8. `/dashboard/locations/amenities` manages the catalogue: label, icon, sort order, and
   an active switch. Deactivating an amenity removes it from the public filter and from
   every station card, without unassigning it from any site.
9. Amenity labels edited in the dashboard show on the public site, so the catalogue is
   read from the database and passed into the client island, not imported from code.
10. Every mutation is permission checked on the server, not only hidden in the UI.
    `MANAGE_LOCATIONS`, `DELETE_LOCATIONS` and `MANAGE_AMENITIES` join the existing RBAC.
11. Mutations invalidate the public page: `updateTag('locations')` after every write.

## Added during the build

Two things were not in the original spec and were added because they turned out to be in
the way.

12. **The dashboard says what is wrong instead of looping.** `proxy.ts` can only see that
    a session cookie *exists*: it runs sync with no database, so it cannot tell a live
    token from an expired or revoked one. A stale cookie therefore walked past the proxy,
    the page found no session and redirected to `/admin`, and the proxy sent it straight
    back to `/dashboard`. Measured at roughly 1.3 full page loads a second, with an empty
    sidebar and a blank body, which is what "behaves very weird" was.
    Now: no dashboard page redirects to `/admin`. `RequireSession` renders a panel that
    says the session ended, and its button clears the cookie before navigating, because a
    plain link would be bounced back by the proxy. A signed-in visitor without the
    permission gets a different panel that names what they cannot open, rather than being
    dropped somewhere else with nothing said.
13. **The list is the shared TanStack `DataTable`**, twenty rows a page, matching Articles:
    column sorting, a search box, row selection with batch show/hide, and the standard
    pagination footer.
14. **Every dashboard route now has a `loading.tsx`.** There was not one anywhere under
    `/dashboard`, so a navigation sat on the previous screen until the whole payload
    arrived. Measured on the running dev server: a warm navigation now paints its skeleton
    at **103ms** and the real content at 650ms, where before nothing at all happened until
    the content landed.
15. **Dashboard reads are cached and tagged.** They were server actions, which cannot be
    cached, so every navigation re-queried. They moved to `lib/locations/dashboard.ts` as
    `'use cache'` readers tagged `locations`, behind uncached permission checks. Every
    mutation already called `updateTag('locations')`, so an edit is still visible
    immediately: verified by hiding a site and seeing the cached list come back with the
    switch off. Moving them also removed three callable endpoints that returned owner
    entities and notice addresses, which only server components ever read.
16. **The page transition is CSS, not framer-motion.** The old `DashboardFadeIn` and the
    sidebar's `whileInView` reveal both left elements stranded at `opacity: 0` on this
    dashboard, which is a blank page rather than a slow one. Both are keyframes now,
    ending on the element's natural state, so a failed animation shows content
    immediately instead of hiding it.

17. **Navigation stopped refetching every screen.** Since Next 15 the client router
    cache does not reuse page segments across `<Link>` navigations: the default dynamic
    stale time is 0, so every sidebar click re-requested the RSC payload for a screen the
    browser had rendered seconds earlier. `experimental.staleTimes` is now
    `{ dynamic: 30, static: 180 }`. Safe alongside the dashboard's writes, because a
    Server Action calling `updateTag` clears the whole client cache immediately and
    bypasses the stale time, so an edit is still visible at once.
18. **The dashboard was redesigned onto one design language.** Tokens in `globals.css`
    (`--dash-canvas`, `--dash-surface`, `--dash-border`, the text ramp) plus primitives in
    `components/dashboard/ui/`: `PageShell`, `PageHeader`, `SectionCard`, `StatCard`,
    `StatusPill`, `EmptyState`, `Toolbar`/`SegmentedFilter`. Every dashboard screen now
    uses them, including Articles, Users, Settings and Profile, which were not part of
    this branch's original scope but were the reason the dashboard looked like several
    products stitched together.
    The sidebar is grouped (Operate / Content / Account / Configure) with a longest-match
    active state, so `/locations/amenities` highlights Amenities and `/locations/create`
    highlights Locations. The overview screen replaced a panel showing the signed-in
    user's id and "Session Status" with the actual state of the network and a list of
    what still needs a decision.

19. **Every skeleton mirrors its page, measured rather than eyeballed.** Each screen
    shows its loading shape twice, in `loading.tsx` and in its own Suspense fallback, so
    the bodies live once in `components/dashboard/ui/page-skeletons.tsx` and both callers
    use them. Verified on the locations screen: card height 1266px in both, page height
    1640 against 1641, twenty skeleton rows against twenty real ones. The header block was
    7px out and is now set from the measured 58.5px (a 32.5px h1, a 6px gap, a 20px line).
    Four legacy skeletons that no longer matched anything were deleted, and the profile
    one had been drawing an "About" card the page stopped rendering some time ago.
20. **Detail fixes from review.** Row actions on Locations became a single "..." menu
    rather than three icons repeated down every row, which also stops Delete sitting one
    mis-click from Edit. The selection bar became a dark elevated bar shared by Locations
    and Articles, since the tinted version sat at the same weight as the toolbar above it.
    Sidebar icons were rematched to their meaning: a concierge bell for Amenities rather
    than sparkles, a gear for Settings rather than the mixer, a newspaper for Articles.
    The Amenities page lost its redundant back button.
21. **Change Email was restored on the profile page.** The form, the handler and the
    `updateEmail` action all existed; only the card was missing, so a working feature was
    unreachable and the grid beside Change Password was empty. That is why the profile
    page had a blank half.

22. **Dashboard form fields, scoped.** The base `Input` and `Textarea` are the public
    site's: 56px tall, 16px type, filled with a grey wash. Right for a marketing form
    with three fields, wrong for an admin panel with thirty, where it turned every card
    into a wall of grey slabs. The dashboard now gets 40px white fields with a 1px border
    at 14px, via `.dash-scope` on the shell rather than a change to the component, so the
    public forms are untouched: verified at 56px and 16px on /contact, and confirmed not
    inside the scope. The rules sit in `@layer utilities`, not `components`, because
    Tailwind's utilities layer beats components whatever the specificity, so the base
    `bg-gray/30` and `h-[56px]` would otherwise win.
23. **The selection bar went white.** A black slab was too loud for a light, quiet admin
    surface. It still has to out-rank the toolbar above it, so that is carried by a
    primary-tinted border, a small lift and a blue count pill rather than by a dark fill.

### Out of scope, deliberately

Bulk CSV import through the UI (the seed covers the one import we have), image upload per
location, per location opening hours, audit log of who changed what, and the mobile
bottom sheet on the public finder. Each is a separate piece of work and none of them
blocks the client managing their data.

## 3. Implementation plan, risky part first

The risk is the read path swap: the public page is finished and working, and step 5 is
where it breaks if the mapping is wrong. Everything before it exists to make that step
safe, everything after it is additive.

| # | What | Files |
|---|---|---|
| 1 | Schema and migration | `prisma/schema.prisma`, `prisma/migrations/<ts>_locations/migration.sql` |
| 2 | Move the generated data out of `lib/` | `scripts/build-locations-data.mjs`, `prisma/seed-data/locations.ts`, `scripts/verify-public-projection.mjs` |
| 3 | Amenity icon registry, `AmenityId` widened to `string` | `lib/locations/amenities.ts`, `lib/locations/types.ts` |
| 4 | Seed amenities and locations, idempotently | `prisma/seed.ts` |
| 5 | **Read path to Prisma**, `PublicStation` unchanged | `lib/locations/server.ts`, both `locations` pages |
| 6 | Catalogue threaded to the client island | `station-finder.tsx`, `filter-tray.tsx`, `station-card.tsx`, `station-detail.tsx` |
| 7 | Permissions | `prisma/schema.prisma`, `lib/permissions.ts` |
| 8 | Server actions | `app/_actions/locationActions.ts`, `app/_actions/amenityActions.ts` |
| 9 | Dashboard screens | `app/(dashboard)/dashboard/locations/**`, `components/dashboard/locations/**` |
| 10 | Nav | `components/app-sidebar.tsx`, `components/dashboard/dashbaord-wrapper.tsx` |

### What could break, and what catches it

- **The public page silently loses fields.** `PublicStation` is a `Pick<>` of
  `StationRecord`, so a dropped field is a type error, not a blank card. Typecheck
  catches it.
- **Private data leaks through the new mapper.** `scripts/verify-public-projection.mjs`
  scans the seed data for values reaching the public shape. Kept, repointed at the moved
  file.
- **`goLiveYear` narrows.** It is `2026 | 2027` in code and an `Int` in the database, and
  the dashboard can now set 2028. Widened to `number`; `stationsByYear`, which hardcodes
  the two years and is called from nowhere, is deleted rather than maintained.
- **`AmenityId` narrows.** A literal union derived from a const array cannot describe
  rows a user can add. Widened to `string`, with the icon registry keeping the
  code owned half.
- **Migration on a pooled Neon connection.** `migrate dev` wants a shadow database and
  the connection string is a pooler. Every existing migration here is hand written, so
  this one is too, applied with `migrate deploy`.
- **`server-only` in the seed.** `prisma/seed.ts` runs under `tsx`, not React, so
  importing anything with `import 'server-only'` throws at load. This is why the
  generated records move to `prisma/seed-data/`, which the app cannot reach.

## 4. Checklist

Tick from evidence: the command that passed, the file that exists.

### Schema and data
- [x] `Location`, `Amenity`, `LocationAmenity`, `LocationConnector` in `schema.prisma`
- [x] `StationStatus` and `ConnectorType` enums
- [x] Three new values on the `Permission` enum
- [x] Hand written migration SQL
- [x] `prisma migrate deploy` applied, `migrate status` clean
- [x] `prisma generate` clean

### Moving the source of truth
- [x] `scripts/build-locations-data.mjs` emits `prisma/seed-data/locations.ts`
- [x] `scripts/verify-public-projection.mjs` repointed and passing
- [x] `lib/locations/data.ts` deleted
- [x] `lib/locations/amenities.ts` is an icon registry plus a seed catalogue
- [x] `AmenityId` is `string`; `GoLiveYear` is `number`; `stationsByYear` removed
- [x] `prisma/seed.ts` seeds 15 amenities and 27 locations, idempotently
- [x] Seed run twice, counts verified unchanged

### Read path
- [x] `lib/locations/server.ts` queries Prisma, cached and tagged `locations`
- [x] `toStationRecord` maps a row to the existing `StationRecord`
- [x] `/locations` awaits, renders, unchanged to the eye
- [x] `/locations/[slug]` awaits, renders, unchanged to the eye
- [x] Amenity catalogue passed into the client island rather than imported

### Dashboard
- [x] `MANAGE_LOCATIONS`, `DELETE_LOCATIONS`, `MANAGE_AMENITIES` in `lib/permissions.ts`
- [x] `locationActions.ts`: list, get, create, update, delete, publish toggle, geocode
- [x] `amenityActions.ts`: list, create, update, reorder, active toggle, delete
- [x] Every mutation permission checked server side
- [x] `/dashboard/locations` list with status and publish filters
- [x] `/dashboard/locations/create` and `/edit/[id]`
- [x] `/dashboard/locations/amenities`
- [x] Sidebar entry, permission gated
- [x] List rendered with the shared TanStack `DataTable`, 20 rows a page
- [x] `RequireSession` guard, session-ended and no-access panels
- [x] No dashboard page redirects to `/admin`, so the proxy cannot loop it
- [x] `loading.tsx` for every dashboard route, skeletons shaped like their page
- [x] Dashboard reads cached and tagged; edit still visible immediately
- [x] Page transition and sidebar reveal in CSS, verified to settle at opacity 1
- [x] `staleTimes` set, so a revisited screen is not refetched
- [x] Dashboard design tokens and primitives
- [x] Every dashboard screen moved onto them, grouped sidebar, rebuilt overview
- [x] Skeletons mirror their pages, shared between `loading.tsx` and Suspense
- [x] Row actions menu, shared selection bar, rematched icons
- [x] Change Email card restored, profile grid balanced
- [x] Dashboard field styling scoped to the shell, public forms verified untouched
- [x] Selection bar lightened; profile headings and actions made minimal

### Gate
- [x] `pnpm lint`
- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm build`
- [x] Verified in the browser, both the public finder and the dashboard
- [ ] Security review (agent) — asked
- [ ] Code review (agent) — asked
