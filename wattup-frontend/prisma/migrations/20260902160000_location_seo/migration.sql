-- Migration: per-location search and social metadata
--
-- The station pages exist to be found. Until now their title, description and social
-- card were generated from the address with no way to change one without a deploy, and
-- there was no share image at all, so every link posted anywhere rendered blank.
--
-- All five columns are optional. A blank override falls back to the generated value,
-- which is usually the better answer: it is built from the address and stays correct
-- when the address changes.

ALTER TABLE "location"
    ADD COLUMN "metaTitle"       TEXT,
    ADD COLUMN "metaDescription" TEXT,
    ADD COLUMN "imageUrl"        TEXT,
    ADD COLUMN "imagePublicId"   TEXT,
    ADD COLUMN "noIndex"         BOOLEAN NOT NULL DEFAULT false;

-- Crawlable sites are the common read on the sitemap and on the finder.
CREATE INDEX "location_published_noIndex_idx" ON "location"("published", "noIndex");
