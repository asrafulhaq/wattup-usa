# Cloudinary audit (checklist S.1.7)

**Date:** 2026-09-03. Inventory taken 2026-09-02 19:10 UTC against the cloud named by
`CLOUDINARY_CLOUD_NAME` in `wattup-frontend/.env` (cloud `dsfms7jb4`, the same name the
public delivery URLs carry). Read-only: Admin API reads and database SELECTs only. Nothing was
deleted, renamed, moved or uploaded, and nothing should be deleted on the strength of this
document alone.

**Why.** Finding F1: `app/api/upload-image/route.ts` and the six exports of
`app/_actions/image-actions.ts` accepted uploads, deletes and moves from anyone between the
route's first commit (`9750ad4`, 2026-04-29 12:09 UTC) and the fix on 2026-09-02 (`d202ada`,
`3b3fc60`). This audit looks for anything that reached the account from outside the team in
that window.

## Headline

| Number | Value |
|---|--:|
| Assets in the account (`type: upload`, all resource types) | **1,613** |
| Referenced by the database or the source | 178 |
| Orphaned (referenced by nothing) | **1,435** |
| In a folder outside the app's allowlist | **1,577** |
| Created inside the unauthenticated window | **1,460** |
| Of those, uploaded through the app's own code path | 14, all by the team |
| Raw files, or formats the app never produces | 0 |

**Finding 1: no evidence that anyone outside the team used the unauthenticated upload path.**
Every upload that goes through `lib/image-service.ts` carries the context field
`userId=anonymous` (the service sets it and no caller passes a user id), so it marks the app's
own uploads whoever made them. Twenty nine assets carry the marker. All sit in the five allowed
folders, all were created between 2026-04-28 19:02 UTC and 2026-05-18 16:23 UTC, inside the
team's session range and mostly within minutes of the five posts being created, and none has an
unexpected format. Nothing with the marker was created after 2026-05-18, and nothing with the
marker sits outside the allowlist.

**Finding 2: the account is shared with other products, and one of them is still writing to it.**
1,360 assets (84% of the count, 68% of the bytes) sit in folders that no commit in this
repository has ever mentioned: `islandtours` (923 assets, 1.44 GB, subfolders `users/<14 ids>`,
`instagram`, `reviews`, `homepage`, `email`), `wp-migration` (432 assets, all named after
Curaçao boat and buggy tours), `tripwheel` (one 75 MB video), `team-members` and
`estimator-avatars`. None carries the app marker. The newest eight `islandtours` files landed at
2026-09-02 18:01 UTC, after the F1 fix commit. These were not uploaded through WattUp's
code; they were uploaded with the account's API credentials by other software, which means the
`CLOUDINARY_API_SECRET` in this app's `.env` is also deployed elsewhere. The account is at 93% of
its monthly credit allowance (55.85 of 60), with 77 GB of bandwidth and 1,931 seconds of video
transformation this cycle; WattUp's own material is about 0.75 GB of the 2.36 GB stored.

**Finding 3: eleven image ids in `lib/images/*.ts` do not exist in the account.** Three are used
by live pages: `hero1Md` (the site wide OG image in `app/layout.tsx`), `corePrincipals`
(about page) and `forDriverPageHero` (drivers hero fallback). Not part of F1, recorded because
the audit surfaced it.

## 1. Inventory

Per resource type (`type: upload`). No `private`, `authenticated` or `fetch` assets exist.

| Resource type | Assets | Bytes | Earliest `created_at` | Latest `created_at` |
|---|--:|--:|---|---|
| image | 1,555 | 1,618,479,024 | 2026-03-25 08:25:16Z | 2026-09-02 18:01:26Z |
| video | 58 | 741,925,314 | 2026-03-25 08:43:20Z | 2026-08-24 13:20:52Z |
| raw | 0 | 0 | | |
| **Total** | **1,613** | **2,360,404,338** (2.36 GB) | | |

