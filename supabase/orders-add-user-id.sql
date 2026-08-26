-- Add user_id to orders table for proper per-user tracking
-- Run in Supabase → SQL Editor → New Query → Run

-- 1. Add nullable user_id column (nullable so old note/package orders without login still work)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Index for fast "all orders by user" lookup
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);

-- 3. Index for payment ID lookup (admin support)
CREATE INDEX IF NOT EXISTS orders_payment_id_idx ON public.orders (razorpay_payment_id);
