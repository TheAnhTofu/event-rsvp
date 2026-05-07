-- Email send audit (Amazon SES / future providers). Run after 001_init.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/003_email_logs.sql

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  registration_reference TEXT NOT NULL,
  template_key TEXT NOT NULL,
  to_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_message_id TEXT,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_logs_reference
  ON email_logs (registration_reference);
CREATE INDEX IF NOT EXISTS idx_email_logs_created
  ON email_logs (created_at DESC);