Per top level folder (`asset_folder`, falling back to the public id prefix). The `assets` folder
is the marketing library uploaded through the Cloudinary console; its public ids have no folder
prefix, which is why the `lib/images` ids such as `hero-2-md_jq8set` resolve to it.

| Folder | Assets | Bytes | Earliest | Latest | Referenced | Orphaned | App marker | In window |
|---|--:|--:|---|---|--:|--:|--:|--:|
| `islandtours` | 923 | 1,444,137,730 | 2026-07-16 | 2026-09-02 | 0 | 923 | 0 | 923 |
| `wp-migration` | 432 | 95,494,579 | 2026-08-24 | 2026-08-25 | 0 | 432 | 0 | 432 |
| `assets` | 217 | 706,753,876 | 2026-03-25 | 2026-05-26 | 170 | 47 | 0 | 90 |
| `articles` | 21 | 19,423,334 | 2026-04-28 | 2026-05-09 | 5 | 16 | 21 | 9 |
| `tiptap` | 5 | 14,133,395 | 2026-04-29 | 2026-04-29 | 1 | 4 | 5 | 3 |
| `profile-photos` | 3 | 280,808 | 2026-04-28 | 2026-05-18 | 2 | 1 | 3 | 2 |
| `team-members` | 3 | 138,453 | 2026-04-18 | 2026-04-18 | 0 | 3 | 0 | 0 |
| `estimator-avatars` | 1 | 14,493 | 2026-04-14 | 2026-04-14 | 0 | 1 | 0 | 0 |
| `tripwheel` | 1 | 74,865,816 | 2026-08-16 | 2026-08-16 | 0 | 1 | 0 | 1 |
| (root) | 7 | 5,161,854 | 2026-03-25 | 2026-03-25 | 0 | 7 | 0 | 0 |
| `locations`, `drafts` | 0 | 0 | | | | | | |

Formats: jpg 977, webp 282, png 258, svg 30, heic 6 (all in `islandtours`), avif 1, ico 1;
every video is mp4.

Account usage (`api.usage`): plan Small PAYG, credits 55.85 of 60 (93%), storage 4.21 GB
including 3,452 derived assets, bandwidth 76.99 GB, 73,780 requests, 8,499 transformations of
which 1,679 SD and 252 HD video seconds.

## 2. Referenced versus orphaned

Reference sources, 189 distinct ids in all:

| Where | Rows with a Cloudinary reference | Distinct assets |
|---|--:|--:|
| `Posts.image` | 5 | 5 |
| `Posts.content` (URLs inside the article HTML) | 4 | 1 |
| `user.image` and `user.imagePublicId` | 1 | 1 |
| `Profile.image` (JSON) | 1 | 1 |
| `location.imageUrl`, `location.imagePublicId`, `site_settings.*`, `SocialLink.url`, every other text or JSON column in `public` | 0 | 0 |
| `lib/images/*.ts` public id maps (frontend) | 181 ids | 170 found, 11 missing |
| Hard coded `res.cloudinary.com` URLs (`wattup-proforma/lib/mail-base.ts`, frontend email templates) | 2 | 2, both also in the maps |

Result: **178 referenced, 1,435 orphaned.** The orphans split as:

| Group | Assets | Bytes | Note |
|---|--:|--:|---|
| Other products' folders (`islandtours`, `wp-migration`, `tripwheel`) | 1,356 | 1,614,498,125 | never referenced by this repository |
| `assets` marketing variants | 47 | 217,717,760 | OG images, favicons, `why-*`, `process-*`, video versions |
| App folder uploads by the team | 21 | 26,714,362 | 16 `articles`, 4 `tiptap`, 1 `profile-photos` |
| Cloudinary's own sample images (root) | 7 | 5,161,854 | `sample`, `cld-sample` to `cld-sample-5`, `main-sample` |
| `team-members`, `estimator-avatars` | 4 | 152,946 | 400x400 avatars from another app, April 2026 |

