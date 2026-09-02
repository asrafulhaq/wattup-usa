-- shared-surface: creates proforma_rate_limit, the counter table wattup-proforma's lib/rate-limit.ts reads and writes through $queryRaw and $executeRaw; until it exists that limiter fails open to memory, and its columns must match the SQL in that file.
-- CreateTable
CREATE TABLE "proforma_rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "lastHit" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proforma_rate_limit_pkey" PRIMARY KEY ("key")
);
