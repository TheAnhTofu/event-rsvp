-- QFPay: Alipay / WeChat Pay (HK WAP / H5) — separate from Stripe.
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
      'qfpay'
    )
  );

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS qfpay_syssn TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_registrations_qfpay_syssn
  ON registrations (qfpay_syssn)
  WHERE qfpay_syssn IS NOT NULL;
