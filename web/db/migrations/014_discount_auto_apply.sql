-- Automatic discount when user enters no promo code (early-bird / pre-fill).
-- Configure in `discount_codes`: exactly one active row may have apply_without_code = true.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/014_discount_auto_apply.sql

ALTER TABLE discount_codes
  ADD COLUMN IF NOT EXISTS apply_without_code BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN discount_codes.apply_without_code IS
  'If true, apply this rule when checkout has no promo code (auto / pre-fill). Typing the same code still resolves via normal code lookup.';

-- At most one active automatic rule (is_active = true).
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_codes_single_active_auto
  ON discount_codes ((1))
  WHERE apply_without_code = true AND is_active = true;

UPDATE discount_codes
SET apply_without_code = true,
    updated_at = now()
WHERE upper(trim(code)) = 'EARLYBIRD';
