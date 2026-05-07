-- Admin CRM users: hashed passwords + role; JWT references id (sub claim).
-- Run after prior migrations:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/008_admin_users.sql

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email_lower ON admin_users (lower(email));
