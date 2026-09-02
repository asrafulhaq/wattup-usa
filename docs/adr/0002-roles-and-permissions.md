# ADR 0002 — Roles and permissions, derived from a full feature scan

- **Status:** Proposed, awaiting sign-off on §6 and §9
- **Date:** 2026-09-02
- **Extends:** ADR 0001 §17 (D13), §18 (D14)
- **Scope:** `wattup-frontend` (the dashboard) and `wattup-proforma` (the builder)

---

## 1. What was scanned

Every route, server action, library module and Prisma model in `wattup-frontend`, plus the
pro-forma tool's own capabilities in `docs/Pro-Forma source/js/app.js`.

**`wattup-frontend` — 31 routes:** 3 auth, 11 dashboard, 15 public marketing, 2 API.
**10 server-action modules, 54 exported actions.**
**16 Prisma models and 4 enums.**

Feature areas the dashboard actually owns:

| Area | Actions | Backed by |
|---|---|---|
| Articles / press releases | create, edit, delete, publish, duplicate, search, paginate | `Posts` |
| Charging network | create, edit, delete, publish toggle, geocode, slug suggest | `Location`, `LocationConnector` |
| Amenity catalogue | create, edit, activate, reorder, delete | `Amenity`, `LocationAmenity` |
| Users | list, create, change role, ban, unban, delete, get by id | `User`, `Session`, `Account` |
| Site settings | analytics IDs, injected scripts, organisation schema | `SiteSettings` |
| Own profile | info, social links, photo | `Profile`, `SocialLink` |
| Media | Cloudinary upload, delete, move, draft cleanup | none (external) |
| Public inquiries | driver and host contact forms | none (email only) |

The pro-forma tool is **entirely client-side**: save scenario, load JSON, export JSON, reset,
open document, print to PDF, EVpin import. No server state, nothing to gate beyond the door.
Its only permission is therefore whether you may open it at all.

---

## 2. Two findings from the scan that change the design

These are not hypothetical. They are the current state of `main`, and the permission work has
to fix them rather than build on top of them.

> The scan later widened into a full security audit. The two below are the ones that shape
> **this** ADR; the complete set of 13 findings, with severities and fix ordering, is in
> [SECURITY-FINDINGS.md](../plan/SECURITY-FINDINGS.md). These two are F3 and F1 there.

### 2.1 — Six of the eighteen permissions are never enforced

`lib/permissions.ts` defines `CREATE_POST`, `EDIT_ANY_POST`, `EDIT_OWN_POST`,
`DELETE_ANY_POST`, `DELETE_OWN_POST` and `PUBLISH_POST`, and assigns them to `EDITOR` and
`COLLABORATOR`. **Not one of them is checked anywhere.** `app/_actions/postActions.ts` calls
`sessionWith` zero times; every article action instead gates on `getAdminSession()`, which
returns null for anything other than `ADMIN` or `SUPER_ADMIN`:

```ts
if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return null;
}
```

The consequences run in both directions:

- **The permission map lies.** An `EDITOR` is granted `CREATE_POST` and `PUBLISH_POST` and
  cannot in fact create or publish anything. A `COLLABORATOR` granted `EDIT_OWN_POST` cannot
  edit anything. The dashboard shows them controls that fail.
- **Ownership cannot be checked at all as the schema stands.** `Posts.author` is a free-text
  `String`; there is no `authorId` and no relation to `User`. `EDIT_OWN_POST` therefore needs a
  migration adding the relation and a backfill, not just a comparison in `updateArticle`.
  Until then the two post permissions are indistinguishable.

`MANAGE_SITE_SETTINGS` is checked on the settings **page** but `updateSiteSettings` gates on
`getAdminSession()`, so the enforcement is role-based there too. A server action is a callable
endpoint; the page check is presentation, not protection.

### 2.2 — The image upload endpoint has no authentication at all

`app/api/upload-image/route.ts` accepts a `POST` with a file and forwards it to Cloudinary. It
performs **no session check, no permission check and no origin check**:

```ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  ...
  const result = await uploadSingleImage(file, { folder });
```

