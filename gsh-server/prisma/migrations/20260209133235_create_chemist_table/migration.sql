-- Create Chemist table
CREATE TABLE "chemist" (
  "id" SERIAL PRIMARY KEY,
  "chemist_code" VARCHAR(50) NOT NULL UNIQUE,
  "name" VARCHAR(255) NOT NULL,
  "distributor_code" VARCHAR(50),
  "address_owner_name" VARCHAR(255),
  "address_owner_birthday" DATE,
  "purchasing_officer_name" VARCHAR(255),
  "purchasing_officer_birthday" DATE,
  "contact_number" VARCHAR(50),
  "date_added" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code")
);

-- Create index for faster lookups
CREATE INDEX idx_chemist_code ON "chemist"("chemist_code");
CREATE INDEX idx_chemist_distributor ON "chemist"("distributor_code");
