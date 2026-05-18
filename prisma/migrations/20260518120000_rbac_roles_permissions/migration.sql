-- Migration: RBAC roles and permissions
-- Adds SUPER_ADMIN, ADMIN, EDITOR, COLLABORATOR roles.
-- Renames old enum: admin→SUPER_ADMIN (seeded admin), user→COLLABORATOR.
-- Creates the Permission enum.

-- ── Step 1: Create Permission enum ──────────────────────────────────────────
CREATE TYPE "Permission" AS ENUM (
  'CREATE_POST',
  'EDIT_ANY_POST',
  'EDIT_OWN_POST',
  'DELETE_ANY_POST',
  'DELETE_OWN_POST',
  'PUBLISH_POST',
  'UPLOAD_MEDIA',
  'DELETE_ANY_MEDIA',
  'DELETE_OWN_MEDIA',
  'MANAGE_SITE_SETTINGS',
  'MANAGE_PROFILE',
  'MANAGE_SOCIAL_LINKS',
  'VIEW_USERS',
  'INVITE_USERS',
  'EDIT_USERS',
  'CHANGE_USER_ROLE',
  'DELETE_USERS',
  'BAN_USERS',
  'VIEW_ANALYTICS'
);

-- ── Step 2: Create new Role enum with all four values ─────────────────────────
CREATE TYPE "Role_new" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'COLLABORATOR');

-- ── Step 3: Migrate existing role column data ─────────────────────────────────
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;

ALTER TABLE "user"
  ALTER COLUMN "role" TYPE "Role_new"
  USING (
    CASE "role"::text
      WHEN 'admin'  THEN 'SUPER_ADMIN'::"Role_new"
      WHEN 'user'   THEN 'COLLABORATOR'::"Role_new"
      ELSE               'COLLABORATOR'::"Role_new"
    END
  );

ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'COLLABORATOR'::"Role_new";

-- ── Step 4: Replace old Role enum with new one ───────────────────────────────
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
