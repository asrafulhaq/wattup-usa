-- CreateTable
CREATE TABLE "proforma_rate_limit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "lastHit" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proforma_rate_limit_pkey" PRIMARY KEY ("key")
);
