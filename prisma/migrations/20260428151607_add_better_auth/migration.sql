/*
  Warnings:

  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "account_id_idx";

-- DropIndex
DROP INDEX "session_id_idx";

-- DropIndex
DROP INDEX "user_id_email_idx";

-- DropIndex
DROP INDEX "verification_id_idx";

-- AlterTable
ALTER TABLE "session" ADD COLUMN     "impersonatedBy" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "banExpires" TIMESTAMP(3),
ADD COLUMN     "banReason" TEXT,
ADD COLUMN     "banned" BOOLEAN DEFAULT false,
ADD COLUMN     "role" TEXT DEFAULT 'user',
ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "createdAt" DROP NOT NULL,
ALTER COLUMN "updatedAt" DROP NOT NULL;
