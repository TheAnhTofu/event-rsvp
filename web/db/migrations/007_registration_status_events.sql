-- Track registration status history (payment / approval, etc.)
-- Run after 006_approval_workflow.sql

CREATE TABLE IF NOT EXISTS registration_status_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_reference TEXT NOT NULL,
  status_type TEXT NOT NULL, -- e.g. 'payment', 'approval'
  status_value TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_events_reference
  ON registration_status_events (registration_reference, created_at DESC);

