/**
 * Create an admin_users row with bcrypt-hashed password.
 *
 *   npm run db:create-admin -- <email> <password> [admin|viewer]
 *
 * Requires: DATABASE_URL in repo root `.env.local`, migrations 008 + 011.
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "Missing DATABASE_URL. Use: npm run db:create-admin -- <email> <password> [admin|viewer]",
  );
  process.exit(1);
}

const emailArg = process.argv[2];
const passwordArg = process.argv[3];
const roleArg = (process.argv[4] ?? "admin").toLowerCase();

if (!emailArg || !passwordArg) {
  console.error(
    "Usage: npm run db:create-admin -- <email> <plain-password> [admin|viewer]",
  );
  process.exit(1);
}

if (roleArg !== "admin" && roleArg !== "viewer") {
  console.error("Role must be admin or viewer");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const hash = await bcrypt.hash(passwordArg, 12);
const useSsl =
  /\.rds\.amazonaws\.com/.test(url) && !url.includes("localhost");
const sql = postgres(url, { ssl: useSsl ? "require" : false });

try {
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
      ${roleArg},
      '',
      '+852',
      ''
    )
  `;
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/unique|duplicate/i.test(msg)) {
    console.error(`Email already exists: ${email}`);
  } else {
    console.error(msg);
  }
  await sql.end({ timeout: 5 }).catch(() => {});
  process.exit(1);
}

await sql.end({ timeout: 5 });
console.log(`Created ${roleArg} user: ${email}`);
