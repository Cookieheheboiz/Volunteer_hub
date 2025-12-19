/*
  Warnings:

  - The values [REGISTERED] on the enum `RegistrationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RegistrationStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ATTENDED', 'CANCELLED');
ALTER TABLE "public"."EventRegistration" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "EventRegistration" ALTER COLUMN "status" TYPE "RegistrationStatus_new" USING ("status"::text::"RegistrationStatus_new");
ALTER TYPE "RegistrationStatus" RENAME TO "RegistrationStatus_old";
ALTER TYPE "RegistrationStatus_new" RENAME TO "RegistrationStatus";
DROP TYPE "public"."RegistrationStatus_old";
ALTER TABLE "EventRegistration" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "EventRegistration" ALTER COLUMN "status" SET DEFAULT 'PENDING';
