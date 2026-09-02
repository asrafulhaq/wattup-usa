-- Migration: RBAC permissions
-- ADR 0002; checklist 4a.1 to 4a.5, 4a.24 to 4a.26, 4a.41; 4b.1, 4b.2.
--
-- shared-surface: user, activity_log, proforma_member: Role enum recreated and its default dropped; activity_log created (both apps write it); proforma_member view created (the pro-forma app's member lookup)
--
-- The line above is read by the CI guard from checklist 4b.11: a migration touching
-- user, activity_log, proforma_* or the proforma_member view must say what changes
-- for the other app, because the two apps build independently and only the database
-- joins them.
--
-- Written by hand. Prisma cannot generate the Role recreate (Postgres has no
-- DROP VALUE for an enum), the seed rows, or the view.
--
-- How this file runs. prisma.config.ts declares no migrate adapter, so
-- `prisma migrate deploy` hands the whole file to the Rust schema engine, which
-- sends it to Postgres as ONE simple-query message. Postgres runs a multi-statement
-- message as a single implicit transaction unless the script says otherwise, and
-- that matters twice here:
--
--   1. A value added to an enum cannot be used until the transaction that added it
--      has committed ("unsafe use of new value"). So the ADD VALUE statements come
--      first, followed by an explicit COMMIT, and everything that uses the new
--      values runs afterwards inside its own BEGIN / COMMIT. Prisma's own generated
--      migrations carry explicit BEGIN / COMMIT pairs, so the runner tolerates them.
--   2. The DO block in part 1 has semicolons inside its body. The schema engine does
--      not split the script, so that is fine. @prisma/adapter-pg's executeScript
--      DOES split on ";" before running each piece, so do not add `migrate.adapter`
--      to prisma.config.ts without first rewriting that gate as a CHECK constraint.
--
-- Parts 1 to 3 run in the implicit transaction; parts 4 to 7 in the explicit one.
-- A failure in either rolls back only that transaction. Part 1 fails before anything
-- has changed, which is the point of it.

-- ── Part 1: the hard gate (checklist 4a.24) ──────────────────────────────────
-- ADR 0002 section 4.1: the previous RBAC migration mapped every pre-RBAC user who
-- was not the seeded admin onto COLLABORATOR with `ELSE 'COLLABORATOR'`. The cast in
-- part 2 would fail on such a row anyway; this says why, and says it first.
-- Compared as text so the check also runs on a database whose Role never had the
-- value. Reassign the users in the dashboard, then run the migration again.
DO $$
BEGIN
    IF (SELECT count(*) FROM "user" WHERE "role"::text = 'COLLABORATOR') > 0 THEN
        RAISE EXCEPTION 'COLLABORATOR still assigned, reassign first';
    END IF;
END
$$;

-- ── Part 2: Role without COLLABORATOR, plus NETWORK_MANAGER and SALES ───────
-- Checklist 4a.3, 4a.25, 4a.26. Same shape as 20260518120000_rbac_roles_permissions:
-- drop the default, create the new type, cast the column across, drop the old type,
-- rename. The default is dropped and NOT restored: role is an explicit choice at
-- creation (ADR 0002 section 4.2), so an insert that forgets it fails loudly.
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'NETWORK_MANAGER', 'EDITOR', 'SALES');

ALTER TABLE "user"
    ALTER COLUMN "role" TYPE "Role_new"
    USING ("role"::text::"Role_new");

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

-- ── Part 3: Permission values (checklist 4a.2, 4a.41) ───────────────────────
-- IF NOT EXISTS because the live database already carries UPLOAD_MEDIA and the four
-- reserved values (DELETE_ANY_MEDIA, DELETE_OWN_MEDIA, MANAGE_PROFILE,
-- VIEW_ANALYTICS) from the 20260518 migration, while a database rebuilt from the
-- migration history carries them too. Listing every value here keeps the statement
-- honest on both. The reserved four are checked by nothing and exist only so the
-- schema and the database agree.
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'VIEW_LOCATIONS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MANAGE_PERMISSIONS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'UPLOAD_MEDIA';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'DELETE_MEDIA';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'VIEW_ACTIVITY_LOG';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'ACCESS_PROFORMA';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'DELETE_ANY_MEDIA';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'DELETE_OWN_MEDIA';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MANAGE_PROFILE';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'VIEW_ANALYTICS';

-- The new enum values become usable only once this commits. See the header.
COMMIT;

BEGIN;

-- ── Part 4: tables (checklist 4a.1, 4b.1) ───────────────────────────────────
-- Names match what `prisma migrate diff` generates for the schema, so the database
-- and prisma/schema.prisma agree after this runs.

