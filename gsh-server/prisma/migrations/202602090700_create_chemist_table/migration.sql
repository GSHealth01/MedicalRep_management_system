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
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE "chemist"
ADD CONSTRAINT "chemist_distributor_code_fkey"
FOREIGN KEY ("distributor_code") REFERENCES "distributor"("distributor_code")
ON DELETE SET NULL ON UPDATE CASCADE;