Ids referenced by the source that are **not** in the account: `hero-1_cufyrq`, `hero-1-md_kw0ekh`,
`hero-2_bk5zds`, `hero-2-md_jq8set`, `homepage-hero-1_dh8gwz`, `slide-1_yq5l8a`,
`slide-2_yq5l8a`, `slide-3_yq5l8a` (all `lib/images/home.ts`, added 2026-03-25),
`core-principals_ghtsrs` (`about.ts`, added 2026-04-27), `hero-image_x2y7j3` and
`for-driver-page-hero-mobile_rev1cw` (`drivers.ts`). Whether they were replaced in the console or
deleted through the unauthenticated delete actions cannot be told from the inventory (see
section 5).

## 3. Suspicious

### 3.1 Folders outside the allowlist (`tiptap`, `articles`, `locations`, `profile-photos`, `drafts`)

1,577 assets. The allowlist governs what the app may upload, so the 217 in `assets` (console
uploads of the marketing library, 170 of them referenced) are expected. The other 1,360 are not
WattUp's.

| Folder | Assets | What it looks like | Evidence it is not WattUp's |
|---|--:|---|---|
| `islandtours/users/<id>/…` | 661 | per user photo and video uploads, 14 user ids, portrait 1080x1920 videos | ids never appear in this repository; no app marker; still receiving files on 2026-09-02 18:01Z |
| `islandtours/instagram`, `reviews`, `homepage`, `email`, root of the folder | 262 | a tour operator's site media | same |
| `wp-migration/<tour-slug>/…` | 432 | WordPress media export, 28 tour slugs (catamaran, jet ski, dolphin, buggy, Klein Curaçao), Unsplash file names | 0 names match WattUp, 418 match island, tour or Curaçao; 420 of them landed on 2026-08-24 |
| `tripwheel` | 1 | `klein-curaca… .mp4`, 74.9 MB | folder name never appears in this repository |
| `team-members` | 3 | `member-<cuid>`, two random ids, 400x400 | 2026-04-18, ten days before the first dashboard account; no commit mentions the folder |
| `estimator-avatars` | 1 | `user-<32 char id>`, 400x400 | 2026-04-14, same |

### 3.2 Created inside the unauthenticated window (2026-04-29 12:09Z to 2026-09-02 23:59Z)

1,460 assets: 1,356 in the other products' folders, 90 console uploads into `assets` (May
2026), and **14 through the app**, listed here in full.

| Asset | Created (UTC) | Bytes | Referenced by | Verdict |
|---|---|--:|---|---|
| `articles/pe59kcqyjkcx… .png` | 2026-04-29 12:43:16 | 1,723,491 | nothing | team test upload |
| `tiptap/pbo6lhrc4xlj… .png` | 2026-04-29 12:43:34 | 2,799,937 | nothing | team test upload |
| `articles/qbazurk1kgrn… .jpg` | 2026-04-29 12:59:22 | 113,467 | nothing | team test upload |
| `articles/xttsmemgmmi7… .png` | 2026-04-29 14:36:16 | 912,239 | nothing | team test upload |
| `tiptap/ppkptfvnvo1p… .png` | 2026-04-29 14:50:29 | 3,943,238 | nothing | team test upload |
| `articles/fjvls0o3lqck… .png` | 2026-04-29 14:51:59 | 1,118,747 | `Posts.image` | team, live |
| `tiptap/ropkdx9prsv0… .png` | 2026-04-29 14:53:44 | 3,943,238 | `Posts.content` | team, live |
| `articles/sshef3qdzhhz… .png` | 2026-04-29 15:33:27 | 912,239 | nothing | team test upload |
| `articles/unvpmafrt2rj… .png` | 2026-04-29 15:34:25 | 722,920 | `Posts.image` | team, live |
| `articles/u0wntiytqllb… .png` | 2026-04-29 15:35:08 | 592,569 | `Posts.image` | team, live |
| `articles/znyx6zs2yxbj… .png` | 2026-05-09 10:50:41 | 281,891 | `Posts.image` | team, live |
| `articles/jbzz2x7xjieu… .png` | 2026-05-09 10:51:18 | 227,000 | `Posts.image` | team, live |
| `profile-photos/uw7ykzbkwcme… .jpg` | 2026-05-18 16:16:26 | 78,273 | `user.image` | team, live |
| `profile-photos/axiyynnimhds… .jpg` | 2026-05-18 16:23:15 | 43,998 | nothing | replaced seven minutes later |

