/*
  Warnings:

  - You are about to drop the `_TournamentParticipants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_TournamentParticipants" DROP CONSTRAINT "_TournamentParticipants_A_fkey";

-- DropForeignKey
ALTER TABLE "_TournamentParticipants" DROP CONSTRAINT "_TournamentParticipants_B_fkey";

-- DropTable
DROP TABLE "_TournamentParticipants";

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournament_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_user_id_key" ON "tournament_participants"("tournament_id", "user_id");

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
