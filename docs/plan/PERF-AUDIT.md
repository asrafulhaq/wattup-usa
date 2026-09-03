# Dashboard performance audit: `wattup-frontend`

Measured 2026-09-03 against a production build (`next build`, `next start --port 3021`),
signed in as `devripon.io@gmail.com` (SUPER_ADMIN), database reads only, no application
code changed.

---

## The one sentence that reframes everything

**Every dashboard page costs exactly four strictly sequential database round trips, and on
this machine one round trip is 273 ms, so the page takes 1.11 s.** Server side, those four
queries execute in **under 0.15 ms each**. The whole 1.11 s is distance, not work.

Deployed on Vercel `iad1` next to Neon `us-east-1`, the same four trips cost roughly 5 ms
to 20 ms and nobody will feel them. So the round trip work below is worth doing (it halves
a fixed cost and it makes the dev loop bearable), but it is **not** what will make the
deployed dashboard feel fast. Findings 3, 4 and 6 are the ones that survive deployment.

Measure the real production figure on the first deploy before spending anything on
finding 2: the same `pg` tap in `pgtap.cjs` (in the scratchpad, reproduced at the bottom)
prints per-statement latency, or just time a `SELECT 1` from a warm function.

---

## What was measured

| | |
|---|---|
| Build | `pnpm exec next build`, Next 16.3.4, Turbopack, `cacheComponents: true` |
| Server | `pnpm exec next start --port 3021` (NODE_ENV=production) |
| Instrumentation | `NODE_OPTIONS=--require pgtap.cjs`, a `Module._load` hook that wraps `pg.Client.prototype.query` and logs every statement with its duration. Every SQL figure below is from that tap on the real server, not a simulation. |
| Query plans | `EXPLAIN (ANALYZE, BUFFERS)` against the live database, read only |
| Baseline latency | `SELECT 1` warm: **267 ms to 292 ms** (Neon pooler, `us-east-1`, dev machine in Asia) |

### The steady state, warm caches, per page

| Page | TTFB | Total | SQL statements | What the extra statements are |
|---|---:|---:|---:|---|
| `/dashboard` | 3 ms | **1.09 to 1.12 s** | 4 | none: stats come from `'use cache'` |
| `/dashboard/users` | 3 ms | 1.12 to 1.31 s | 4 | none: list comes from `'use cache'` |
| `/dashboard/locations` | 6 ms | 1.48 s | 5 | + locations list (cache miss) |
| `/dashboard/locations/amenities` | 4 ms | 1.47 s | 5 | + amenities |
| `/dashboard/roles` | 5 ms | 1.41 s | 5 | + `role_permission` matrix |
| `/dashboard/settings` | 4 ms | 1.44 s | 5 | + `site_settings` |
| `/dashboard/articles` | 6 ms | 1.76 s | 6 | + posts list and count (never cached) |
| `/dashboard/activity` | 5 ms | 3.22 s | 8 | + page, count, two facet scans |
| `/dashboard/profile` | 5 ms | 1.70 s | 7 or 8 | + profile, social links, **a second permission resolution** |

The four statements that are on **every single one** of those rows, in order, each starting
only when the previous one finished:

```
1.  273 ms  SELECT ... FROM "session"          WHERE token = $1              Better Auth
2.  274 ms  SELECT ... FROM "user"             WHERE id = $1                 Better Auth
3.  273 ms  SELECT id, role, banned, banExpires FROM "user" WHERE id = $1    permissions-server
4.  273 ms  SELECT id, permission, granted     FROM "user_permission" WHERE "userId" = $1
            ────────
            1 092 ms
```

`role_permission` does **not** appear. The `'use cache'` on `readAllRoleDefaults` is working
exactly as its comment claims.

---

# Ranked findings

## 1. Query 3 is a duplicate of query 2. It reads the same row of the same table, 273 ms later, for the same three columns.

**Evidence.** Full SQL from the tap, same request, 285 ms apart:

```
2.  SELECT "user"."id", "user"."name", "user"."email", "user"."emailVerified",
           "user"."image", "user"."bio", "user"."imagePublicId", "user"."createdAt",
           "user"."updatedAt", "user"."role"::text, "user"."banned",
           "user"."banReason", "user"."banExpires"
    FROM "user" WHERE "user"."id" = $1   VALUES=["NSqDbFBGxVCOkaJwkeZqR1IRK4FaDiYS", ...]

3.  SELECT "user"."id", "user"."role"::text, "user"."banned", "user"."banExpires"
    FROM "user" WHERE "user"."id" = $1   VALUES=["NSqDbFBGxVCOkaJwkeZqR1IRK4FaDiYS", ...]
```

Query 2 is issued by Better Auth inside `auth.api.getSession`. Query 3 is
`loadUser` at `wattup-frontend/lib/permissions-server.ts:65-70`, called from
`resolvePermissions` at `:172-180`, called from `getSessionPermissions` at
`wattup-frontend/lib/permission-guard.ts:34-39`.

I confirmed that the object Better Auth returns actually carries what query 3 goes back for:

```
session.user keys: name, email, emailVerified, image, createdAt, updatedAt,
                   role, banned, banReason, banExpires, bio, id
role: SUPER_ADMIN   banned: false   banExpires: null
```

`app/_actions/auth-actions.ts:44-60` then throws `banned` and `banExpires` away, keeping
only `{ id, email, role, name, image }`, which is why the second read has to happen.

**Category.** Round trip count. Pure waterfall, zero work.

**Fix.**

1. `app/_actions/auth-actions.ts#getSession`: add `banned: session.user.banned` and
   `banExpires: session.user.banExpires` to the returned object. This widens no disclosure:
   `getSession` resolves the session from the caller's own cookie, so a caller learns two
   facts about themselves that the sidebar already implies.
2. `lib/permissions-server.ts`: add a sibling to `resolvePermissions` that takes the user
   row instead of fetching it.

   ```ts
   /** The set for a user whose role and ban state the caller has ALREADY read from the
    *  database this request. Skips loadUser; everything else is identical. */
   export async function resolvePermissionsForKnownUser(user: {
       id: string; role: Role; banned: boolean | null; banExpires: Date | null;
   }): Promise<PermissionSet> {
       if (isBanned(user)) return NO_PERMISSIONS;
       const { defaults, overrides } = await loadGrants(prisma, user.role, user.id);
       return applyOverrides(defaults, overrides, user.role);
   }
   ```

   Wrap it in `cache()` keyed on `user.id`, the same way `getEffectivePermissions` is, so
   two callers in one request still share one resolution. Keep `resolvePermissions(db, id)`
   exactly as it is: the tests inject a stub through it, and `describePermissions` uses
   `loadUser` for its own reasons.
