-- CreateTable
CREATE TABLE "RoomPhoto" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "RoomPhoto_pkey" PRIMARY KEY ("id")
);
