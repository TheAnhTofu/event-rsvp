/**
 * Seed: 1 admin + 1 viewer trong `admin_users` (migration 008+011 đã chạy).
 *
 *   npm run db:seed
 *
 * Biến: DATABASE_URL, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD,
 *       SEED_VIEWER_EMAIL, SEED_VIEWER_PASSWORD (trong repo root `.env.local`)
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL?.trim();
const adminEmail = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
const adminPass = process.env.SEED_ADMIN_PASSWORD;
const viewerEmail = process.env.SEED_VIEWER_EMAIL?.trim().toLowerCase();
const viewerPass = process.env.SEED_VIEWER_PASSWORD;

if (!url) {
  console.error("Missing DATABASE_URL in .env.local (repo root).");
  process.exit(1);
}
if (!adminEmail || !adminPass || !viewerEmail || !viewerPass) {
  console.error(
    "Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_VIEWER_EMAIL, SEED_VIEWER_PASSWORD in .env.local",
  );
  process.exit(1);
}

const useSsl =
  /\.rds\.amazonaws\.com/.test(url) && !url.includes("localhost");
const sql = postgres(url, { ssl: useSsl ? "require" : false });

async function upsertUser(email, plainPassword, role) {
  const hash = await bcrypt.hash(plainPassword, 12);
  const existing = await sql`
    SELECT id FROM admin_users WHERE email = ${email} LIMIT 1
  `;
  if (existing.length > 0) {
    await sql`
      UPDATE admin_users
      SET
        password_hash = ${hash},
        role = ${role},
        updated_at = now()
      WHERE email = ${email}
    `;
    return { email, role, action: "updated" };
  }

  await sql`
    INSERT INTO admin_users (
      user_code,
      email,
      password_hash,
      role,
      display_name,
      phone_country,
      phone_number
    )
    VALUES (
      'U-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-' ||
        lpad(nextval('admin_users_user_code_seq')::text, 5, '0'),
      ${email},
      ${hash},
      ${role},
      '',
      '+852',
      ''
    )
  `;
  return { email, role, action: "created" };
}

try {
  const a = await upsertUser(adminEmail, adminPass, "admin");
  console.log("Admin:", a.email, a.role, `(${a.action})`);
  const v = await upsertUser(viewerEmail, viewerPass, "viewer");
  console.log("Viewer:", v.email, v.role, `(${v.action})`);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await sql.end({ timeout: 5 }).catch(() => {});
}
