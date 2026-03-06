-- Add photos column to NewsFeed for multiple images support
-- Run this in your database: psql $DATABASE_URL -f scripts/add-newsfeed-photos.sql
-- Or execute in Supabase SQL Editor / your DB client

ALTER TABLE "NewsFeed" ADD COLUMN IF NOT EXISTS "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
