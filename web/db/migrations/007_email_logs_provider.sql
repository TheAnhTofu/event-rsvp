-- Provider column for transactional email (SES, Resend). Run after 003_email_logs.
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/007_email_logs_provider.sql

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS provider TEXT;

COMMENT ON COLUMN email_logs.provider IS 'Email provider: ses, resend, or null for legacy rows';

UPDATE email_logs SET provider = 'ses' WHERE provider IS NULL;
