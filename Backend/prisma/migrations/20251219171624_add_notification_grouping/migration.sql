/*
  Warnings:

  - The values [REGISTRATION_APPROVED,REGISTRATION_REJECTED,REGISTRATION_SUCCESS,EVENT_REJECTED,EVENT_CREATED,ATTENDANCE_CONFIRMED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('NEW_REGISTRATION', 'CANCELLED_REGISTRATION', 'EVENT_APPROVED', 'EVENT_REMINDER', 'NEW_POST', 'NEW_COMMENT', 'POST_LIKE');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "postId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();

-- Update existing rows to set updatedAt = createdAt
UPDATE "Notification" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;
