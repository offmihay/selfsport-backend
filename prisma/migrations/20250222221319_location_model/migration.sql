-- CreateTable
CREATE EXTENSION IF NOT EXISTS postgis;


CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "coords" geometry(Point, 4326) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_idx" ON "locations" USING GIST ("coords");
