-- CreateTable
CREATE TABLE "agency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "range" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "agency_id" INTEGER NOT NULL,

    CONSTRAINT "range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" SERIAL NOT NULL,
    "team_name" TEXT,
    "operations_manager" TEXT,
    "senior_manager" TEXT,
    "territory_managers" TEXT,
    "product_managers" TEXT,
    "senior_executives" TEXT,
    "junior_executives" TEXT,
    "field_coordinators" TEXT,
    "medical_representatives" TEXT,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "range_id" INTEGER NOT NULL,
    "agency_id" INTEGER NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor" (
    "distributor_code" TEXT NOT NULL,
    "distributor_name" TEXT,
    "coverage_town" TEXT,
    "route" TEXT,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "agency_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,
    "range_id" INTEGER NOT NULL,

    CONSTRAINT "distributor_pkey" PRIMARY KEY ("distributor_code")
);

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
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "security_question" TEXT,
    "security_answer" TEXT,
    "agency_id" INTEGER,
    "range_id" INTEGER,
    "team_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT,
    "email" TEXT,
    "specialty" TEXT,
    "categorization" TEXT,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "range_id" INTEGER,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "therapeutic_category" TEXT,
    "generic_name" TEXT,
    "route_of_administration" TEXT,
    "pack_size" TEXT,
    "strength" TEXT,
    "dateAdded" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkAreas" (
    "user_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "UserWorkAreas_pkey" PRIMARY KEY ("user_id","area_id")
);

-- CreateTable
CREATE TABLE "UserDistributors" (
    "user_id" INTEGER NOT NULL,
    "distributor_code" TEXT NOT NULL,

    CONSTRAINT "UserDistributors_pkey" PRIMARY KEY ("user_id","distributor_code")
);

-- CreateTable
CREATE TABLE "UserDoctors" (
    "user_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,

    CONSTRAINT "UserDoctors_pkey" PRIMARY KEY ("user_id","doctor_id")
);

-- CreateTable
CREATE TABLE "DistributorProducts" (
    "distributor_code" TEXT NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "DistributorProducts_pkey" PRIMARY KEY ("distributor_code","product_id")
);

-- CreateTable
CREATE TABLE "DoctorPrescriptions" (
    "doctor_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "DoctorPrescriptions_pkey" PRIMARY KEY ("doctor_id","product_id")
);

-- CreateTable
CREATE TABLE "TeamProducts" (
    "team_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "TeamProducts_pkey" PRIMARY KEY ("team_id","product_id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" SERIAL NOT NULL,
    "repName" TEXT NOT NULL,
    "distributor" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
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
    "mileage" DOUBLE PRECISION DEFAULT 0.0,
    "nightOutArea" TEXT,
    "itinerary_id" INTEGER NOT NULL,

    CONSTRAINT "itinerary_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agency_name_key" ON "agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "area_name_key" ON "area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_area_id_key" ON "distributor"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_emp_no_key" ON "user"("emp_no");

-- AddForeignKey
ALTER TABLE "range" ADD CONSTRAINT "range_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkAreas" ADD CONSTRAINT "UserWorkAreas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkAreas" ADD CONSTRAINT "UserWorkAreas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDistributors" ADD CONSTRAINT "UserDistributors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDistributors" ADD CONSTRAINT "UserDistributors_distributor_code_fkey" FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDoctors" ADD CONSTRAINT "UserDoctors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDoctors" ADD CONSTRAINT "UserDoctors_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributorProducts" ADD CONSTRAINT "DistributorProducts_distributor_code_fkey" FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributorProducts" ADD CONSTRAINT "DistributorProducts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPrescriptions" ADD CONSTRAINT "DoctorPrescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPrescriptions" ADD CONSTRAINT "DoctorPrescriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProducts" ADD CONSTRAINT "TeamProducts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamProducts" ADD CONSTRAINT "TeamProducts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_entries" ADD CONSTRAINT "itinerary_entries_itinerary_id_fkey" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
