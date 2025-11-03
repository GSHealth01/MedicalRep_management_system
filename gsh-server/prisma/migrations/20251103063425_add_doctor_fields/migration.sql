-- AlterTable
ALTER TABLE "doctor" ADD COLUMN     "categorization" TEXT,
ADD COLUMN     "contactNumber" TEXT,
ADD COLUMN     "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "range_id" INTEGER;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE SET NULL ON UPDATE CASCADE;
