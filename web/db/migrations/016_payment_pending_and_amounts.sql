-- Pending payment method (before user chooses Stripe vs bank), invoiced vs paid amounts.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/016_payment_pending_and_amounts.sql

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_payment_method_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_method_check
  CHECK (payment_method IN ('stripe', 'demo', 'bank_transfer', 'no_payment', 'pending'));

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS invoiced_amount_hkd NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS amount_paid_hkd NUMERIC(12, 2);

-- Backfill: form invoice amount from current fee; paid amount when already settled
UPDATE registrations
SET invoiced_amount_hkd = fee_hkd::numeric
WHERE invoiced_amount_hkd IS NULL;

UPDATE registrations
SET amount_paid_hkd = fee_hkd::numeric
WHERE amount_paid_hkd IS NULL
  AND payment_status IN ('completed', 'verified');

-- Rows that showed Stripe before payment: method stripe + pending + no checkout session yet
UPDATE registrations
SET payment_method = 'pending'
WHERE payment_method = 'stripe'
  AND payment_status = 'pending'
  AND stripe_checkout_session_id IS NULL;