The 2026-04-29 uploads sit between 12:43 and 15:35 UTC,
the five posts were created between 14:56 and 15:32 UTC, and the `SUPER_ADMIN` sessions of that
day cover the range: this is the developer testing the editor on the day the route was written.
The fifteen app uploads **before** the window (2026-04-28 19:02Z to 2026-04-29 11:22Z) have the
same shape.

Team activity used for comparison, from the database: three `user` rows (2026-04-28 15:16Z
`SUPER_ADMIN`, 2026-05-19 20:02Z `EDITOR`, 2026-09-02 14:20Z `SUPER_ADMIN`); 26 sessions from
2026-04-28 20:54Z to 2026-09-02 13:51Z; five posts created 2026-04-29 14:56Z to 15:32Z, last
updated 2026-05-18 10:57Z, one published, four drafts; one `Profile` row 2026-04-28 19:02Z;
27 locations seeded 2026-09-01 21:48Z.

### 3.3 Outside the team's activity

138 assets predate the first dashboard account (2026-04-28 15:16Z): 127 console uploads into
`assets` (the marketing library, March and April), the 7 Cloudinary samples from the day the
account was created (2026-03-25 08:25Z) and the 4 `team-members` and `estimator-avatars`
avatars. Eight `islandtours` files postdate the last team session (2026-09-02 13:51Z). No asset
with the app marker falls outside the session range.

### 3.4 Raw files and unexpected formats

No `raw` assets. Every image is jpg, png, webp, svg, avif, ico or heic and every video is
mp4. The six heic files are in `islandtours`. Nothing in an app folder is a video or a document.

### 3.5 Largest ten by bytes