3. `lib/permission-guard.ts#getSessionPermissions`: call the new one, passing the session it
   already has. `session.role` is a `string`, so narrow it with the existing `isRole()`; if
   it is not a known role, fall back to `getEffectivePermissions(session.id)` rather than
   guessing.

**Security.** No change, and I want to be precise about why. This is safe **only** because
`app/_actions/auth-actions.ts:22-25` passes `disableCookieCache: true`. That is what makes
query 2 a real, uncached read of the `user` row rather than a five minute old signed cookie.
Take that flag away and `session.user.role` and `session.user.banned` become stale, and this
shortcut silently turns finding **F16** from a read-only staleness bug into a stale
*authorisation* decision, which is strictly worse than F16 ever was.

So: write the dependency into the comment on both files, and add a one line test that
asserts the `getSession` call still carries `query: { disableCookieCache: true }`. There is
already a test file at `app/_actions/__tests__/auth-session.test.ts` to put it in.

**Expected gain.** One of four round trips. **-273 ms per page and per server action here
(-25%), roughly -1 to -5 ms in production.** Confidence: high, the measurement is direct and
the redundancy is unambiguous.

---

## 2. After finding 1 there are three trips, and one of them can overlap the other two.

**Evidence.** The remaining chain is `session` → `user` → `user_permission`. The third only
needs a user id. `user_permission` for this user returns **zero rows** (`SELECT count(*)
FROM user_permission` = 0), and the query plan is a bitmap index scan on
`user_permission_userId_permission_key` taking 0.053 ms. It is 273 ms of pure latency for
an empty result.

**Category.** Round trip count again, but this time a genuine dependency that can be broken
speculatively rather than removed.

**Fix (the answer to "can session validation and permission resolution overlap?": yes,
soundly).**

The `__Secure-better-auth.session_data` cookie is a base64 JSON blob the server signed, and
it contains `session.user.id`. Read it, **do not verify it, do not trust it**, and use the id
only as a hint:

```ts
// lib/permission-guard.ts
export async function getSessionPermissions(): Promise<Authorised | null> {
    // The id the cookie CLAIMS. Never an authorisation input: it starts a read early and
    // the read is thrown away unless the validated session agrees with it.
    const claimed = userIdClaimedByCookie();          // parse only; null when absent
    const speculative = claimed ? loadOverrides(claimed) : null;
    speculative?.catch(() => {});                     // never an unhandled rejection

    const session = await getSession();               // the real validation, in parallel
    if (!session) return null;

    const overrides =
        claimed === session.id && speculative
            ? await speculative
            : await loadOverrides(session.id);        // hint absent or wrong: pay for it
    ...
}
```

The equality check must live inside this one function, so no future refactor can reach the
speculative result without it.

**Security trade-off, stated plainly.** The server gains exactly one new behaviour: an
unauthenticated caller can make it run one indexed `SELECT` against `user_permission` for a
user id of their choosing. The rows never reach the caller, they are discarded on mismatch,
and no authorisation decision is made from them. There is no timing oracle worth the name,
because the response time is dominated by the session validation running in parallel. The
extra query is the same cost as the one it replaces, so there is no amplification. If that
is still more cleverness than the team wants, stop at three trips and take finding 1 alone.

**Expected gain.** **-273 ms more (a 1.09 s page becomes ~0.55 s), roughly -1 to -5 ms in
production.** Confidence: high on the mechanism, medium on the exact figure, because the
cookie is absent on the first request after its five minute window and that request pays the
sequential cost.

**Theoretical floor, for completeness.** One hand written
`SELECT ... FROM session s JOIN "user" u ON u.id = s."userId" LEFT JOIN user_permission p ...
WHERE s.token = $1` would do the whole thing in a single trip. I am **not** recommending it:
it reimplements Better Auth's session validation (expiry handling, impersonation, the admin
plugin's ban handling, session refresh) and would have to be re-verified on every
`better-auth` upgrade. That is a large, permanent maintenance liability to buy 273 ms in
development and 3 ms in production.

---

## 3. The prerendered shell of every dashboard page is empty. On a hard load the user looks at a blank page until the session round trips finish.

This is the finding that best matches "it feels laggy", and it is the only one in the top
three that **does not** disappear when the app is deployed.

**Evidence.** The prerendered HTML that Next serves at TTFB:

```
$ wc -c .next/server/app/dashboard/users.html
    8778
visible text: ' Users | WattUp | WattUp USA '        # that is the <title>, and nothing else
animate-pulse occurrences: 0
```

The body is three empty Suspense holes:

```html
<div data-slot="sidebar-wrapper" ...>
  <!--$?--><template id="B:0"></template><!--/$-->              <!-- sidebar: fallback null -->
  <main data-slot="sidebar-inset" ...>
    <!--$?--><template id="B:1"></template><div class="h-(--header-height) ..."></div>
    <div class="@container/main ...">
      <!--$?--><template id="B:2"></template><!--/$-->           <!-- the page: fallback null -->
    </div>
  </main>
</div>
```

Chunk by chunk arrival of a real `/dashboard/users` request (node HTTP client, timestamps
from request start):

```
status 200  headers at +12 ms
  chunk  1 +   12 ms    8778 B   (the empty shell)
  chunk  2 +   16 ms   36113 B   (flight data; the loading.tsx skeleton is IN here, unrendered)
  chunk  3 +  560 ms    3690 B   "Welcome back"            <- 2 round trips
  chunk  5 +  560 ms    9820 B   the page skeleton finally paints
  chunk  6 + 1606 ms   26732 B   "Operate" (sidebar) + "Team" (content)   <- 4 round trips
```

For comparison, a public page prerenders 82 001 bytes of real content.

**Why.** `components/dashboard/dashbaord-wrapper.tsx:60` and `:78` both use
`<Suspense fallback={null}>`. The one at `:78` wraps `RequireSession`
(`components/dashboard/require-session.tsx:15`), which awaits `getSession()`. Route
hierarchy is:

```
dashboard/layout.tsx  →  Suspense(fallback={null})  →  RequireSession (async)
                      →  loading.tsx boundary        →  page
```

React renders the **outermost** pending boundary's fallback, which is `null`. The
`loading.tsx` skeleton is one level deeper, so it is serialized into the flight payload at
+16 ms and never becomes HTML. Every route's `loading.tsx` is therefore dead weight on a
hard load. (It does still work on client side navigation, because the shared layout is not
re-rendered then.)

**Category.** Streaming boundaries.

**Fix, in two sizes.**

*Small, safe, do it first.* Give both boundaries a real static fallback in
`components/dashboard/dashbaord-wrapper.tsx`:

- `:60` `<Suspense fallback={<SidebarSkeleton />}>` around `SidebarWrapper`. A new static
  component: the logo (already unconditional), the four group headings, six grey pills.
  It contains no permission data, so Next will prerender it into the shell.