`app/_actions/image-actions.ts` is a `'use server'` module, so each of its six exports —
`uploadSingleImage`, `uploadMultipleImage`, `deleteImages`, `deleteSingleImage`, `moveImage`,
`cleanupOldDrafts` — is independently callable, and none of them checks a session either.

Anyone on the internet can upload arbitrary files into the WattUp Cloudinary account, and
`deleteImages` is reachable the same way. This is storage-cost abuse and arbitrary content
hosted under WattUp's CDN domain at minimum.

**This is a live issue on the current production site, independent of the pro-forma work.** It
is finding F1, tracked as checklist item S.1, and should be fixed first, on its own, rather
than waiting for the rest of the RBAC change.

---

## 3. Design principles

1. **A permission names a capability, not a screen.** `MANAGE_LOCATIONS`, not `LOCATIONS_PAGE`.
2. **Every server action gates itself.** Hiding a control is presentation. `sessionWith()` is
   already the right shape and already documents this; the work is applying it everywhere.
3. **Role is a template, not the authority.** The authority is the resolved permission set:
   role defaults, minus per-user revokes, plus per-user grants.
4. **Roles carry an explicit numeric rank.** `canManageRole()` currently compares by position
   in an array literal; inserting a role at the wrong index silently misjudges privilege.
5. **Read and write are separate permissions** where a role legitimately needs one without the
   other. This is what lets a sales user see the network without editing it.

---

## 4. Roles

Five roles. Three existing ones keep their names and current effective capability, two are
new, and `COLLABORATOR` is removed.

| Role | Rank | Purpose | Status |
|---|:--:|---|:--:|
| `SUPER_ADMIN` | 100 | Owner. The only role that may edit permissions. | existing |
| `ADMIN` | 80 | Full operational administration. | existing |
| `NETWORK_MANAGER` | 60 | The charging network: locations and the amenity catalogue. No content, no users. | **new** |
| `EDITOR` | 50 | Content: articles, publishing, social links. Edits locations, does not delete them. | existing |
| `SALES` | 40 | The pro-forma builder, plus read-only visibility of the network. | **new** |
| ~~`COLLABORATOR`~~ | ~~20~~ | Own drafts only. | **removed** |

**Ranks are spaced by 20** so a role can be inserted between two existing ones without
renumbering anything. `canManageRole(actor, target)` becomes `rank(actor) > rank(target)`,
which is the same comparison it makes today but no longer dependent on array order.

### Why these two

`SALES` exists because of what the pro-forma builder *is*: a tool for pitching landlords and
hosts. The people who need it are not the people who edit the website. Without this role, the
only way to give a salesperson the builder is to make them an `EDITOR`, which also hands them
the press-release publisher.

`NETWORK_MANAGER` exists because the network is the largest feature area in the dashboard —
locations, connectors, amenities, geocoding — and it is currently reachable only by roles that
also carry content and user permissions. It is the one role a growing operations team will
need first.

> `Role` stays a **Prisma enum**, added to by migration rather than created at runtime.
> `lib/auth.ts` configures Better Auth's admin plugin with a static `createAccessControl` map;
> a role created at runtime would have no entry there and admin-plugin calls for it would fail
> silently. The *customisable* part of the requirement is served by `role_permission` and
> `user_permission` being editable, which is where the client's actual need sits.

### 4.1 — Removing `COLLABORATOR`

Client decision: the role is dropped, and it holds no users.

**That second claim is a hard gate, not an assumption.** The existing RBAC migration
(`20260518120000_rbac_roles_permissions/migration.sql`) mapped the old schema with
`ELSE 'COLLABORATOR'`, so every pre-RBAC user who was not the seeded admin landed on it.
Before the migration runs:

```sql
SELECT count(*) FROM "user" WHERE role = 'COLLABORATOR';   -- must return 0
```

If it returns anything other than zero, **stop and reassign those users first**. The migration
will fail on the enum cast regardless, but failing at 2am is worse than checking at noon.

**PostgreSQL cannot drop an enum value.** There is `ALTER TYPE ... ADD VALUE` but no
`DROP VALUE`, so the type has to be recreated. This repository already contains the exact
pattern, in the migration named above: drop the column default, create `Role_new`, cast the
column across with `USING`, drop the old type, rename, restore the default. Follow that file
rather than inventing a new shape.

