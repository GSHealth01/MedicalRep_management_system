-- Add birthday and town fields to doctor table
ALTER TABLE "doctor" ADD COLUMN "birthday" DATE;
ALTER TABLE "doctor" ADD COLUMN "town" TEXT;