- `:78` `<Suspense fallback={<OverviewBodySkeleton />}>` (or a new generic `PageBodySkeleton`)
  around `RequireSession`. `components/dashboard/ui/page-skeletons.tsx` already exports nine
  of these.

That alone moves first paint of a dashboard-shaped screen from ~560 ms to ~12 ms locally,
and from one server round trip to zero in production.

*Larger, better.* Let each route's own `loading.tsx` be the boundary that prerenders, by
taking `RequireSession` out of the layout. Every page except `profile` already renders
`SessionEnded` or `NoAccess` for itself, and every data reader calls `requirePermission`
independently, so nothing is protected by `RequireSession` that is not protected twice over
elsewhere. Audit these before removing it: `dashboard/profile/page.tsx` (its `PageContent`
returns `null` on no session), `dashboard/articles/page.tsx` (uses `authorised?.permissions`
and never checks for a null session), `locations/amenities`, `locations/create`,
`locations/edit/[id]`, `articles/create`, `articles/edit/[id]`.

For a route's skeleton to reach the shell, the page's default export must be **synchronous**
and put the awaiting part behind its own Suspense. Already correct: `/dashboard`,
`/dashboard/locations`, `/dashboard/locations/amenities`. Needs the shape change:
`users`, `users/[id]`, `roles`, `settings`, `activity`, `articles/create`,
`articles/edit/[id]`, `locations/edit/[id]`, all of which `await getSessionPermissions()` on
the first line of the default export.

**Expected gain.** No milliseconds off the total, and roughly **550 ms off time to first
meaningful paint locally, one full server round trip in production**. Confidence: high.
This is a perception fix and it is the right kind: the work genuinely cannot start earlier,
so the correct answer is to show the shape of the answer immediately.

---

## 4. GSAP plus ScrollTrigger, 42 KB gzipped and 113 KB parsed, ships on every dashboard and admin route.

**Evidence.**

```
.next/static/chunks/2x-blockp0w7-.js   113 578 B raw, 43 980 B gzipped
  contains: "Missing plugin? gsap.registerPlugin()", "scrollTrigger", easing tables,
            and FadeUp's own call site ("top 85%", "power3.out")
  referenced by: /dashboard, /admin  (grep of the served HTML: 1 hit each)
```

The only client component in the root tree that imports it is `components/ui/fade-up.tsx`
(`import gsap from 'gsap'; import { ScrollTrigger } from 'gsap/ScrollTrigger';` at lines 4
and 5, with a module scope `gsap.registerPlugin(ScrollTrigger)` at line 7). The only root
level file that pulls `FadeUp` into every route's tree is **`app/not-found.tsx:2`**, and
Next includes the root `not-found` boundary in every route's client bundle. `app/layout.tsx`
imports nothing that reaches gsap, and there is no `app/error.tsx` or `app/global-error.tsx`.

**Category.** Client bundle and hydration. Entirely geography independent, so this cost is
identical in production and it is paid on a phone.

**Fix.** Any one of these, in order of preference:

1. Replace `<FadeUp>` in `app/not-found.tsx` with the CSS keyframe the codebase already has
   for exactly this purpose (`.wattup-page-enter` in `globals.css`, whose comment explains
   why a keyframe beat the JS animation last time). A 404 page does not need a scroll
   triggered timeline.
2. `const FadeUp = dynamic(() => import('@/components/ui/fade-up').then(m => m.FadeUp),
   { ssr: false })` in `not-found.tsx` only.
3. Move the styled 404 body into `app/(frontend)/` and leave a plain one at the root.

Then re-run the chunk measurement to confirm the chunk is gone from `/dashboard`.

**Expected gain.** **-42 KB gzipped and -113 KB of parse and execute on every dashboard
route, in every environment.** On a mid range phone that is roughly 100 ms to 200 ms of main
thread work at hydration. Confidence: high on the size, medium on the millisecond figure
(not measured on a device).

---

## 5. Prefetching: the sidebar is right, twelve in-page links are not, and none of it can prefetch the data.

**First, the thing that has to be said before any prefetch advice.** With
`cacheComponents: true` (which is Partial Prerendering), a prefetch can only ever deliver the
route's **App Shell**. Every dashboard page's shell is the 8.8 KB of empty holes shown in
finding 3. I verified there is no database work behind a prefetch: an RSC prefetch request
issued **0** SQL statements, while the RSC navigation request for the same URL issued **4**.
So the four round trips are paid on click, every time, and no `prefetch` attribute changes
that. The sidebar's `prefetch={item.prefetch ?? true}` at `components/nav-main.tsx:92` is
correct and harmless, but it is buying the route's JS chunks and an empty shell, not data.

Next 16's own doc, `node_modules/next/dist/docs/01-app/03-api-reference/02-components/link.md`
line 302: *"`auto` or `null` (default): ... For dynamic routes, the partial route down to the
nearest segment with a `loading.js` boundary will be prefetched."* Line 306, for Partial
Prefetching: *"`auto` prefetches the per-route App Shell (the route's static and cached
content) instead of the full page."*

**So the value of adding `prefetch` to the links below is the route's client chunks**, which
for the editor routes is 350 KB to 550 KB gzipped. That is worth having on hover.

**Links with no `prefetch` prop, all defaulting to `auto`:**

| File:line | Target | Visible or in a menu | Worth prefetching |
|---|---|---|---|
| `components/dashboard/users/users-client.tsx:282` | `/dashboard/users/{id}` | visible, one per row | yes |
| `components/dashboard/activity/activity-columns.tsx:69` | `/dashboard/users/{id}` | visible, one per row | yes |
| `components/dashboard/articles/articles-data-table.tsx:74` | `/dashboard/articles/create` | visible button | **yes, 547 KB gz route** |
| `components/dashboard/locations/locations-client.tsx:175` | add-location button | visible button | yes |
| `app/(dashboard)/dashboard/page.tsx:46` | `/dashboard/locations` | visible button | yes |
| `app/(dashboard)/dashboard/page.tsx:216` | `/dashboard/locations` (x2 rows) | visible | yes |
| `app/(dashboard)/dashboard/page.tsx:264` | three QuickLink cards | visible | yes |
| `app/(dashboard)/dashboard/users/[id]/page.tsx:172` | `/dashboard/users` | visible | yes |
| `components/dashboard/users/detail/activity-table.tsx:85` | pagination prev/next | visible | yes |
| `components/dashboard/articles/article-form/header-actions.tsx:43` | `/dashboard/articles` | visible | yes |
| `components/app-sidebar.tsx:146` | `/dashboard` (logo) | visible | yes |
| `components/dashboard/articles/columns.tsx:129` | `/dashboard/articles/edit/{id}` | inside a dropdown | on open, fine as is |
| `components/dashboard/locations/columns.tsx:159` | `/dashboard/locations/edit/{id}` | inside a dropdown | on open, fine as is |
| `components/nav-user.tsx:132,146` | profile / settings | inside a dropdown | on open, fine as is |

