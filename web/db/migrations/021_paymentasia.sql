-- PaymentAsia / PA-SYS hosted page (Alipay, WeChat, …) — separate from QFPay OpenAPI.
ALTER TABLE registrations DROP CONSTRAINT IF EXISTS registrations_payment_method_check;
ALTER TABLE registrations
  ADD CONSTRAINT registrations_payment_method_check
  CHECK (
    payment_method IN (
      'stripe',
      'demo',
      'bank_transfer',
      'no_payment',
      'pending',
      'qfpay',
      'paymentasia'
    )
  );

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS paymentasia_request_reference TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_paymentasia_request_reference
  ON registrations (paymentasia_request_reference)
  WHERE paymentasia_request_reference IS NOT NULL;
