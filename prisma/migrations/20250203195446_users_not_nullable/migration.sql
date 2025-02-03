/*
  Warnings:

  - Made the column `created_by` on table `tournaments` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_created_by_fkey";

-- AlterTable
ALTER TABLE "tournaments" ALTER COLUMN "created_by" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
