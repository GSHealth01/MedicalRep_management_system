-- CreateTable
CREATE TABLE "itineraries" (
    "id" SERIAL NOT NULL,
    "repName" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_entries" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "dayNo" INTEGER NOT NULL,
    "area" TEXT,
    "doctorCalls" INTEGER DEFAULT 0,
    "chemistCalls" INTEGER DEFAULT 0,
    "mileage" INTEGER DEFAULT 0,
    "nightOutArea" TEXT,
    "itinerary_id" INTEGER NOT NULL,

    CONSTRAINT "itinerary_entries_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_entries" ADD CONSTRAINT "itinerary_entries_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
