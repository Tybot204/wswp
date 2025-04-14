-- AlterTable
ALTER TABLE "games" RENAME COLUMN "num_players" TO "max_players";
ALTER TABLE "games" ADD COLUMN     "min_players" INTEGER NOT NULL DEFAULT 1;
