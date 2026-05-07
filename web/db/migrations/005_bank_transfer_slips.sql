-- Bank transfer slip upload & verification tracking.
-- Run after 004_audience_type_and_status.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/005_bank_transfer_slips.sql

CREATE TABLE IF NOT EXISTS bank_transfer_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_reference TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_note TEXT
);

CREATE INDEX IF NOT EXISTS idx_bank_slips_reference
  ON bank_transfer_slips (registration_reference);
CREATE INDEX IF NOT EXISTS idx_bank_slips_uploaded
  ON bank_transfer_slips (uploaded_at DESC);
