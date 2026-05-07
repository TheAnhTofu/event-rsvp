-- Apply with psql, e.g.:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_init.sql
-- Or: cd web && npm run db:migrate

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS registration_drafts (
  id UUID PRIMARY KEY,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  fee_hkd NUMERIC(10, 2) NOT NULL,
  locale TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_registration_drafts_created
  ON registration_drafts (created_at DESC);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('stripe', 'demo', 'bank_transfer', 'no_payment')),
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  fee_hkd NUMERIC(10, 2) NOT NULL,
  email TEXT NOT NULL,
  locale TEXT,
  payload JSONB NOT NULL,
  webhook_verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations (email);
CREATE INDEX IF NOT EXISTS idx_registrations_created ON registrations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_stripe_pi
  ON registrations (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
