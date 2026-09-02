-- shared-surface: none
--
-- Migration: auth_rate_limit
-- Finding F9; checklist B.10 and S.4.6.
--
-- Counters for Better Auth's request rate limiter, written by the library itself
-- once lib/auth.ts sets rateLimit.storage: 'database' (model RateLimit at the end
-- of prisma/schema.prisma). The line above is for the CI guard from checklist
-- 4b.11: nothing in the pro-forma app reads or writes this table; the pro-forma
-- gate has its own proforma_rate_limit table.
--
-- Generated with `prisma migrate diff --from-config-datasource --to-schema
-- prisma/schema.prisma --script` against the live database and cut down to this
-- table's two statements. The same diff also listed the rbac_permissions
-- migration's pending changes (the Permission values, the Role recreate,
-- role_permission, user_permission, activity_log) and the pre-existing
-- SocialLink_id_idx drop: none of that belongs here and it is deliberately left
-- out. Stacks after 20260903100000_rbac_permissions. Written, NOT applied.
--
-- "key" is Better Auth's lookup and is unique, so the unique index doubles as the
-- lookup index. "lastRequest" is milliseconds since the epoch, hence BIGINT. "id"
-- exists because the Prisma adapter reads it back on every guarded increment;
-- Prisma supplies it (cuid) because lib/auth.ts sets generateId: false.

-- CreateTable
CREATE TABLE "auth_rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "auth_rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_rate_limit_key_key" ON "auth_rate_limit"("key");
