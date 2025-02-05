/*
  Warnings:

  - Made the column `entry_fee` on table `tournaments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `prize_pool` on table `tournaments` required. This step will fail if there are existing NULL values in that column.
  - Made the column `max_participants` on table `tournaments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tournaments" ALTER COLUMN "entry_fee" SET NOT NULL,
ALTER COLUMN "prize_pool" SET NOT NULL,
ALTER COLUMN "max_participants" SET NOT NULL;
