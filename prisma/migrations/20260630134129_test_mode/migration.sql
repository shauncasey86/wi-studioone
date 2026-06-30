-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "testMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "testSnapshot" JSONB,
ADD COLUMN     "testStartedAt" TIMESTAMP(3);
