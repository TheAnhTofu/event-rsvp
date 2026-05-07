-- Mã giảm 10% (nhập tay tại checkout). Không gắn auto-apply — EARLYBIRD giữ apply_without_code.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/018_discount10_code.sql

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
  'DISCOUNT10',
  'percent',
  10,
  NULL,
  500,
  0,
  TIMESTAMPTZ '2026-12-31 23:59:59+08',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM discount_codes WHERE upper(trim(code)) = 'DISCOUNT10'
);
