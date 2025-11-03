-- CreateTable
CREATE TABLE "agency" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" SERIAL NOT NULL,
    "name" TEXT,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "range" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "agency_id" INTEGER NOT NULL,

    CONSTRAINT "range_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "area" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "distributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_rep" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "emp_no" TEXT NOT NULL,
    "designation" TEXT,
    "agency_id" INTEGER NOT NULL,
    "range_id" INTEGER NOT NULL,
    "team_id" INTEGER NOT NULL,
    "distributor_id" INTEGER NOT NULL,

    CONSTRAINT "medical_rep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT,

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT,
    "pack_size" TEXT,
    "strength" TEXT,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RepWorkAreas" (
    "rep_id" INTEGER NOT NULL,
    "area_id" INTEGER NOT NULL,

    CONSTRAINT "RepWorkAreas_pkey" PRIMARY KEY ("rep_id","area_id")
);

-- CreateTable
CREATE TABLE "RepDoctors" (
    "rep_id" INTEGER NOT NULL,
    "doctor_id" INTEGER NOT NULL,

    CONSTRAINT "RepDoctors_pkey" PRIMARY KEY ("rep_id","doctor_id")
);

-- CreateTable
CREATE TABLE "DistributorProducts" (
    "distributor_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "DistributorProducts_pkey" PRIMARY KEY ("distributor_id","product_id")
);

-- CreateTable
CREATE TABLE "DoctorPrescriptions" (
    "doctor_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "DoctorPrescriptions_pkey" PRIMARY KEY ("doctor_id","product_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agency_name_key" ON "agency"("name");

-- CreateIndex
CREATE UNIQUE INDEX "area_name_key" ON "area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "distributor_area_id_key" ON "distributor"("area_id");

-- CreateIndex
CREATE UNIQUE INDEX "medical_rep_emp_no_key" ON "medical_rep"("emp_no");

-- CreateIndex
CREATE UNIQUE INDEX "medical_rep_distributor_id_key" ON "medical_rep"("distributor_id");

-- AddForeignKey
ALTER TABLE "range" ADD CONSTRAINT "range_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_rep" ADD CONSTRAINT "medical_rep_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_rep" ADD CONSTRAINT "medical_rep_range_id_fkey" FOREIGN KEY ("range_id") REFERENCES "range"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_rep" ADD CONSTRAINT "medical_rep_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_rep" ADD CONSTRAINT "medical_rep_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepWorkAreas" ADD CONSTRAINT "RepWorkAreas_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "medical_rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepWorkAreas" ADD CONSTRAINT "RepWorkAreas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepDoctors" ADD CONSTRAINT "RepDoctors_rep_id_fkey" FOREIGN KEY ("rep_id") REFERENCES "medical_rep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepDoctors" ADD CONSTRAINT "RepDoctors_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributorProducts" ADD CONSTRAINT "DistributorProducts_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistributorProducts" ADD CONSTRAINT "DistributorProducts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPrescriptions" ADD CONSTRAINT "DoctorPrescriptions_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPrescriptions" ADD CONSTRAINT "DoctorPrescriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
