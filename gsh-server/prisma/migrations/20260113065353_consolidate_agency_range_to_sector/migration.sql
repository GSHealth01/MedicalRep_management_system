/*
  Warnings:

  - You are about to drop the column `agency_id` on the `distributor` table. All the data in the column will be lost.
  - You are about to drop the column `range_id` on the `distributor` table. All the data in the column will be lost.
  - You are about to drop the column `range_id` on the `doctor` table. All the data in the column will be lost.
  - You are about to drop the column `agency_id` on the `team` table. All the data in the column will be lost.
  - You are about to drop the column `range_id` on the `team` table. All the data in the column will be lost.
  - You are about to drop the column `agency_id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `range_id` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `agency` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `range` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sector_id` to the `distributor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sector_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."distributor" DROP CONSTRAINT "distributor_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."distributor" DROP CONSTRAINT "distributor_range_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."doctor" DROP CONSTRAINT "doctor_range_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."range" DROP CONSTRAINT "range_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."team" DROP CONSTRAINT "team_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."team" DROP CONSTRAINT "team_range_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_range_id_fkey";

-- AlterTable
ALTER TABLE "distributor" DROP COLUMN "agency_id",
DROP COLUMN "range_id",
ADD COLUMN     "sector_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "doctor" DROP COLUMN "range_id",
ADD COLUMN     "sector_id" INTEGER;

-- AlterTable
ALTER TABLE "team" DROP COLUMN "agency_id",
DROP COLUMN "range_id",
ADD COLUMN     "sector_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "agency_id",
DROP COLUMN "range_id",
ADD COLUMN     "sector_id" INTEGER;

-- DropTable
DROP TABLE "public"."agency";

-- DropTable
DROP TABLE "public"."range";

-- CreateTable
CREATE TABLE "sector" (
    "id" SERIAL NOT NULL,
    "agency" TEXT NOT NULL,
    "range" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sector_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
