-- AlterTable
ALTER TABLE "itineraries" ALTER COLUMN "status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "itinerary_entries" ALTER COLUMN "mileage" SET DEFAULT 0.0,
ALTER COLUMN "mileage" SET DATA TYPE DOUBLE PRECISION;
