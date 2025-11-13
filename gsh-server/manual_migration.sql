-- Manual migration to update distributor table structure
-- This script updates the database to match the Prisma schema

BEGIN;

-- Drop existing foreign key constraints if they exist
ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_distributor_code_fkey";
ALTER TABLE IF EXISTS "User" DROP CONSTRAINT IF EXISTS "User_distributor_id_fkey";

-- Add distributor_code column to User table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'distributor_code') THEN
        ALTER TABLE "User" ADD COLUMN distributor_code TEXT;
    END IF;
END
$$;

-- Drop the old distributor_id column from User table if it exists
ALTER TABLE IF EXISTS "User" DROP COLUMN IF EXISTS distributor_id;

-- Create unique constraint on distributor_code in User table
ALTER TABLE IF EXISTS "User" ADD CONSTRAINT "User_distributor_code_key" UNIQUE (distributor_code);

-- Add foreign key constraint
ALTER TABLE IF EXISTS "User" ADD CONSTRAINT "User_distributor_code_fkey" 
    FOREIGN KEY (distributor_code) REFERENCES "distributor" (distributor_code);

-- Update distributor table structure
-- The distributor table should already exist with id as primary key
-- We need to add distributor_code as a separate field and make it the primary key

-- First, create a temporary column
ALTER TABLE IF EXISTS "distributor" ADD COLUMN temp_distributor_code TEXT;

-- Copy existing id values to distributor_code with DIS prefix
UPDATE "distributor" SET temp_distributor_code = 'DIS' || LPAD(id::TEXT, 3, '0');

-- Add the actual distributor_code column
ALTER TABLE "distributor" ADD COLUMN distributor_code TEXT;

-- Set the distributor_code values
UPDATE "distributor" SET distributor_code = temp_distributor_code;

-- Make distributor_code the primary key
ALTER TABLE "distributor" DROP CONSTRAINT IF EXISTS "distributor_pkey";
ALTER TABLE "distributor" ADD CONSTRAINT "distributor_pkey" PRIMARY KEY (distributor_code);

-- Drop the old id column and temp column
ALTER TABLE "distributor" DROP COLUMN IF EXISTS id;
ALTER TABLE "distributor" DROP COLUMN IF EXISTS temp_distributor_code;

-- Create DistributorProducts table if it doesn't exist
CREATE TABLE IF NOT EXISTS "DistributorProducts" (
    "distributor_code" TEXT NOT NULL REFERENCES "distributor"("distributor_code") ON DELETE CASCADE ON UPDATE CASCADE,
    "product_id" INTEGER NOT NULL REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DistributorProducts_pkey" PRIMARY KEY ("distributor_code","product_id")
);

-- Update the User table to reference distributor_code
-- This needs to be done after the distributor table is updated

COMMIT;