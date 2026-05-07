-- One-time migration if you previously applied 001 with PayPal column names.
-- Safe to skip on fresh installs that used the updated 001_init.sql.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registration_drafts'
      AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE registration_drafts
      RENAME COLUMN paypal_order_id TO stripe_checkout_session_id;
  END IF;
END $$;

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_payment_method_check;
UPDATE registrations SET payment_method = 'stripe' WHERE payment_method = 'paypal';
ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_method_check
  CHECK (payment_method IN ('stripe', 'demo', 'bank_transfer', 'no_payment'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'paypal_order_id'
  ) THEN
    ALTER TABLE registrations
      RENAME COLUMN paypal_order_id TO stripe_checkout_session_id;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'registrations'
      AND column_name = 'paypal_capture_id'
  ) THEN
    ALTER TABLE registrations
      RENAME COLUMN paypal_capture_id TO stripe_payment_intent_id;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_registrations_paypal_capture;
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_pi
  ON registrations (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'paypal_webhook_events'
  ) THEN
    ALTER TABLE paypal_webhook_events RENAME TO stripe_webhook_events;
  END IF;
END $$;
