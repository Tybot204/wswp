/*
  Warnings:

  - Added the required column `created_by_id` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "games" ADD COLUMN     "created_by_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "discord_id" TEXT NOT NULL,
    "discord_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
