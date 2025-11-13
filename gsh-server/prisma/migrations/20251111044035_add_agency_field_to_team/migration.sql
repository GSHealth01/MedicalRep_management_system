/*
  Warnings:

  - Added the required column `range_id` to the `distributor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `agency_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "distributor" ADD COLUMN     "range_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "agency_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
