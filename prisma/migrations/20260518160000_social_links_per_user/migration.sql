-- Delete orphaned site-wide social links that have no owner
DELETE FROM "SocialLink";

-- Add userId column (required going forward)
ALTER TABLE "SocialLink" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';

-- Remove the temporary DEFAULT so future inserts must supply userId
ALTER TABLE "SocialLink" ALTER COLUMN "userId" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "SocialLink_userId_idx" ON "SocialLink"("userId");
