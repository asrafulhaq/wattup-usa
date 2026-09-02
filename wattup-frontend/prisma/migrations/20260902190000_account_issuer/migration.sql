-- shared-surface: adds "issuer" to proforma_account with a unique index on (issuer, accountId); wattup-proforma's Account mirror declares the same column and its Better Auth adapter writes it on every OTP sign-in (finding F15).
-- AlterTable
ALTER TABLE "account" ADD COLUMN     "issuer" TEXT;

-- AlterTable
ALTER TABLE "proforma_account" ADD COLUMN     "issuer" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");

-- CreateIndex
CREATE UNIQUE INDEX "proforma_account_issuer_accountId_key" ON "proforma_account"("issuer", "accountId");

