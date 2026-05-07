-- Audience type segmentation + payment status tracking.
-- Run after 003_email_logs.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/004_audience_type_and_status.sql

-- Audience type on drafts
ALTER TABLE registration_drafts
  ADD COLUMN IF NOT EXISTS audience_type TEXT;

-- Audience type on registrations
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS audience_type TEXT;

-- Payment status for bank transfer verification workflow
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'completed'
    CHECK (payment_status IN ('pending_verification', 'verified', 'completed', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_registrations_audience_type
  ON registrations (audience_type);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status
  ON registrations (payment_status);
