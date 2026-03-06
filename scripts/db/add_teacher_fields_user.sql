-- Adds teacher profile columns to the "User" table without dropping anything.
-- Safe to run multiple times (uses IF NOT EXISTS).

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "subjects" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "qualification" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "experience" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "joiningDate" DATE;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "teacherStatus" TEXT DEFAULT 'Active';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "address" TEXT;

