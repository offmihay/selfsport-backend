/*
  Warnings:

  - You are about to drop the column `isApproved` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "isApproved",
ADD COLUMN     "is_approved" BOOLEAN NOT NULL DEFAULT false;
