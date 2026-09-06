-- Fix duplicate masterclass_registrations rows
-- Run this in Supabase SQL Editor ONCE to clean up duplicates.
--
-- For each email that has both an interest_form row AND a payment row:
--   1. Update the interest_form row with the payment details
--   2. Delete the duplicate payment row
-- ============================================================

-- Step 1: For each email with a paid entry, update the oldest row to have paid status
WITH paid_rows AS (
  SELECT DISTINCT ON (email) *
  FROM masterclass_registrations
  WHERE status = 'paid'
  ORDER BY email, created_at DESC
),
oldest_rows AS (
  SELECT DISTINCT ON (email) id, email
  FROM masterclass_registrations
  ORDER BY email, created_at ASC
)
UPDATE masterclass_registrations mr
SET
  via                 = 'payment',
  status              = 'paid',
  amount              = pr.amount,
  razorpay_payment_id = pr.razorpay_payment_id,
  razorpay_order_id   = pr.razorpay_order_id
FROM paid_rows pr
JOIN oldest_rows orw ON orw.email = pr.email
WHERE mr.id = orw.id
  AND mr.id <> pr.id;  -- only update if it's a different row

-- Step 2: Delete all non-oldest rows that are now duplicates for the same email
DELETE FROM masterclass_registrations
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM masterclass_registrations
  ORDER BY email, created_at ASC
)
AND email IS NOT NULL;

-- Step 3: Add unique constraint on email if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'masterclass_registrations'::regclass
      AND contype = 'u'
      AND conname = 'masterclass_registrations_email_key'
  ) THEN
    ALTER TABLE masterclass_registrations ADD CONSTRAINT masterclass_registrations_email_key UNIQUE (email);
  END IF;
END $$;