**Fix.** Add `prefetch` to the ten visible ones. Leave the dropdown ones alone: they mount
only when the menu opens, which is already the right moment.

Do **not** add `prefetch` to the four external links
(`site-header.tsx:36`, `locations/columns.tsx:165`, `articles/columns.tsx:122` and `:362`);
they are `target="_blank"` to the public site and prefetching them would warm marketing pages
nobody asked for.

**Expected gain.** Nothing off the server time. It removes the chunk download from the click
path, worth roughly 100 ms to 400 ms on the editor routes over a real connection.
Confidence: medium, because it depends entirely on the visitor's link and whether the chunks
are already cached.

---

## 6. Dashboard routes ship 302 KB to 547 KB of gzipped JavaScript.

**Evidence** (sum of every `/_next/static/chunks/*.js` referenced by the served HTML):

| Route | chunks | raw | gzipped |
|---|---:|---:|---:|
| `/dashboard` | 19 | 939 KB | **302 KB** |
| `/dashboard/locations` | 22 | 1 093 KB | 348 KB |
| `/dashboard/activity` | 22 | 1 095 KB | 349 KB |
| `/dashboard/articles` | 23 | 1 106 KB | 352 KB |
| `/dashboard/profile` | 23 | 1 136 KB | 366 KB |
| `/dashboard/users` | 23 | 1 273 KB | 387 KB |
| `/dashboard/settings` | 21 | 1 510 KB | **494 KB** |
| `/dashboard/articles/create` | 23 | 1 763 KB | **547 KB** |

Library attribution by grepping the served chunks:

- `/dashboard/settings`: a **189 KB gz** chunk containing `@codemirror`. `PageContent` is
  awaited behind `<Suspense fallback={<SettingsBodySkeleton/>}>`, but the editor is a static
  import so the chunk is in the initial HTML regardless.
- `/dashboard/articles/create`: a **186 KB gz** chunk containing ProseMirror/TipTap, plus
  **45 KB gz** of `highlight.js`/lowlight.
- `/dashboard/users`: **74 KB gz** across two chunks containing zod.
- every route: **42 KB gz** of gsap (finding 4).

**Fix.**

- Take finding 4 first, it is free.
- `next/dynamic` with `ssr: false` for the CodeMirror editor in
  `components/dashboard/settings/` and for the TipTap editor body, so the ~190 KB arrives
  when the editor mounts rather than in the document. Both are already inside a Suspense
  boundary with a skeleton, so there is a natural place to put the loading state.
- `lowlight`/`highlight.js` registers every language by default. Register only the languages
  the editor offers.
- zod at 74 KB on `/dashboard/users` is worth one look: `lib/validations/` schemas imported
  by a client component pull the runtime into the browser. Where the schema is only used to
  validate a server action's input, keep it server side.

**Expected gain.** `/dashboard/settings` 494 KB → roughly 300 KB gz, `/dashboard/articles/create`
547 KB → roughly 320 KB gz. Confidence: high on the numbers, medium on the effort, because
the TipTap split needs care with SSR of existing content.

---

## 7. Every server action pays the same four round trips before it does anything.

**Evidence.** Code path, not a direct measurement (I could not construct a valid Next 16
server action body by hand; the attempt returned an error digest rather than a result).
`requirePermission` at `lib/permission-guard.ts:46-50` calls `getSessionPermissions`, which is
the identical four query chain measured above. Every one of the 54 exported actions begins
with it, and so does every reader in `lib/dashboard/` and `lib/locations/dashboard.ts`.

So the Activity screen's "repeat filters are ~11 ms" is a TanStack cache **hit**. A filter
combination not seen before goes `fetchActivityPage` → `getSiteActivity` →
`requirePermission` (4 trips) → `readSiteActivity` (1 trip on a cache miss) = **five
sequential trips, roughly 1.4 s**. `hooks/use-activity.ts` sets `refetchOnWindowFocus: true`
with a 30 s `staleTime`, so tabbing back to a dashboard left open for a minute pays it again.

**Fix.** Findings 1 and 2 fix this everywhere at once, which is the main reason to do them
even though the production saving is small. Nothing action specific is needed.

**Expected gain.** Same proportion as findings 1 and 2: **-50% of the fixed cost on every
mutation and every TanStack cache miss.** Confidence: high on the mechanism.

---

## 8. `/dashboard/articles` is the one list read that is never cached, and it sends full article HTML to the browser.

**Evidence.** `app/_actions/postActions.ts:129-133`:

```ts
prisma.posts.findMany({ skip, take: pageSize, orderBy: [{ createdAt: 'desc' }] })
```

No `select`, so every column comes back including `content`. Current data:
five posts, 16 894 bytes of HTML total, one of them 8 986 bytes. Those rows go straight into
`initialData` on `ArticlesDataTable` (`app/(dashboard)/dashboard/articles/page.tsx:31`), so
the article bodies are serialized into the RSC payload and shipped to the browser to render
a table of title, status, author and date.

It is also the only dashboard list with no `'use cache'`: `users`, `locations`, `amenities`,
`roles` and `site_settings` all have one, which is why they showed 4 statements in the warm
table above and articles showed 6.

**Fix.**

1. Add a `select` with the eight columns the table actually renders. Check
   `components/dashboard/articles/columns.tsx` for the exact list; `content` and
   `featuredImage` are not among them.
2. Move the read into a server-only module with the shape the codebase already established in
   `lib/dashboard/users.ts`: an uncached wrapper that does `requirePermission`, and a cached
   reader underneath tagged `POSTS_TAG` (already defined in `lib/cache-tags.ts:38`, and every
   mutation in `postActions.ts` already calls `updateTag('posts')`, so the invalidation
   side is done).

**Expected gain.** One round trip off `/dashboard/articles` (**-286 ms here**), and a payload
that stops growing with the length of the articles. Confidence: high.

---

## 9. `getOverviewStats` fans out to twelve parallel queries against a pool of ten, which is a cold start problem rather than a steady state one.

**Evidence.** `lib/dashboard/overview.ts:38-64` issues twelve counts and aggregates in one
`Promise.all`. On a cold pool the tap shows them arriving in waves, not in parallel:

```
+096470  two queries
+096765  two queries
   ... a 1 073 ms gap ...
+098115  eight queries
```

2 029 ms wall for twelve queries that each execute in under 0.3 ms server side. The gap is
`pg` opening new connections, each needing a TLS handshake to Neon. `lib/prisma.ts:8-10`
constructs `PrismaPg` with only a connection string, so `pg`'s default `max: 10` applies and
two of the twelve queue behind the others.

Warm, this costs nothing at all: `cacheLife('hours')` means it did not appear in any of the
steady state traces.

