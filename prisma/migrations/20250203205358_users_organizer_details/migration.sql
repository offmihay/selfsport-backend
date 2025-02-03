/*
  Warnings:

  - You are about to drop the column `organizer_contact` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "organizer_contact",
ADD COLUMN     "organizer_email" TEXT,
ADD COLUMN     "organizer_phone" TEXT;
