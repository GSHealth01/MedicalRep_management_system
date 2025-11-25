/*
  Warnings:

  - Made the column `name` on table `range` required. This step will fail if there are existing NULL values in that column.
  - Made the column `team_name` on table `team` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "range" ALTER COLUMN "name" SET NOT NULL;

-- AlterTable
ALTER TABLE "team" ALTER COLUMN "team_name" SET NOT NULL;
