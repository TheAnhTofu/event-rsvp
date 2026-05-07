-- Allow "registered, awaiting payment" rows (acknowledge email → CRM list) before Stripe/bank complete.
-- Previous CHECK omitted 'pending', so only pending_verification / completed / etc. were allowed.

ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_payment_status_check;

ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_status_check
  CHECK (
    payment_status IN (
      'pending',
      'pending_verification',
      'verified',
      'completed',
      'rejected'
    )
  );
