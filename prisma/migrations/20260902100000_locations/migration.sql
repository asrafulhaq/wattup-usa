-- Migration: charging network locations
-- Moves the signed-locations sheet out of a generated TypeScript file and into the
-- database, so the dashboard can manage it.
--
-- The lower half of "location" is private: company, notice_address (several are
-- residential), apn, site_score, sales_rep and the deal notes. lib/locations/public.ts
-- is the only route from a row to the browser.

-- ── Step 1: Enums ────────────────────────────────────────────────────────────
CREATE TYPE "StationStatus" AS ENUM ('LIVE', 'UNDER_CONSTRUCTION', 'PLANNED');

CREATE TYPE "ConnectorType" AS ENUM ('CCS1', 'NACS', 'CCS2', 'CHAdeMO');

-- Three new permissions. The Permission enum backs no column, it exists so the
-- application's RBAC constants have a schema level counterpart, but it is still added
-- here to keep the schema and the database in step.
-- Safe inside the migration transaction on PostgreSQL 12+: the values are declared,
-- never read, in this file.
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MANAGE_LOCATIONS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'DELETE_LOCATIONS';
ALTER TYPE "Permission" ADD VALUE IF NOT EXISTS 'MANAGE_AMENITIES';

-- ── Step 2: location ─────────────────────────────────────────────────────────
CREATE TABLE "location" (
    "id"                      TEXT NOT NULL,
    "slug"                    TEXT NOT NULL,

    -- public
    "name"                    TEXT NOT NULL,
    "street"                  TEXT NOT NULL,
    "city"                    TEXT NOT NULL,
    "region"                  TEXT NOT NULL,
    "postalCode"              TEXT NOT NULL,
    "country"                 TEXT NOT NULL DEFAULT 'US',
    "latitude"                DOUBLE PRECISION NOT NULL,
    "longitude"               DOUBLE PRECISION NOT NULL,
    "market"                  TEXT NOT NULL DEFAULT 'us-ca',
    "status"                  "StationStatus" NOT NULL DEFAULT 'PLANNED',
    "goLiveYear"              INTEGER NOT NULL,
    "county"                  TEXT NOT NULL DEFAULT '',
    "countyFips"              TEXT NOT NULL DEFAULT '',
    "maxPowerKw"              INTEGER NOT NULL DEFAULT 310,
    "chargerCount"            INTEGER NOT NULL DEFAULT 0,
    "pricePerKwh"             DECIMAL(8,4),
    "published"               BOOLEAN NOT NULL DEFAULT true,

    -- private
    "signedNumber"            INTEGER,
    "initialNotes"            TEXT NOT NULL DEFAULT '',
    "pipelineRef"             TEXT NOT NULL DEFAULT '',
    "company"                 TEXT NOT NULL DEFAULT '',
    "addressRaw"              TEXT NOT NULL DEFAULT '',
    "noticeAddress"           TEXT NOT NULL DEFAULT '',
    "apn"                     TEXT NOT NULL DEFAULT '',
    "siteScore"               DOUBLE PRECISION,
    "switchgearCount"         INTEGER,
    "switchgearOrderedDate"   TEXT,
    "salesRep"                TEXT NOT NULL DEFAULT '',

    "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"               TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "location_slug_key" ON "location"("slug");
CREATE INDEX "location_published_status_idx" ON "location"("published", "status");
CREATE INDEX "location_city_idx" ON "location"("city");
CREATE INDEX "location_goLiveYear_idx" ON "location"("goLiveYear");

-- ── Step 3: amenity catalogue ────────────────────────────────────────────────
CREATE TABLE "amenity" (
    "id"        TEXT NOT NULL,
    "slug"      TEXT NOT NULL,
    "label"     TEXT NOT NULL,
    "icon"      TEXT NOT NULL DEFAULT 'dot',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "amenity_slug_key" ON "amenity"("slug");
CREATE INDEX "amenity_active_sortOrder_idx" ON "amenity"("active", "sortOrder");

-- ── Step 4: join tables ──────────────────────────────────────────────────────
CREATE TABLE "location_amenity" (
    "locationId" TEXT NOT NULL,
    "amenityId"  TEXT NOT NULL,

    CONSTRAINT "location_amenity_pkey" PRIMARY KEY ("locationId", "amenityId")
);

CREATE INDEX "location_amenity_amenityId_idx" ON "location_amenity"("amenityId");

CREATE TABLE "location_connector" (
    "id"         TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "type"       "ConnectorType" NOT NULL,
    "count"      INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "location_connector_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "location_connector_locationId_type_key"
    ON "location_connector"("locationId", "type");

-- ── Step 5: foreign keys ─────────────────────────────────────────────────────
-- Cascade on both: a deleted site takes its assignments with it, and a deleted
-- amenity is removed from every site rather than leaving orphaned rows.
ALTER TABLE "location_amenity"
    ADD CONSTRAINT "location_amenity_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "location_amenity"
    ADD CONSTRAINT "location_amenity_amenityId_fkey"
    FOREIGN KEY ("amenityId") REFERENCES "amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "location_connector"
    ADD CONSTRAINT "location_connector_locationId_fkey"
    FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
