/*
  Warnings:

  - You are about to drop the column `coordsId` on the `tournaments` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tournaments" DROP CONSTRAINT "tournaments_coordsId_fkey";

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "coordsId",
ADD COLUMN     "coordinates" geometry(Point, 4326);

-- DropTable
DROP TABLE "locations";
GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED;

-- CreateIndex
CREATE INDEX "coordinates_idx" ON "tournaments" USING GIST ("coordinates");