| Asset | Bytes | Folder | Created | Referenced |
|---|--:|---|---|---|
| `klein-curaca… .mp4` | 74,865,816 | `tripwheel` | 2026-08-16 | no |
| `video-1_x0kh… .mp4` | 51,656,754 | `assets` | 2026-03-25 | no |
| `islandtours/users/…/cppqgusmxuen… .mp4` | 38,459,855 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/b2zhlnpfnzam… .mp4` | 38,459,855 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/pqwrrfjrdknk… .mp4` | 38,437,047 | `islandtours` | 2026-08-22 | no |
| `islandtours/users/…/zmpnzsia8yu7… .mp4` | 38,437,047 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/giyn1fmkezix… .mp4` | 38,437,047 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/jo4f9esk0jp8… .mp4` | 35,157,537 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/s1fqhnsscu6d… .mp4` | 35,157,537 | `islandtours` | 2026-08-04 | no |
| `islandtours/users/…/tqoie4nl2oqx… .mp4` | 31,854,517 | `islandtours` | 2026-08-04 | no |

Identical byte counts across different user ids suggest the same videos uploaded under several
accounts of that other product.

## 4. Recommendations

Nothing here has been deleted. "Delete" means a human deletes after confirming.

| Group | Assets | Recommendation | Reason |
|---|--:|---|---|
| Referenced by the database or the source | 178 | **keep** | live |
| `islandtours` | 923 | **review**, then move | another product's live media, still being written; deleting it here would break that product. Move it to its own cloud, then remove it from this one |
| `wp-migration` | 432 | **review**, then move | same owner as `islandtours` (one `wp-migration` subfolder also sits inside `islandtours`); not WattUp content |
| `tripwheel` | 1 | **review**, then move | same |
| `team-members`, `estimator-avatars` | 4 | **review**, then delete | another app's avatars, never referenced here |
| Cloudinary sample images (root) | 7 | **delete** | Cloudinary's demo assets, 5.2 MB, nothing references them |
| App folder orphans (`articles` 16, `tiptap` 4, `profile-photos` 1) | 21 | **delete** after a glance | the team's own editor tests and a replaced profile photo, 2026-04-28 to 2026-05-18; 26.7 MB |
| `assets` orphans | 47 | **keep** | WattUp marketing variants (OG images, favicons, `why-*`, `process-*`, `wattup_v4_cr…`, `wattup-verti…`, `video-1`); some may be used by email or social channels outside this code. A designer's pass could trim them |

Account level:

1. **Separate the clouds, then rotate.** WattUp's API secret is in use by at least one other
   deployment. Once the other products have their own cloud, rotate this account's API key and
   secret and update `wattup-frontend/.env` and the Vercel env. Until then, every deployment
   that holds the secret can upload to, delete from and rename in WattUp's media.
2. **Cost.** 93% of the monthly credits are consumed and WattUp accounts for roughly a third of
   stored bytes and 5 of 58 videos. Bandwidth and transformation credits cannot be attributed
   per folder through the API; the console's usage report can.
3. **Fix the eleven missing ids** in `lib/images` (finding 3 above), starting with the OG image
   in `app/layout.tsx`.
4. `.env` also carries `NEW_CLOUD_NAME`, `NEW_API_KEY` and `NEW_API_SECRET` for a different
   cloud, plus `CLOUDINARY_URL` (same cloud and key as `CLOUDINARY_*`). No code reads the
   `NEW_*` variables. If that is a dedicated WattUp cloud prepared for the move, it is the
   destination for item 1; it was not audited.

## 5. What could not be determined

- **Deletions, moves and overwrites during the window.** The Admin API lists only what exists
  now. Anything deleted through the unauthenticated `deleteImages` or `deleteSingleImage`
  actions, moved through `moveImage`, or overwritten in place through the `publicId` passthrough
  closed in `3b3fc60`, leaves no trace in the inventory. The eleven missing source ids are the
  only hint, and the more ordinary explanation (replaced in the console) fits: the siblings
  `homepage-hero-3/4/5`, `slide_1_layered` and `slide_4_full` do exist. The Cloudinary console's audit log, if the
  plan includes it, is the only way to settle this.
- **Whether the window is closed in production.** `CLAUDE.md` says nothing is deployed yet and
  `SECURITY-FINDINGS.md` says F1 is live on production. The window end used here is the fix
  date on `main`. If the fix is not deployed, the window is still open.
- **Who owns the account and the other folders.** Inferred from folder names and file names
  only. The account owner login is unknown, as with Resend.
- **Uploads with the raw credentials.** An upload made with the API key directly, rather than
  through the app, carries no marker. The team versus outsider split for the 29 app uploads
  rests on the marker plus dates that match the team's sessions and posts.

## Methodology

1. `pnpm exec tsx` script in the scratch directory; env read from `wattup-frontend/.env`, no value printed.
2. `cloudinary.api.resources({ type: 'upload', max_results: 500, context: true, tags: true })` with cursor pagination for image, video and raw; `private`, `authenticated` and `fetch` probed and empty; `api.usage()` for account totals.
3. Database references: `information_schema.columns` for every text, varchar, json and jsonb column in `public`, then one `SELECT … WHERE col::text ILIKE '%cloudinary%'` per column plus every non empty `*PublicId` value; team activity from `user`, `session`, `Posts`, `Profile` and `location` aggregates. All through `prisma.$queryRawUnsafe` with literal SELECT statements.
4. Source references: every quoted id in `wattup-frontend/lib/images/*.ts`, plus every `res.cloudinary.com` URL under `app`, `components`, `lib`, `public` in both apps; ids extracted by dropping version and transformation segments and the extension.
5. Classification: top level folder from `asset_folder` or the public id prefix; app marker `context.custom.userId === 'anonymous'`; window 2026-04-29 12:09:16Z (commit `9750ad4`) to 2026-09-02 23:59:59Z; full result saved as JSON in the scratch directory, not committed.
