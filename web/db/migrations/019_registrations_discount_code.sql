-- Snapshot mã giảm giá trên đăng ký (bank transfer: increment khi postComplete, restore khi reject slip).
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/019_registrations_discount_code.sql

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS discount_code TEXT;
