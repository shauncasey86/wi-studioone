/*
  Warnings:

  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- DropTable
DROP TABLE "HealthCheck";

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "content" JSONB NOT NULL,
    "openHour" INTEGER NOT NULL DEFAULT 7,
    "closeHour" INTEGER NOT NULL DEFAULT 22,
    "minHours" INTEGER NOT NULL DEFAULT 1,
    "maxHours" INTEGER NOT NULL DEFAULT 8,
    "resetHours" INTEGER NOT NULL DEFAULT 1,
    "daysAhead" INTEGER NOT NULL DEFAULT 28,
    "pendingTtlHrs" INTEGER NOT NULL DEFAULT 48,
    "bacs" JSONB NOT NULL,
    "doorCode" TEXT NOT NULL,
    "doorCodeNote" TEXT,
    "studioEmails" TEXT[],
    "fromEmail" TEXT NOT NULL DEFAULT 'hello@studioone.room',
    "contact" JSONB NOT NULL,
    "map" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kind" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kicker" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "timeTag" TEXT NOT NULL,

    CONSTRAINT "Kind_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HowStep" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "HowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kicker" TEXT NOT NULL,
    "body" TEXT NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomFact" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "strong" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "RoomFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChangeoverItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "ChangeoverItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavItem" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "anchor" TEXT NOT NULL,
    "cur" TEXT,

    CONSTRAINT "NavItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FooterColumn" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "links" JSONB NOT NULL,

    CONSTRAINT "FooterColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeroEyebrow" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "HeroEyebrow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifestoFoot" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "term" TEXT NOT NULL,
    "def" TEXT NOT NULL,

    CONSTRAINT "ManifestoFoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateTier" (
    "id" TEXT NOT NULL,
    "hours" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "RateTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "pricePence" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "codeSentAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringHold" (
    "id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startHour" INTEGER NOT NULL,
    "endHour" INTEGER NOT NULL,
    "label" TEXT,

    CONSTRAINT "RecurringHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RateTier_hours_key" ON "RateTier"("hours");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_date_status_idx" ON "Booking"("date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