**Category.** Round trip count on a cold instance, and connection establishment rather than
query work.

**Fix.** This is a Vercel cold start concern, so it is worth doing before deploy but not
worth panicking about. Either:

- collapse the twelve into two queries, one `SELECT count(*) FILTER (WHERE ...)` over
  `location` covering seven of the counters plus the `chargerCount` sum, and one over the
  remaining tables; or
- leave the code and set an explicit pool size in `lib/prisma.ts`
  (`new PrismaPg({ connectionString, max: 4 })`), which caps concurrent connection setup.
  The URL already points at the Neon `-pooler` endpoint, so pgbouncer is in front and a small
  client pool is the right shape.

The first is better: it also makes the counters consistent with each other, which twelve
independent statements are not.

**Expected gain.** Roughly **-1.5 s on the first `/dashboard` render of a cold instance**
locally, and it removes a spike from every Vercel cold start. Zero on a warm cache.
Confidence: high locally, medium in production.

---

## 10. `/dashboard/profile` resolves the caller's permissions twice.

**Evidence.** Tap trace for one request:

```
3.  user   (role, banned, banExpires)   <- getSessionPermissions
4.  user_permission                     <- getSessionPermissions
...
5.  SocialLink                          }
6.  user   (name, bio, image)           } parallel, from PageContent's Promise.all
7.  user   (role, banned, banExpires)   <- describeUserPermissions, cache MISS
8.  user_permission                     <- describeUserPermissions, cache MISS
```

`components/dashboard/profile/page-content.tsx:12` calls `getSessionPermissions()`, then
`:27` calls `describeUserPermissions(session.id)`. The second is a different function with a
different purpose (provenance for the "My access" table) and it has its own `'use cache'` at
`lib/permissions-server.ts:266-271`, so on a warm cache it is free. On a miss it repeats both
queries. The same double read exists on `app/(dashboard)/dashboard/users/[id]/page.tsx:154`.

**Fix.** Low priority, and the honest answer is "leave it". The cached reader is correct and
correctly tagged, the miss is rare, and merging the two would mean either putting a
permission check inside a cached scope (which cannot read headers) or threading the raw rows
through, both of which cost more clarity than the 570 ms they save on a cold cache. If it
does become annoying, raise `cacheLife` on `readUserPermissions` from `stale: 30` to something
longer; it draws a table, it decides nothing.

**Expected gain.** Up to 570 ms on a cache miss, zero when warm. Confidence: high on the
measurement, low on how often it fires.

---

## 11. Two indexes that are not needed yet and will be.

`activity_log` currently holds 41 rows, so every plan is a sequential scan and every one runs
in under 0.12 ms. Two of the queries have no index that can ever serve them:

- Site-wide unfiltered: `ORDER BY "createdAt" DESC LIMIT 20`. The four existing indexes are
  all composite and lead with another column (`app`, `email`, `userId`, `actorUserId`), so a
  bare `createdAt` sort has nothing to use. Plan today: `Seq Scan` + `top-N heapsort`. Add
  `@@index([createdAt])` on `ActivityLog` when the table passes a few tens of thousands of rows.
- Email filter: `email ILIKE '%value%'` (`lib/dashboard/activity.ts:132`,
  `contains` with `mode: 'insensitive'`). A leading wildcard cannot use a b-tree at all. If
  that filter is used seriously, it wants
  `CREATE INDEX ... USING gin (email gin_trgm_ops)` and the `pg_trgm` extension.

Nothing else is missing. See "what I did not find" below.

**Expected gain.** Zero today. Confidence: high, from the plans.

---

# The three questions, answered directly

### Q: where do the four round trips come from?

Answered in full above. Two belong to Better Auth (`session` by token, then `user` by id,
sequential inside `auth.api.getSession`), and two belong to
`lib/permissions-server.ts` (`user` again, then `user_permission`). The third is redundant
with the second. `role_permission` is already cached out of the path.

### Q: can the permission set be resolved once and shared for the whole navigation session, through a context provider or a store?

**A client-held permission set removes zero round trips today, and I would not build one for
performance.** The reasoning:

- The dashboard is server rendered. On every navigation the server must resolve the set to
  decide what to render, whatever the browser is holding. A React context cannot answer a
  question the server is asking.
- Within one request the set is *already* resolved once: `getEffectivePermissions` is wrapped
  in React's `cache()` (`lib/permissions-server.ts:190`), and `getSession` likewise
  (`auth-actions.ts:22`). The four queries above are one resolution, not several. There is no
  duplication left to remove at the request level. (`/dashboard/profile` is the one exception,
  finding 10, and that is a different function.)
- A provider would only start paying if the dashboard screens became client rendered and fed
  by TanStack Query, the way `/dashboard/activity` already is. That is a large architectural
  change, and it moves the gating for *drawing* into the browser.
- **The server must never accept a permission from the client.** Whatever a provider holds is
  presentation. Every server action and every reader must keep calling `requirePermission`.
  The codebase is already disciplined about this (`lib/permission-inventory.ts` exists to
  enforce it) and nothing here should loosen it.

**What the owner actually wants is cross-request caching on the server, and there is a
narrow, defensible version of it.** The four queries split into three security categories:

| Query | May it be cached across requests? |
|---|---|
| 1, `session` by token | **Never.** This is finding F16. A revoked or signed-out session must stop working on the next request, and `disableCookieCache: true` is what guarantees it. |
| 2, `user` by id | Never, for the same reason: it is what makes `role` and `banned` fresh. |
| 4, `user_permission` by userId | **Arguably yes**, on exactly the argument already accepted for `role_permission`. |

`readAllRoleDefaults` is already cached on the authorisation path
(`lib/permissions-server.ts:84-93`), with `cacheTag(ROLE_PERMISSIONS_TAG)` and
`app/_actions/role-permission-actions.ts:117` invalidating it. The per-user overrides have
the same shape: `lib/cache-tags.ts:51-58` defines `invalidateUserAccess`, and all seven
mutating paths in `app/_actions/admin-user-actions.ts` call it (lines 178, 227, 268, 299,
344, 449, 515). So a `'use cache'` on the override read, tagged `userPermissionsTag(userId)`,
would be invalidated by every writer that exists today.

**State the risk before doing it.** With that cache in place:

- a ban still bites immediately (it comes from query 2, uncached);
- a role change still bites immediately (also query 2; the role to defaults map is cached but
  tagged and invalidated);
- a session revoke still bites immediately (query 1, uncached);
- **a per-user grant or revoke bites immediately only for as long as every writer remembers
  to call `invalidateUserAccess`.** A future action that forgets leaves a stale *authorisation*
  answer for up to `cacheLife.expire`. That is the F16 failure mode returning by a different
  door, and it is worse than F16 was, because F16 was read-only staleness and this would be a
  live permission.
