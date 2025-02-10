/*
  Warnings:

  - You are about to drop the column `status` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "status",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- DropEnum
DROP TYPE "TournamentStatus";
