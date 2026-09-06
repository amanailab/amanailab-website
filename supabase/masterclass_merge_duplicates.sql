-- Merge interest_form + payment rows for the same person into ONE paid row.
-- Run once in Supabase SQL Editor.

-- For every email that has BOTH a paid row and an interest row:
-- update the interest row with payment details, then delete the paid duplicate.

WITH paid AS (
  SELECT * FROM masterclass_registrations WHERE status = 'paid'
),
interest AS (
  SELECT * FROM masterclass_registrations WHERE status != 'paid'
)
UPDATE masterclass_registrations mr
SET
  via                 = 'payment',
  status              = 'paid',
  amount              = p.amount,
  razorpay_payment_id = p.razorpay_payment_id,
  razorpay_order_id   = p.razorpay_order_id,
  tier                = p.tier
FROM paid p
JOIN interest i ON lower(i.email) = lower(p.email)
WHERE mr.id = i.id;

-- Delete the now-duplicate paid rows (keep the interest rows which are now updated)
DELETE FROM masterclass_registrations mr
WHERE status = 'paid'
  AND email IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM masterclass_registrations other
    WHERE lower(other.email) = lower(mr.email)
      AND other.status = 'paid'
      AND other.id != mr.id
  )
  AND id NOT IN (
    SELECT min(id) FROM masterclass_registrations
    WHERE status = 'paid' AND email IS NOT NULL
    GROUP BY lower(email)
  );
