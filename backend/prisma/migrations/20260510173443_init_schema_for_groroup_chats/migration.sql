-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER');

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "avatar" TEXT;

-- AlterTable
ALTER TABLE "RoomParticipant" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER';
