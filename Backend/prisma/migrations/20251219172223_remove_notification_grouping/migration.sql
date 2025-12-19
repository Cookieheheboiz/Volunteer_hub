/*
  Warnings:

  - You are about to drop the column `metadata` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `postId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "metadata",
DROP COLUMN "postId",
DROP COLUMN "updatedAt";
