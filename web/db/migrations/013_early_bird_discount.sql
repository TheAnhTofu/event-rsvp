-- Early bird: một mã dùng tối đa 10 lần, hết hạn cuối tháng 4/2026 (giờ HK).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/013_early_bird_discount.sql
--   hoặc: cd web && npm run db:migrate

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
  'EARLYBIRD',
  'percent',
  10,
  NULL,
  10,
  0,
  TIMESTAMPTZ '2026-04-30 23:59:59+08',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM discount_codes WHERE upper(trim(code)) = 'EARLYBIRD'
);
