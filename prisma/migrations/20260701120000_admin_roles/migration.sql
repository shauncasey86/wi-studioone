-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'SUBADMIN');

-- AlterTable: existing admin rows are the owner; new sub-admins are created as SUBADMIN by the app.
ALTER TABLE "AdminUser" ADD COLUMN "name" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'OWNER';