-- What a role holds by default. ADR 0001 section 17.
CREATE TABLE "role_permission" (
    "id"         TEXT         NOT NULL,
    "role"       "Role"       NOT NULL,
    "permission" "Permission" NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_permission_role_permission_key"
    ON "role_permission"("role", "permission");

-- A per-user override: granted = true adds, granted = false removes.
CREATE TABLE "user_permission" (
    "id"          TEXT         NOT NULL,
    "userId"      TEXT         NOT NULL,
    "permission"  "Permission" NOT NULL,
    "granted"     BOOLEAN      NOT NULL,
    "grantedById" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "user_permission_userId_idx" ON "user_permission"("userId");

CREATE UNIQUE INDEX "user_permission_userId_permission_key"
    ON "user_permission"("userId", "permission");

ALTER TABLE "user_permission"
    ADD CONSTRAINT "user_permission_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_permission"
    ADD CONSTRAINT "user_permission_grantedById_fkey"
    FOREIGN KEY ("grantedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The audit log, written by both apps (ADR 0001 section 9). `email` and `userId`
-- name the subject of the event; `actorEmail` and `actorUserId` name who did it.
-- Email is stored in full on purpose (checklist 4b.7); application logs mask it.
-- Both user references are SET NULL so deleting an account keeps its history.
CREATE TABLE "activity_log" (
    "id"            TEXT         NOT NULL,
    "app"           TEXT         NOT NULL,
    "event"         TEXT         NOT NULL,
    "email"         TEXT         NOT NULL,
    "userId"        TEXT,
    "actorUserId"   TEXT,
    "actorEmail"    TEXT,
    "ipAddress"     TEXT,
    "userAgent"     TEXT,
    "correlationId" TEXT,
    "meta"          JSONB,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "activity_log_app_createdAt_idx"         ON "activity_log"("app", "createdAt");
CREATE INDEX "activity_log_email_createdAt_idx"       ON "activity_log"("email", "createdAt");
CREATE INDEX "activity_log_userId_createdAt_idx"      ON "activity_log"("userId", "createdAt");
CREATE INDEX "activity_log_actorUserId_createdAt_idx" ON "activity_log"("actorUserId", "createdAt");

ALTER TABLE "activity_log"
    ADD CONSTRAINT "activity_log_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "activity_log"
    ADD CONSTRAINT "activity_log_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Part 5: role defaults, from ADR 0002 section 6 (checklist 4a.4, 4a.5) ───
-- lib/permissions.ts ROLE_PERMISSIONS is the same matrix in code, and a test parses
-- this block to prove the two agree and that no surviving role lost a permission it
-- held before this migration. One deliberate departure from the ADR's table: EDITOR
-- keeps DELETE_ANY_POST, which it held in ROLE_PERMISSIONS on main, because 4a.5
-- requires the surviving roles to keep everything they had. Removing it is one row
-- to delete once the matrix is signed off.
--
-- Ids are uuids rather than Prisma's cuids: cuid() is generated by the client, not
-- the database, and nothing compares the two formats.
INSERT INTO "role_permission" ("id", "role", "permission")
VALUES
    -- SUPER_ADMIN: every value of the enum, the reserved four included.
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'CREATE_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'EDIT_ANY_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'EDIT_OWN_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_ANY_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_OWN_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'PUBLISH_POST'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'VIEW_LOCATIONS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_LOCATIONS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_LOCATIONS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_AMENITIES'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'VIEW_USERS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'INVITE_USERS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'EDIT_USERS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'CHANGE_USER_ROLE'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_USERS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'BAN_USERS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_PERMISSIONS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_SITE_SETTINGS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_SOCIAL_LINKS'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'UPLOAD_MEDIA'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_MEDIA'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'VIEW_ACTIVITY_LOG'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'ACCESS_PROFORMA'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_ANY_MEDIA'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'DELETE_OWN_MEDIA'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'MANAGE_PROFILE'),
    (gen_random_uuid()::text, 'SUPER_ADMIN', 'VIEW_ANALYTICS'),

    -- ADMIN: everything operational. Not MANAGE_PERMISSIONS: an admin who could
    -- grant permissions could grant themselves anything.
    (gen_random_uuid()::text, 'ADMIN', 'CREATE_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'EDIT_ANY_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'EDIT_OWN_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'DELETE_ANY_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'DELETE_OWN_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'PUBLISH_POST'),
    (gen_random_uuid()::text, 'ADMIN', 'VIEW_LOCATIONS'),
    (gen_random_uuid()::text, 'ADMIN', 'MANAGE_LOCATIONS'),
    (gen_random_uuid()::text, 'ADMIN', 'DELETE_LOCATIONS'),
    (gen_random_uuid()::text, 'ADMIN', 'MANAGE_AMENITIES'),
    (gen_random_uuid()::text, 'ADMIN', 'VIEW_USERS'),
    (gen_random_uuid()::text, 'ADMIN', 'INVITE_USERS'),
    (gen_random_uuid()::text, 'ADMIN', 'EDIT_USERS'),
    (gen_random_uuid()::text, 'ADMIN', 'CHANGE_USER_ROLE'),
    (gen_random_uuid()::text, 'ADMIN', 'DELETE_USERS'),
    (gen_random_uuid()::text, 'ADMIN', 'BAN_USERS'),
    (gen_random_uuid()::text, 'ADMIN', 'MANAGE_SITE_SETTINGS'),
    (gen_random_uuid()::text, 'ADMIN', 'MANAGE_SOCIAL_LINKS'),
    (gen_random_uuid()::text, 'ADMIN', 'UPLOAD_MEDIA'),
    (gen_random_uuid()::text, 'ADMIN', 'DELETE_MEDIA'),
    (gen_random_uuid()::text, 'ADMIN', 'VIEW_ACTIVITY_LOG'),
    (gen_random_uuid()::text, 'ADMIN', 'ACCESS_PROFORMA'),

    -- NETWORK_MANAGER: the charging network and the media that goes with it.
    -- No content, no users.
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'VIEW_LOCATIONS'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'MANAGE_LOCATIONS'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'DELETE_LOCATIONS'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'MANAGE_AMENITIES'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'UPLOAD_MEDIA'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'DELETE_MEDIA'),
    (gen_random_uuid()::text, 'NETWORK_MANAGER', 'ACCESS_PROFORMA'),

    -- EDITOR: content and publishing, edits locations without deleting them.
    -- No ACCESS_PROFORMA by default; a grant covers the exception.
    (gen_random_uuid()::text, 'EDITOR', 'CREATE_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'EDIT_ANY_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'EDIT_OWN_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'DELETE_ANY_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'DELETE_OWN_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'PUBLISH_POST'),
    (gen_random_uuid()::text, 'EDITOR', 'VIEW_LOCATIONS'),
    (gen_random_uuid()::text, 'EDITOR', 'MANAGE_LOCATIONS'),
    (gen_random_uuid()::text, 'EDITOR', 'VIEW_USERS'),
    (gen_random_uuid()::text, 'EDITOR', 'MANAGE_SOCIAL_LINKS'),
    (gen_random_uuid()::text, 'EDITOR', 'UPLOAD_MEDIA'),
    (gen_random_uuid()::text, 'EDITOR', 'DELETE_MEDIA'),

    -- SALES: the builder, plus a read-only view of the network. The one role with
    -- no write permission anywhere.
    (gen_random_uuid()::text, 'SALES', 'VIEW_LOCATIONS'),
    (gen_random_uuid()::text, 'SALES', 'ACCESS_PROFORMA')
ON CONFLICT ("role", "permission") DO NOTHING;

-- ── Part 6: drift (checklist 4a.41) ─────────────────────────────────────────
-- An index on the primary key that the schema stopped declaring. IF EXISTS because
-- a database rebuilt from the migration history never had it.
DROP INDEX IF EXISTS "SocialLink_id_idx";

-- ── Part 7: the pro-forma member view (checklist 4b.2, ADR 0001 section 18) ─
-- The single definition of who may sign in to the builder, so wattup-proforma never
-- re-implements permission resolution. Columns are exactly what its ProformaMember
-- model declares: id, email, name, active. `email` is lowercased because that app
-- matches a normalised address exactly (checklist 2.13). The password is not
-- selected. Two changes from the ADR's draft: lower(email), and the revoke branch
-- never applies to SUPER_ADMIN (checklist 4a.21).
CREATE VIEW "proforma_member" AS
SELECT
    u."id",
    lower(u."email")          AS "email",
    u."name",
    (u."banned" IS NOT TRUE)  AS "active"
FROM "user" u
WHERE (u."banned" IS NOT TRUE)
  AND (
        EXISTS (
            SELECT 1 FROM "user_permission" up
            WHERE up."userId" = u."id"
              AND up."permission" = 'ACCESS_PROFORMA'
              AND up."granted"
        )
     OR (
            EXISTS (
                SELECT 1 FROM "role_permission" rp
                WHERE rp."role" = u."role"
                  AND rp."permission" = 'ACCESS_PROFORMA'
            )
            AND NOT (
                u."role" <> 'SUPER_ADMIN'
                AND EXISTS (
                    SELECT 1 FROM "user_permission" up
                    WHERE up."userId" = u."id"
                      AND up."permission" = 'ACCESS_PROFORMA'
                      AND NOT up."granted"
                )
            )
        )
  );

COMMIT;
