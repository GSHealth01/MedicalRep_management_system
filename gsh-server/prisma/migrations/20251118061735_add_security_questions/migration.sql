/*
  Warnings:

  - The primary key for the `DistributorProducts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `distributor_id` on the `DistributorProducts` table. All the data in the column will be lost.
  - The primary key for the `distributor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `distributor` table. All the data in the column will be lost.
  - You are about to drop the column `distributor_id` on the `user` table. All the data in the column will be lost.
  - Added the required column `distributor_code` to the `DistributorProducts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `distributor_code` to the `distributor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DistributorProducts" DROP CONSTRAINT "DistributorProducts_distributor_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user" DROP CONSTRAINT "user_distributor_id_fkey";

-- DropIndex
DROP INDEX "public"."user_distributor_id_key";

-- AlterTable
ALTER TABLE "DistributorProducts" DROP CONSTRAINT "DistributorProducts_pkey",
DROP COLUMN "distributor_id",
ADD COLUMN     "distributor_code" TEXT NOT NULL,
ADD CONSTRAINT "DistributorProducts_pkey" PRIMARY KEY ("distributor_code", "product_id");

-- AlterTable
ALTER TABLE "agency" ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "area" ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "distributor" DROP CONSTRAINT "distributor_pkey",
DROP COLUMN "id",
ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distributor_code" TEXT NOT NULL,
ADD CONSTRAINT "distributor_pkey" PRIMARY KEY ("distributor_code");

-- AlterTable
ALTER TABLE "product" ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "range" ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "team" ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "medical_representatives" TEXT,
ADD COLUMN     "product_managers" TEXT;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "distributor_id",
ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "security_answer" TEXT,
ADD COLUMN     "security_question" TEXT;

-- CreateTable
CREATE TABLE "UserDistributors" (
    "user_id" INTEGER NOT NULL,
    "distributor_code" TEXT NOT NULL,

    CONSTRAINT "UserDistributors_pkey" PRIMARY KEY ("user_id","distributor_code")
);

-- AddForeignKey
ALTER TABLE "UserDistributors" ADD CONSTRAINT "UserDistributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDistributors" ADD CONSTRAINT "UserDistributors_distributor_code_fkey" FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributorProducts" ADD CONSTRAINT "DistributorProducts_distributor_code_fkey" FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code") ON DELETE RESTRICT ON UPDATE CASCADE;
