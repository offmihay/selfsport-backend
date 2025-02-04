/*
  Warnings:

  - The `skill_level` column on the `tournaments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `format` column on the `tournaments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `sport_type` on the `tournaments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `tournaments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TournamentSport" AS ENUM ('BADMINTON', 'TENNIS', 'SQUASH', 'TABLE_TENNIS');

-- CreateEnum
CREATE TYPE "TournamentSkillLevel" AS ENUM ('AMATEUR', 'INTERMEDIATE', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'ONGOING', 'FINISHED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SINGLES', 'DOUBLES', 'SQUAD');

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "sport_type",
ADD COLUMN     "sport_type" "TournamentSport" NOT NULL,
DROP COLUMN "skill_level",
ADD COLUMN     "skill_level" "TournamentSkillLevel",
DROP COLUMN "format",
ADD COLUMN     "format" "TournamentFormat",
DROP COLUMN "status",
ADD COLUMN     "status" "TournamentStatus" NOT NULL;
