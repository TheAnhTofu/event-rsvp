-- Profile fields + display user_code (e.g. U-2026-00001) for admin CRM users.

CREATE SEQUENCE IF NOT EXISTS admin_users_user_code_seq;

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS user_code TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone_country TEXT NOT NULL DEFAULT '+852',
  ADD COLUMN IF NOT EXISTS phone_number TEXT NOT NULL DEFAULT '';

-- Backfill user_code for existing rows
WITH numbered AS (
  SELECT
    id,
    row_number() OVER (ORDER BY created_at) AS rn,
    to_char(created_at AT TIME ZONE 'UTC', 'YYYY') AS y
  FROM admin_users
)
UPDATE admin_users u
SET user_code = 'U-' || n.y || '-' || lpad(n.rn::text, 5, '0')
FROM numbered n
WHERE u.id = n.id
  AND (u.user_code IS NULL OR trim(u.user_code) = '');

ALTER TABLE admin_users ALTER COLUMN user_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS admin_users_user_code_uidx ON admin_users (user_code);

SELECT setval(
  'admin_users_user_code_seq',
  COALESCE(
    (
      SELECT MAX((regexp_match(user_code, 'U-[0-9]{4}-([0-9]+)$'))[1]::int)
      FROM admin_users
    ),
    1
  )
);