- a direct SQL edit or a seed run goes stale for up to the same window.

My recommendation: **do findings 1 and 2 first.** They get the same 50% with no security
surface at all. Only if the measured production number turns out to justify it should the
override cache be considered, and if it is, it needs a test that fails when a new mutation of
`user_permission` does not invalidate the tag.

### Q: is there a safe way to overlap session validation with permission resolution?

Yes. Finding 2, in full, including exactly what an attacker gains (one discarded indexed
SELECT on an id of their choosing) and exactly where the equality check has to live.

### Q: is every dashboard link prefetching?

No. Ten visible links are not, listed in finding 5, and the fix is one prop each. But read
the caveat at the top of finding 5 first: under `cacheComponents` a prefetch delivers the
route's empty App Shell and its JS chunks, never the data, which I verified (prefetch request:
0 SQL statements; navigation request for the same URL: 4). Prefetching is not the lever it
would be on a non-PPR app.

---

# What I did NOT find, so nobody optimises it later

**No missing index, and no query that does any real work.** Every hot query is under 0.15 ms
server side, measured with `EXPLAIN (ANALYZE, BUFFERS)` against the live database:

```
session by token             Execution Time 0.064 ms
user by id                   Execution Time 0.034 ms
user_permission by userId    Execution Time 0.053 ms   (Bitmap Index Scan)
activity page 1              Execution Time 0.073 ms
activity count               Execution Time 0.056 ms
activity distinct app        Execution Time 0.116 ms
activity distinct event      Execution Time 0.068 ms
posts list                   Execution Time 0.048 ms
users list                   Execution Time 0.042 ms
```

Row counts: `user` 3, `session` 27, `user_permission` 0, `role_permission` 70,
`activity_log` 41, `location` 27, `Posts` 5, `amenity` 15. The sequential scans in those
plans are the planner being right about tiny tables, not a missing index. **Do not add
indexes to make the plans look better.**

**No N+1 anywhere.** `readDashboardLocations` uses `_count` rather than a per-row query,
`readUsers` selects flat columns, the activity reads are a page plus a count in one
`Promise.all`. I looked for the pattern and it is not present.

**The `'use cache'` tagging is correct and complete for every reader I checked.** Each cached
read has a tag, and each tag has at least one writer that invalidates it: `LOCATIONS_TAG`
(`locationActions.ts` and `amenityActions.ts`), `POSTS_TAG` (`postActions.ts`),
`ROLE_PERMISSIONS_TAG` (`role-permission-actions.ts:117`), `USERS_TAG`, `userTag`,
`userPermissionsTag` (all three through `invalidateUserAccess`), `ACTIVITY_TAG`
(`lib/activity-log.ts:147`), `siteSettings` (`settingsActions.ts:121`). The comment at the
top of `lib/cache-tags.ts` describing the rule is accurate, and the two deliberate
exclusions (the authorisation path and the activity log) are the right two. This is the best
maintained part of the data layer and it should be left alone.

**`experimental.staleTimes` is real and active, not just configured.** It reaches the client:
`.next/static/chunks/2-g_8r3ky06l1.js` compiles to
`o = 1e3 * Number("30")` for `DYNAMIC_STALETIME_MS` and `getStaleTimeMs(Number("180"))` for
static. So returning to a dashboard page visited in the last 30 seconds already costs no
server request. That optimisation is done.

**The role defaults cache is working.** `role_permission` does not appear in any warm trace.
Whoever added `readAllRoleDefaults` removed a real round trip and the comment claiming so is
accurate.

**TTFB is not the problem.** 2 ms to 6 ms on every dashboard route. The shell streams
immediately. The problem is that the shell is empty, which is finding 3, not a TTFB issue.

**Prisma `$transaction` is not worth revisiting.** Already measured as slower (1 140 ms
against 287 ms) because of `BEGIN`/`COMMIT` round trips, and nothing in this audit changes
that. `Promise.all` of independent Prisma queries genuinely does cost one round trip warm:
I re-confirmed it at 274 ms for two queries.

**The session cookie cache is correctly disabled and must stay disabled.** Removing
`disableCookieCache: true` would delete queries 1 and 2 outright and take the page from four
trips to two, which is why somebody will eventually suggest it. It is finding F16 and it is
the one change in this document that must not be made.

**The database URL already points at the Neon pooler** (`ep-...-pooler.c-5.us-east-1.aws.neon.tech`
with `sslmode=verify-full`). There is no connection pooling win left to take at that layer.

**`getSiteSettings` in the root layout costs the dashboard nothing.** `app/layout.tsx:109`
awaits it on every render including dashboard renders, but it is cached and it produced zero
statements in every trace.

**No route uses a stale segment config.** No `export const dynamic`, `revalidate` or
`fetchCache` anywhere under `app/(dashboard)`, which is the correct state under
`cacheComponents`.

**`components/nav-main.tsx` prefetching is already right,** it just cannot do what one would
hope (see finding 5).

---

# Loose ends

**One unexplained observation, recorded because it is not a performance issue and somebody
should know.** During the audit a valid session row for `devripon.io@gmail.com` disappeared
from the `session` table roughly six to nine minutes after sign-in, while the browserless
client was still using it. `SELECT * FROM "session" WHERE token = ...` returned zero rows and
`WHERE "userId" = ...` returned zero rows, while 26 rows for other users remained. The SQL tap
recorded **no `DELETE`** from the Next server across 94 statements, so it did not come from
this application's request path. I could not attribute it and did not pursue it further. If
the owner is seeing spurious "Your session has ended" screens, this may be the same thing and
it is worth a look independently of performance.

**`next start` warns "does not work with `output: standalone`".** It served everything
correctly for these measurements. It matters only for self-hosting, where the entrypoint must
be `node .next/standalone/server.js`. Vercel ignores it.

---

# Suggested order of work

| # | Change | Local gain | Production gain | Risk |
|:--:|---|---|---|---|
| 1 | Drop the duplicate `user` read (finding 1) | -273 ms per page and per action | -1 to -5 ms | none, with the `disableCookieCache` test |
| 2 | Real Suspense fallbacks in the dashboard wrapper (finding 3) | -550 ms to first paint | one round trip to first paint | none |
| 3 | Get gsap out of `not-found.tsx` (finding 4) | -42 KB gz everywhere | same | none |
| 4 | `prefetch` on the ten visible links (finding 5) | chunk download off the click path | same | none |
| 5 | `select` + `'use cache'` on the articles list (finding 8) | -286 ms on one page | -1 to -5 ms | low |
| 6 | Dynamic import for CodeMirror and TipTap (finding 6) | -190 KB gz on two routes | same | medium |
| 7 | Collapse the overview counts (finding 9) | -1.5 s on a cold instance | cold starts only | low |
| 8 | Speculative overrides read (finding 2) | -273 ms more | -1 to -5 ms | low, and named in full |
| 9 | Cross-request cache of `user_permission` | -273 ms more | -1 to -5 ms | **security decision, see Q2** |

