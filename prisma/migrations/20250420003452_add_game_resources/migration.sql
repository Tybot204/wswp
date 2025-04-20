/*
  Warnings:

  - You are about to drop the column `banner_image_url` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `games` table. All the data in the column will be lost.
  - You are about to drop the column `thumbnail_image_url` on the `games` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "game_platform" AS ENUM ('STEAM');

-- AlterTable
ALTER TABLE "games" ADD COLUMN "game_resource_id" UUID;

-- CreateTable
CREATE TABLE "game_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "external_id" TEXT NOT NULL,
    "free" BOOLEAN NOT NULL DEFAULT false,
    "platform" "game_platform" NOT NULL,
    "released" BOOLEAN NOT NULL DEFAULT true,
    "banner_image_url" TEXT,
    "description" TEXT,
    "thumbnail_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "game_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_resources_external_id_platform_key" ON "game_resources"("external_id", "platform");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_game_resource_id_fkey" FOREIGN KEY ("game_resource_id") REFERENCES "game_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- MigrateData
INSERT INTO "game_resources" ("external_id", "platform", "banner_image_url", "description", "free", "released", "thumbnail_image_url")
SELECT DISTINCT split_part("game_url", '/', 5) AS "external_id",
    'STEAM'::game_platform as "platform",
    "banner_image_url",
    "description",
    "free",
    "released",
    "thumbnail_image_url"
FROM "games"
WHERE "game_url" IS NOT NULL;

UPDATE "games"
SET "game_resource_id" = "game_resources"."id"
FROM "game_resources"
WHERE "games"."game_url" IS NOT NULL
AND "game_resources"."external_id" = split_part("games"."game_url", '/', 5);

-- AlterTable
ALTER TABLE "games" DROP COLUMN "banner_image_url",
DROP COLUMN "description",
DROP COLUMN "thumbnail_image_url";
