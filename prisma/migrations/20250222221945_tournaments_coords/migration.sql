/*
  Warnings:

  - Added the required column `coordsId` to the `tournaments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "coordsId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_coordsId_fkey" FOREIGN KEY ("coordsId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