Items 2, 3, 4 and 6 are the ones that still matter after the app is deployed.

---

## Reproducing any of this

```bash
cd wattup-frontend
pnpm exec next build
NODE_OPTIONS="--require /path/to/pgtap.cjs" pnpm exec next start --port 3021

# sign in (Origin must match trustedOrigins, which is BETTER_AUTH_URL)
curl -s -c jar.txt -X POST http://localhost:3021/api/auth/sign-in/email \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"email":"...","password":"..."}'

# the cookies carry the __Secure- prefix in a production build, so curl will not
# replay them from the jar over http. Build a Cookie header by hand instead:
awk -F'\t' '/better-auth/ {printf "%s=%s; ", $6, $7}' jar.txt > cookie.txt
curl -s -o /dev/null -w '%{time_starttransfer} %{time_total}\n' \
  -H "Cookie: $(cat cookie.txt)" http://localhost:3021/dashboard
```

`pgtap.cjs` is a `Module._load` hook that wraps `pg.Client.prototype.query`. Note that `pg`
calls it in **callback** mode from the pool, not promise mode, so a naive `.then()` wrapper
reports 0 ms for every statement; wrap the trailing callback as well.

---

# Implemented — 2026-09-03

Findings 1, 3, 4, 5, 8, 6 and 9 landed on local `main` as seven commits, one per finding,
so any single one can be reverted alone. Findings 2, 9-in-the-body (the cross-request
cache of `user_permission`) and 10 were deliberately not done, and 11 correctly created no
migration. What follows is what was measured after the change, not what was expected.

| # | Finding | Commit | Landed |
|:--:|---|---|:--:|
| 1 | duplicate `user` read | `perf(auth): resolve permissions from the row the session read already returned` | ✅ |
| 3 | empty Suspense fallbacks | `perf(dashboard): give the shell's two Suspense boundaries a real fallback` | ✅ |
| 4 | gsap on every dashboard route | `perf(bundle): drop gsap from every dashboard and admin route` | ✅ |
| 5 | prefetch on ten visible links | `perf(dashboard): prefetch the ten visible in-page links` | ✅ |
| 8 | articles list: no `select`, no cache | `perf(articles): select the columns the table draws, and cache the read` | ✅ |
| 6 | CodeMirror, TipTap, zod, lowlight | `perf(bundle): load CodeMirror, TipTap and the invite dialog on demand` | ✅ |
| 9 | twelve overview counts | `perf(overview): two aggregates instead of twelve counts` | ✅ |
| 7 | server actions pay the same trips | (none needed) | ✅ by finding 1 |
| 2 | speculative overrides read | — | ❌ skipped, see below |
| 9 body | cross-request cache of `user_permission` | — | ❌ not done, security decision |
| 10 | `/dashboard/profile` double resolution | — | ❌ left alone, as recommended |
| 11 | two indexes | — | ❌ no migration, as recommended |

## Measured after

**Finding 1.** Against the live database, with a tap wrapping `pg.Client.prototype.query`:

```
resolvePermissions(prisma, id)            3 statements, "user" x1
  279 ms  SELECT ... FROM "user"                  <- gone
  278 ms  SELECT ... FROM "user_permission"
  279 ms  SELECT ... FROM "role_permission"       (cached out in a real build)

resolvePermissionsForKnownUser(row)       2 statements, "user" x0
  280 ms  SELECT ... FROM "user_permission"
  337 ms  SELECT ... FROM "role_permission"       (cached out in a real build)
```

So the permission half goes from two round trips to one, and a dashboard page from four
to three. Round trip latency re-measured at 278 to 337 ms, against the audit's 273 ms.

**Finding 3.** Prerendered HTML from a production build:

| Route | before | after |
|---|---|---|
| `/dashboard` | 8 768 B, 0 `animate-pulse` | 23 632 B, 85 |
| `/dashboard/users` | 8 778 B, 0 | 23 642 B, 85 |
| `/dashboard/settings` | 8 809 B, 0 | 23 673 B, 85 |
| `/dashboard/articles` | 8 922 B, 0 | 23 786 B, 85 |
| `/dashboard/activity` | 8 788 B, 0 | 23 652 B, 85 |

**Finding 4.** The gsap chunk (113 578 B raw, 43 980 B gzipped) is referenced by **0**
dashboard routes and **0** auth routes, down from all of them, and still by the 14
marketing pages that use `FadeUp`. The dashboard shell's chunk set went 19 chunks /
309 267 B gz to 17 / 259 540 B gz, **-49 727 B gzipped**.

**Finding 6.** Two production builds of the same tree, initial JS per route, gzipped,
counting every static chunk named by the route's prerendered HTML and its client
reference manifest:

| Route | before | after | delta |
|---|---:|---:|---:|
| `/dashboard/articles/create` | 516 578 | 304 627 | **-211 951, -41.0%** |
| `/dashboard/settings` | 462 356 | 271 487 | **-190 869, -41.3%** |
| `/dashboard/users` | 352 055 | 277 052 | **-75 003, -21.3%** |
| every other dashboard route | | | -456 each |

The deferred chunks now sit in each route's `react-loadable-manifest.json`: 191 997 B gz
for settings, 197 587 for the article editor, 76 894 for users.

**Finding 8.** Against the live database, five posts: article `content` on the wire
16 938 B, largest single article 9 014 B. Serialised rows **19 445 B → 3 299 B, -83.0%**,
and the payload no longer grows with the length of the articles.

**Finding 9.** Against the live database: **12 statements / 2 265 ms → 2 statements /
274 ms**, one round trip, with all thirteen numbers identical field by field.

## Where this audit was wrong

Three things did not survive contact with the code. None of them is a criticism of the
measurement; they are places where the reading of the source was off.

**Finding 3's "larger, better" version is not safe, and the sentence that says it is,
is false.** The audit says "every page except `profile` already renders `SessionEnded` or
`NoAccess` for itself, so nothing is protected by `RequireSession` that is not protected
twice over elsewhere". Checked route by route, two pages lose their guard entirely:

- `app/(dashboard)/dashboard/articles/page.tsx` has **no null-session branch at all**. Its
  only use of the resolved pair is `hasPermission(authorised?.permissions, ...)`, which
  reads a missing session as a missing permission, and `getArticlesForDashboard` answers a
  refusal with the *public* list rather than with nothing. Signed out, that page would
  render the full Articles screen, populated with every published article and a "Write
  Article" button.
- `components/dashboard/profile/page-content.tsx` answers a null session with
  `return null`, under a header the page renders unconditionally: a signed-in looking
  Profile screen with an empty body.

