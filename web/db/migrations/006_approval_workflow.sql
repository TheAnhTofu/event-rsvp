-- IA approval workflow: batch approval per Friday 12pm.
-- Run after 005_bank_transfer_slips.sql:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/006_approval_workflow.sql

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'submitted_to_ia', 'approved', 'rejected'));

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS approval_batch_id UUID;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS approved_by TEXT;

CREATE TABLE IF NOT EXISTS approval_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  submitted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'partially_approved')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_registrations_approval_status
  ON registrations (approval_status);
CREATE INDEX IF NOT EXISTS idx_registrations_approval_batch
  ON registrations (approval_batch_id);
CREATE INDEX IF NOT EXISTS idx_approval_batches_status
  ON approval_batches (status);
