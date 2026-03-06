-- Run this in Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Fix: "The column Payment.hyperpgOrderId does not exist"

ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "hyperpgOrderId" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "hyperpgTxnId" TEXT;
ALTER TABLE "Payment" ALTER COLUMN "gateway" SET DEFAULT 'HYPERPG';
