-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_agency_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_distributor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_range_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_team_id_fkey";

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "agency_id" DROP NOT NULL,
ALTER COLUMN "range_id" DROP NOT NULL,
ALTER COLUMN "team_id" DROP NOT NULL,
ALTER COLUMN "distributor_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
