/*
  Warnings:

  - You are about to drop the column `pack_size` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `strength` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "pack_size",
DROP COLUMN "strength";

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "strength" TEXT,
    "pack_size" TEXT,
    "sampling_price" DOUBLE PRECISION,
    "stocking_price" DOUBLE PRECISION,
    "detailed_price" DOUBLE PRECISION,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dcrs" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "range" TEXT,
    "agency" TEXT,
    "repName" TEXT,
    "empNo" TEXT,
    "distributor" TEXT,
    "area" TEXT,
    "town" TEXT,
    "callReport" JSONB,
    "dailyExpenses" JSONB,
    "otherBills" JSONB,
    "remarks" TEXT,
    "orderFormImages" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "dcrs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dcrs" ADD CONSTRAINT "dcrs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