Code touched by the removal — nine sites across four files:

| File | What |
|---|---|
| `prisma/schema.prisma` | enum value; and `role Role @default(COLLABORATOR)` on `User` |
| `lib/permissions.ts` | `Role` const, `ROLE_PERMISSIONS`, `canManageRole` hierarchy array, `ROLE_LABELS`, `ROLE_BADGE_CLASSES`, `ASSIGNABLE_ROLES`, `ALL_ROLES` |
| `lib/auth.ts` | `collaboratorAc`, `additionalFields.role.defaultValue`, `admin({ defaultRole })`, the `roles` map |
| `components/dashboard/users/invite-user-dialog.tsx` | the `z.enum` list, and the form's default value |

### 4.2 — There is no longer a default role

Client decision: **role is an explicit choice at user creation.**

`COLLABORATOR` was the safe landing spot in four places. With it gone, every remaining role is
a real working role, so there is nothing harmless left to default to. Therefore:

- `prisma/schema.prisma` — **remove `@default(COLLABORATOR)`** from `User.role`. A direct
  insert without a role now fails loudly instead of silently granting something.
- `createUser` — role becomes a required, validated argument. No fallback.
- `invite-user-dialog.tsx` — no preselected role. The admin chooses before the form submits.
- `lib/auth.ts` — Better Auth still requires `defaultRole` and `additionalFields.role.defaultValue`
  to be *some* valid value. Set both to `SALES` and treat them as **unreachable**: public
  sign-up is already blocked by the `before` hook that throws `FORBIDDEN` on `/sign-up/email`,
  and `role.input: false` means no public API can set it.

> **Residual risk, stated rather than hidden.** If that unreachable fallback ever does fire, the
> user lands on `SALES`, which carries `ACCESS_PROFORMA` — they would silently get the
> financial proposal tool. The mitigations above make it unreachable, and the alternative
> fallback, `EDITOR`, is worse: it can publish to the public marketing site. Add a warning log
> where the default is applied, so if it ever fires it is visible rather than silent.

---

## 5. Permissions

21 permissions. 18 exist; **6 currently unenforced** must be wired up; **5 are new**.

| Permission | Group | State |
|---|---|:--:|
| `CREATE_POST` | Content | existing, **unenforced** |
| `EDIT_OWN_POST` | Content | existing, **unenforced** |
| `EDIT_ANY_POST` | Content | existing, **unenforced** |
| `DELETE_OWN_POST` | Content | existing, **unenforced** |
| `DELETE_ANY_POST` | Content | existing, **unenforced** |
| `PUBLISH_POST` | Content | existing, **unenforced** |
| `VIEW_LOCATIONS` | Network | **new** — read-only network access |
| `MANAGE_LOCATIONS` | Network | existing, enforced |
| `DELETE_LOCATIONS` | Network | existing, enforced |
| `MANAGE_AMENITIES` | Network | existing, enforced |
| `VIEW_USERS` | Users | existing, enforced |
| `INVITE_USERS` | Users | existing, enforced |
| `EDIT_USERS` | Users | existing, enforced |
| `CHANGE_USER_ROLE` | Users | existing, enforced |
| `DELETE_USERS` | Users | existing, enforced |
| `BAN_USERS` | Users | existing, enforced |
| `MANAGE_PERMISSIONS` | Users | **new** — edit role defaults and per-user overrides |
| `MANAGE_SITE_SETTINGS` | Site | existing, page-only |
| `MANAGE_SOCIAL_LINKS` | Site | existing, enforced |
| `UPLOAD_MEDIA` | Media | **new** — closes §2.2 |
| `DELETE_MEDIA` | Media | **new** — closes §2.2 |
| `VIEW_ACTIVITY_LOG` | Audit | **new** — the log page and the per-user history |
| `ACCESS_PROFORMA` | Pro-forma | **new** — may sign in to the builder |

---

## 6. The matrix — needs sign-off

Default permissions per role. These seed `role_permission`; per-user overrides then adjust
individuals without touching the defaults.

