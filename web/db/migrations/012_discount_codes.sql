-- Discount codes: quantity (max_uses / used_count) and expiry. Apply rules in source-backend only.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/012_discount_codes.sql

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  percent_value NUMERIC(10, 4),
  fixed_hkd NUMERIC(10, 2),
  -- max_uses: total redemptions allowed; 0 = unlimited
  max_uses INT NOT NULL CHECK (max_uses >= 0),
  used_count INT NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT discount_codes_percent CHECK (
    (discount_type = 'percent' AND percent_value IS NOT NULL AND fixed_hkd IS NULL)
    OR (discount_type = 'fixed' AND fixed_hkd IS NOT NULL AND percent_value IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_code_upper
  ON discount_codes (upper(trim(code)));

CREATE INDEX IF NOT EXISTS idx_discount_codes_active_expires
  ON discount_codes (is_active, expires_at);

ALTER TABLE registration_drafts
  ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- Example rows (adjust max_uses / expires_at):
-- INSERT INTO discount_codes (code, discount_type, percent_value, max_uses, expires_at)
-- VALUES ('IAIS10', 'percent', 10, 1000, '2027-12-31 23:59:59+08');
-- INSERT INTO discount_codes (code, discount_type, fixed_hkd, max_uses, expires_at)
-- VALUES ('IAIS50', 'fixed', 50, 500, '2027-12-31 23:59:59+08');
