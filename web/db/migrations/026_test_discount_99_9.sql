-- Test-only discount: pay 0.1% (i.e. 99.9% off). Use for end-to-end checkout testing.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/026_test_discount_99_9.sql
--
-- Usage at checkout: enter the code `TESTPAY01` in the discount field.
-- Final amount example (HKD): members 8500 -> 8.50, industry 6000 -> 6.00.
-- NOTE: Disable (`is_active = false`) before going live so customers can't redeem it.

INSERT INTO discount_codes (
  code,
  discount_type,
  percent_value,
  fixed_hkd,
  max_uses,
  used_count,
  expires_at,
  is_active
)
SELECT
  'TESTPAY01',
  'percent',
  99.9,
  NULL,
  0,
  0,
  TIMESTAMPTZ '2026-12-31 23:59:59+08',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM discount_codes WHERE upper(trim(code)) = 'TESTPAY01'
);
