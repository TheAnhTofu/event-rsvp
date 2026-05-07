CREATE TABLE IF NOT EXISTS check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_reference TEXT NOT NULL REFERENCES registrations(reference),
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out')),
  checked_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_check_in_logs_ref
  ON check_in_logs (registration_reference, created_at DESC);
