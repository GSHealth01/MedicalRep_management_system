/*
  Warnings:

  - You are about to drop the column `name` on the `distributor` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `team` table. All the data in the column will be lost.
  - You are about to drop the `RepDoctors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RepWorkAreas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_rep` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `agency_id` to the `distributor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `range_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."RepDoctors" DROP CONSTRAINT "RepDoctors_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepDoctors" DROP CONSTRAINT "RepDoctors_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepWorkAreas" DROP CONSTRAINT "RepWorkAreas_area_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."RepWorkAreas" DROP CONSTRAINT "RepWorkAreas_rep_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_rep" DROP CONSTRAINT "medical_rep_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_rep" DROP CONSTRAINT "medical_rep_distributor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_rep" DROP CONSTRAINT "medical_rep_range_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_rep" DROP CONSTRAINT "medical_rep_team_id_fkey";

-- AlterTable
ALTER TABLE "distributor" DROP COLUMN "name",
ADD COLUMN     "agency_id" INTEGER NOT NULL,
ADD COLUMN     "coverage_town" TEXT,
ADD COLUMN     "distributor_name" TEXT,
ADD COLUMN     "route" TEXT;

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "route_of_administration" TEXT,
ADD COLUMN     "therapeutic_category" TEXT;

-- AlterTable
ALTER TABLE "team" DROP COLUMN "name",
ADD COLUMN     "field_coordinators" TEXT,
ADD COLUMN     "junior_executives" TEXT,
ADD COLUMN     "operations_manager" TEXT,
ADD COLUMN     "range_id" INTEGER NOT NULL,
ADD COLUMN     "senior_executives" TEXT,
ADD COLUMN     "senior_manager" TEXT,
ADD COLUMN     "team_name" TEXT,
ADD COLUMN     "territory_managers" TEXT;

-- DropTable
DROP TABLE "public"."RepDoctors";

-- DropTable
DROP TABLE "public"."RepWorkAreas";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."medical_rep";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "emp_no" TEXT NOT NULL,
    "designation" TEXT,
    "join_date" TIMESTAMP(3),
    "birthday" TIMESTAMP(3),
    "agency_id" INTEGER NOT NULL,
    "range_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "distributor_id" INTEGER NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkAreas" (
    "user_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "UserWorkAreas_pkey" PRIMARY KEY ("user_id","area_id")
);

-- CreateTable
CREATE TABLE "UserDoctors" (
    "user_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,

    CONSTRAINT "UserDoctors_pkey" PRIMARY KEY ("user_id","doctor_id")
);

-- CreateTable
CREATE TABLE "TeamProducts" (
    "team_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "TeamProducts_pkey" PRIMARY KEY ("team_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_emp_no_key" ON "user"("emp_no");

-- CreateIndex
CREATE UNIQUE INDEX "user_distributor_id_key" ON "user"("distributor_id");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkAreas" ADD CONSTRAINT "UserWorkAreas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkAreas" ADD CONSTRAINT "UserWorkAreas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDoctors" ADD CONSTRAINT "UserDoctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDoctors" ADD CONSTRAINT "UserDoctors_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProducts" ADD CONSTRAINT "TeamProducts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProducts" ADD CONSTRAINT "TeamProducts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
