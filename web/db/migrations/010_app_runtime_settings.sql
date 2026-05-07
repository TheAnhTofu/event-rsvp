-- Runtime toggles editable from admin UI (override env defaults until cleared).
-- Keys: stripe_live_mode, email_provider, email_primary_resend, paymentasia_use_sandbox

CREATE TABLE IF NOT EXISTS app_runtime_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_runtime_settings_updated_at_idx
  ON app_runtime_settings (updated_at DESC);
