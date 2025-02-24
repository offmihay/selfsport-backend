/*
  Warnings:

  - Made the column `coordinates` on table `tournaments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tournaments" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "coordinates" SET NOT NULL;
