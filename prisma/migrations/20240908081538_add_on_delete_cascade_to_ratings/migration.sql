-- DropForeignKey
ALTER TABLE "ratings" DROP CONSTRAINT "ratings_game_id_fkey";

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