| | SUPER<br>ADMIN | ADMIN | NETWORK<br>MANAGER | EDITOR | SALES |
|---|:--:|:--:|:--:|:--:|:--:|
| **Content** | | | | | |
| `CREATE_POST` | ✓ | ✓ | | ✓ | |
| `EDIT_OWN_POST` | ✓ | ✓ | | ✓ | |
| `EDIT_ANY_POST` | ✓ | ✓ | | ✓ | |
| `DELETE_OWN_POST` | ✓ | ✓ | | ✓ | |
| `DELETE_ANY_POST` | ✓ | ✓ | | | |
| `PUBLISH_POST` | ✓ | ✓ | | ✓ | |
| **Network** | | | | | |
| `VIEW_LOCATIONS` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `MANAGE_LOCATIONS` | ✓ | ✓ | ✓ | ✓ | |
| `DELETE_LOCATIONS` | ✓ | ✓ | ✓ | | |
| `MANAGE_AMENITIES` | ✓ | ✓ | ✓ | | |
| **Users** | | | | | |
| `VIEW_USERS` | ✓ | ✓ | | ✓ | |
| `INVITE_USERS` | ✓ | ✓ | | | |
| `EDIT_USERS` | ✓ | ✓ | | | |
| `CHANGE_USER_ROLE` | ✓ | ✓ | | | |
| `DELETE_USERS` | ✓ | ✓ | | | |
| `BAN_USERS` | ✓ | ✓ | | | |
| `MANAGE_PERMISSIONS` | ✓ | | | | |
| **Site** | | | | | |
| `MANAGE_SITE_SETTINGS` | ✓ | ✓ | | | |
| `MANAGE_SOCIAL_LINKS` | ✓ | ✓ | | ✓ | |
| **Media** | | | | | |
| `UPLOAD_MEDIA` | ✓ | ✓ | ✓ | ✓ | |
| `DELETE_MEDIA` | ✓ | ✓ | ✓ | ✓ | |
| **Audit** | | | | | |
| `VIEW_ACTIVITY_LOG` | ✓ | ✓ | | | |
| **Pro-forma** | | | | | |
| `ACCESS_PROFORMA` | ✓ | ✓ | ✓ | | ✓ |

**Deliberate choices worth confirming:**

- `MANAGE_PERMISSIONS` is `SUPER_ADMIN` only. An `ADMIN` who could grant permissions could
  grant themselves anything, which makes the distinction between the two roles decorative.
- `EDITOR` does **not** get `ACCESS_PROFORMA`. The builder produces financial proposals sent to
  landlords; content editors have no reason to open it. Individuals can still be granted it.
- `SALES` gets `VIEW_LOCATIONS` but no write permission anywhere. It is the only genuinely
  read-only role in the system.
- `DELETE_ANY_POST` is `ADMIN` and above, matching today's behaviour where all post actions
  are admin-gated.
- With `COLLABORATOR` removed, `EDITOR` is the lowest content role, so it now holds the
  `*_OWN_POST` permissions as well as the `*_ANY_POST` ones. The ownership check in §7 still
  matters: it is what makes the distinction meaningful if a drafts-only role is ever
  reintroduced, and it costs nothing to write correctly the first time.

---

## 7. Enforcement rules

**Every server action gates itself.** Applying `sessionWith(Permission.X)` to the modules that
currently lack it is the bulk of the work:

| Module | Today | Required |
|---|---|---|
| `postActions.ts` | `getAdminSession()`, 10 actions | per-action permission + **ownership check** for `*_OWN_POST` |
| `settingsActions.ts` | `getAdminSession()` | `MANAGE_SITE_SETTINGS` |
| `image-actions.ts` | **nothing** | `UPLOAD_MEDIA` / `DELETE_MEDIA` |
| `api/upload-image/route.ts` | **nothing** | session + `UPLOAD_MEDIA` |
| `locationActions.ts` | ✓ correct | add `VIEW_LOCATIONS` to read paths |
| `amenityActions.ts` | ✓ correct | unchanged |
| `admin-user-actions.ts` | ✓ correct | add `MANAGE_PERMISSIONS` actions |
| `userActions.ts` | partial | `getProfile` / own-profile actions stay self-scoped |