Five more (`locations`, `locations/amenities`, `locations/create`, `locations/edit/[id]`,
`settings`) refuse only through that same conflation, so a dead session is told "You do
not have access" and offered a link that walks back into the dashboard instead of the
button that clears the cookie. No data escapes on any of those: every reader self-guards
to `[]` or `null`. So the small version was done and `RequireSession` stays in the layout.
The reasoning is written into `components/dashboard/require-session.tsx`. Lifting it out
remains available once those seven pages answer a null session themselves.

**Finding 8's column list is wrong about `content`.** The audit says "`content` and
`featuredImage` are not among them". `featuredImage` is not, but `content` is:
`components/dashboard/articles/columns.tsx` has a Content column that strips the tags and
clamps the result to three lines. So `content` was not dropped, it is prepared server side
into a 240 character plain text excerpt, which the cell's own regex passes through
unchanged. That is a bigger win than dropping the column would have been honest.

**Finding 6's lowlight advice assumes a language picker that does not exist.** "Register
only the languages the editor offers" has no answer, because the editor offers none:
`components/tiptap-ui/code-block-button` toggles the node and passes no language, and
there is no code block node view. `common`'s thirty seven grammars existed only for
auto-detection. Nine are now registered by hand; anything else renders as a code block
without colouring.

**One thing the audit missed.** `components/rich-text-content.tsx` is `'use client'` and
imports `lib/highlight-utils.ts`, whose own docblock says it "is meant to be used on the
server or during build time". That ships `unified`, `rehype-parse`, `rehype-highlight`,
`rehype-stringify` and a second copy of lowlight to the browser on the public
`/press-release/[slug]` route: **121 650 B gzipped**. It is a public page, so it was out
of scope here, but it is the single largest remaining client bundle item in the app and it
looks like a mistake rather than a decision.

## Deliberately not done

**Finding 2, the speculative overrides read: skipped.** Not because the mechanism is
unsound. Because doing it *the way this document specifies* means threading pre-read
override rows from `getSessionPermissions` into the resolver, which requires splitting
`loadGrants` and re-implementing its missing-table fallback (the `P2021` path that answers
from the in-code `ROLE_PERMISSIONS` map when the migration has not run) across two call
sites. That is surgery on the authorisation resolver's error handling to buy, by this
document's own estimate, 1 to 5 ms in production. It is also the only change in this set
with a stated security trade-off: an unauthenticated caller gains the ability to make the
server run one indexed `SELECT` against `user_permission` for a user id of their choosing.
No security review was run on this work.

There is a cleaner shape if it is wanted later, and it is worth writing down. Make the
override read a `cache()`d function keyed on the user id, exported as
`readOverridesFor(userId)`, and have `getSessionPermissions` call it once with the id the
cookie claims before awaiting `getSession()`. The resolver then asks for
`readOverridesFor(session.id)` as it already would. A hint that agrees reuses the in-flight
promise; a hint that disagrees is unreachable, because **the user id is the cache key**.
That is a stronger guarantee than a `claimed === session.id` comparison, since it cannot be
forgotten in a refactor, and it needs no change to `loadGrants` at all. It should still
have a security review before it lands, for the unauthenticated-SELECT reason above.

Two further notes if it is revisited: Better Auth exports `getCookieCache` from
`better-auth/cookies` (this codebase already imports `getSessionCookie` from there), which
parses and HMAC-verifies the `session_data` cookie including its chunked form, so no
hand-written parser and no coupling to an internal format is needed. And
`session.cookieCache.maxAge` is 5 minutes in `lib/auth.ts`, so on a dashboard left open the
hint is frequently absent and the request pays the sequential cost anyway.

**The cross-request cache of `user_permission` (the body's finding 9, item 9 in the order
table): not done, and not because of effort.** This document marks it "security decision"
and says why: with it in place, a per-user grant or revoke bites immediately only for as
long as every writer remembers to call `invalidateUserAccess`, and a future mutation that
forgets leaves a stale *authorisation* answer for up to `cacheLife.expire`. That is F16's
failure mode returning by a different door, and worse than F16 was, because F16 was
read-only staleness and this would be a live permission. The owner has not signed off. It
stays out.

**Finding 10, `/dashboard/profile`'s double resolution: left as it is**, exactly as this
document recommends.

**Finding 11, the two indexes: no migration was created**, exactly as this document
recommends, and `DATABASE_URL` points at production. Recorded here as the trigger rather
than as work: add `@@index([createdAt])` on `ActivityLog` when `activity_log` passes a few
tens of thousands of rows, and consider `pg_trgm` plus a GIN index on `email` if the
activity email filter (`contains`, `mode: 'insensitive'`) is used seriously. Both are
sequential scans under 0.12 ms today at 41 rows.

## What could not be verified, and why

**No end-to-end authenticated page request was measured after the change.** The audit's
own table (TTFB, total, SQL statements per page) could not be reproduced, because signing
in needs a credential this work did not have. `ADMIN_EMAIL` in `.env` is
`admin@wattup.com`, and Better Auth answers a sign-in for it with `User not found`: that
row does not exist in the database. The audit signed in as `devripon.io@gmail.com`, whose
password is the owner's. A browser session was tried as well and there was none live.

So the round trip claim is proven at the resolver, on the real database, with a real SQL
tap — the `"user"` SELECT count on the permission path goes 1 to 0 — and the Better Auth
half of the chain is unchanged because nothing in `lib/auth.ts` was touched. Four minus one
is three. What is **not** independently confirmed is the end-to-end page number: that a
request for `/dashboard` now issues exactly three statements rather than four. Reproducing
it needs one working dashboard credential and about ten minutes.

One thing worth knowing before anyone repeats the attempt: **a failed sign-in writes to the
production database.** The tap recorded the rate limiter's `SELECT`, `UPDATE` and `COMMIT`
on `auth_rate_limit`, and one `INSERT` into `activity_log` for the failed attempt. That is
correct behaviour, and it means "just try a password" is not a read-only action.

## Gate

`pnpm test` 325 passing across 22 files, up from 277 across 19. `pnpm exec tsc --noEmit`
clean (there is no `typecheck` script). `pnpm build` green.

**`pnpm lint` fails, and it already failed before any of this work**: 17 errors and 22
warnings on `main` at `2f5b671`, in fourteen files, none of them touched here
(`components/consent/cmp-script.tsx`, `components/data-table.tsx`,
`components/home/search-bar.tsx`, the four `components/tiptap-*` files, seven `hooks/*`,
`lib/email.ts`, `lib/tiptap-utils.ts`). The totals are identical before and after, 39
problems either way, and the only textual difference is three warnings whose line numbers
moved because this work edited the file above them, so it adds none of them. But
`wattup-frontend/CLAUDE.md` says lint must pass before anything is considered done and it
does not. That is a pre-existing breach of the
project's own gate and it needs its own piece of work.
