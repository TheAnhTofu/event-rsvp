-- Denormalised member registration fields for admin queries / exports (payload JSONB remains source of truth).
-- Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/025_registration_member_columns.sql

ALTER TABLE registration_drafts
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS member_delegate_role TEXT;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS member_delegate_role TEXT;

CREATE INDEX IF NOT EXISTS idx_registrations_jurisdiction
  ON registrations (jurisdiction)
  WHERE jurisdiction IS NOT NULL;