**Ownership.** `EDIT_OWN_POST` and `DELETE_OWN_POST` require comparing the post's author to
the caller — and **the schema cannot express that yet**: `Posts.author` is free text with no
`authorId` relation. Two options, and the client should pick:

- **Add the relation.** Migration adds `authorId String?` with a `User` relation, backfilled
  where the free-text name matches a user and left null otherwise. Then the rule is: hold
  `*_ANY_POST` and the check is skipped; hold only `*_OWN_POST` and the action refuses when the
  ids differ, or when `authorId` is null.
- **Drop the distinction.** Retire `EDIT_OWN_POST` and `DELETE_OWN_POST` from the enum. With
  `COLLABORATOR` removed there is no role that holds `*_OWN` without `*_ANY`, so they currently
  buy nothing. This is the smaller change and is reversible.

Recommended: **drop them now, add the relation if a drafts-only role is ever reintroduced.**
Carrying two permissions the code cannot distinguish is how a permission map starts lying.

**Resolution shape.** `hasPermission` keeps its synchronous signature; only its first argument
changes from a role string to a resolved set, so the 27 existing call sites change mechanically:

```ts
const perms = await getEffectivePermissions(session.user.id);  // once per request
hasPermission(perms, Permission.MANAGE_LOCATIONS);             // unchanged shape
```

**Caching.** Better Auth's session `cookieCache` is already 5 minutes. Cached permissions are
fine for deciding what to *render*; they are not an authorisation decision. Every server action
and the pro-forma gate resolve fresh. `permission-guard.ts` is the single place this is
enforced.

**Self-protection.** A user may never edit their own permissions. `SUPER_ADMIN` may not have
permissions revoked by override. Every permission change writes an `activity_log` row naming
actor, target, permission and direction.

---

## 8. How pro-forma reads this

`wattup-proforma` never resolves permissions itself — duplicating that logic would put a
security decision in two places that can drift. It reads the `proforma_member` SQL view defined
in ADR 0001 §18, which resolves `ACCESS_PROFORMA` in the database:

```sql
SELECT id, email, name, active FROM proforma_member WHERE lower(email) = $1
```

Granting or revoking `ACCESS_PROFORMA` on a user changes what that view returns on the very
next request, so revocation is immediate.

---

## 9. Open — needs an answer

| | Question |
|:--:|---|
| 1 | **The matrix in §6.** Confirm or amend. Any cell can change; the shape is what matters. |
| 2 | **Role names.** `NETWORK_MANAGER` and `SALES` — confirm, or give the names the team actually uses. |
| 3 | **Should `EDITOR` get `ACCESS_PROFORMA` by default?** Proposed no; per-user grants cover exceptions. |
| 4 | **Is `COLLABORATOR` still in use?** No one currently holds capabilities it can exercise, since post actions are admin-gated. If the role is unused, this is the moment to retire it rather than wire it up. |
| 5 | **Who fixes §2.2 and when?** It is live now. Recommendation: its own PR, before anything else. |


---

## 10. Sign-off, 2026-09-03

The client answered the open questions in §9 and the checklist's asks C, D, F and I:

- **C, the matrix (§6):** seeded as recommended. One departure kept from the migration: `EDITOR` keeps `DELETE_ANY_POST`, which it held before, so no surviving role loses anything. The client adjusts role defaults from the dashboard, so `role_permission` is editable there (a Roles page, checklist 4c.13 to 4c.16), gated by `MANAGE_PERMISSIONS`.
- **D, the names:** `NETWORK_MANAGER` and `SALES` confirmed.
- **F, the activity log:** `VIEW_ACTIVITY_LOG` defaults to `ADMIN` and `SUPER_ADMIN`; an admin may give it to any role from the Roles page. Retention 90 days, configurable.
- **I, own-post:** `EDIT_OWN_POST` and `DELETE_OWN_POST` are dropped as §7 recommends. `Posts.author` stays free text. The enum values are retired rather than removed from the database type, like the four reserved values, because `role_permission.permission` now uses the type.

With these, nothing in this ADR awaits sign-off.
