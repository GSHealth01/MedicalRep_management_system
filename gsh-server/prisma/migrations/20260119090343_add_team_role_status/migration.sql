/*
  Warnings:

  - You are about to drop the column `mileage` on the `dcrs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "dcrs" DROP COLUMN "mileage";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "team_role" TEXT DEFAULT 'NORMAL',
ADD COLUMN     "team_status" TEXT DEFAULT 'ACTIVE';
