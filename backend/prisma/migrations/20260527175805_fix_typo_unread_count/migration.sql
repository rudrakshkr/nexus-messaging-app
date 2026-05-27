/*
  Warnings:

  - You are about to drop the column `undreadCount` on the `RoomParticipant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoomParticipant" DROP COLUMN "undreadCount",
ADD COLUMN     "unreadCount" INTEGER NOT NULL DEFAULT 0;
