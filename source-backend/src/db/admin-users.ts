import bcrypt from "bcryptjs";
import { getSql } from "@db/postgres";
import type { AdminRole } from "../lib/admin-auth/session.js";

export type AdminUserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: AdminRole;
};

export type AdminUserPublic = {
  id: string;
  userCode: string;
  email: string;
  displayName: string;
  phoneCountry: string;
  phoneNumber: string;
  role: AdminRole;
  createdAt: string;
  updatedAt: string;
};

const BCRYPT_ROUNDS = 12;

export function normalizeAdminEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashAdminPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyAdminPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, passwordHash);
}

type AdminUserDbRow = {
  id: string;
  user_code: string;
  email: string;
  display_name: string;
  phone_country: string;
  phone_number: string;
  role: string;
  created_at: Date;
  updated_at: Date;
};

function mapPublicRow(row: AdminUserDbRow): AdminUserPublic {
  const role = row.role === "admin" || row.role === "viewer" ? row.role : "viewer";
  return {
    id: row.id,
    userCode: row.user_code,
    email: row.email,
    displayName: row.display_name ?? "",
    phoneCountry: row.phone_country ?? "+852",
    phoneNumber: row.phone_number ?? "",
    role,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAdminUserByEmail(
  email: string,
): Promise<AdminUserRow | null> {
  const sql = getSql();
  const normalized = normalizeAdminEmail(email);
  const rows = await sql`
    SELECT id, email, password_hash, role
    FROM admin_users
    WHERE lower(email) = ${normalized}
    LIMIT 1
  `;
  const row = rows[0] as
    | {
        id: string;
        email: string;
        password_hash: string;
        role: string;
      }
    | undefined;
  if (!row) return null;
  if (row.role !== "admin" && row.role !== "viewer") return null;
  return {
    id: row.id,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
  };
}

export async function listAdminUsers(input: {
  limit: number;
  offset: number;
  q?: string;
}): Promise<{ rows: AdminUserPublic[]; total: number }> {
  const sql = getSql();
  const limit = Math.min(Math.max(input.limit, 1), 200);
  const offset = Math.max(input.offset, 0);
  const q = input.q?.trim();

  if (q) {
    const pattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    const countRows = await sql`
      SELECT count(*)::int AS n
      FROM admin_users
      WHERE
        email ILIKE ${pattern}
        OR display_name ILIKE ${pattern}
        OR user_code ILIKE ${pattern}
    `;
    const total = Number((countRows[0] as { n: number }).n) || 0;
    const rows = await sql`
      SELECT
        id,
        user_code,
        email,
        display_name,
        phone_country,
        phone_number,
        role,
        created_at,
        updated_at
      FROM admin_users
      WHERE
        email ILIKE ${pattern}
        OR display_name ILIKE ${pattern}
        OR user_code ILIKE ${pattern}
      ORDER BY created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    return {
      total,
      rows: (rows as unknown as AdminUserDbRow[]).map(mapPublicRow),
    };
  }

  const countRows = await sql`
    SELECT count(*)::int AS n FROM admin_users
  `;
  const total = Number((countRows[0] as { n: number }).n) || 0;
  const rows = await sql`
    SELECT
      id,
      user_code,
      email,
      display_name,
      phone_country,
      phone_number,
      role,
      created_at,
      updated_at
    FROM admin_users
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
  return {
    total,
    rows: (rows as unknown as AdminUserDbRow[]).map(mapPublicRow),
  };
}

export async function getAdminUserById(
  id: string,
): Promise<AdminUserPublic | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      user_code,
      email,
      display_name,
      phone_country,
      phone_number,
      role,
      created_at,
      updated_at
    FROM admin_users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  const row = rows[0] as AdminUserDbRow | undefined;
  if (!row) return null;
  return mapPublicRow(row);
}

export async function insertAdminUser(input: {
  email: string;
  passwordHash: string;
  role: AdminRole;
  displayName: string;
  phoneCountry: string;
  phoneNumber: string;
}): Promise<AdminUserPublic> {
  const sql = getSql();
  const email = normalizeAdminEmail(input.email);
  const displayName = input.displayName.trim();
  const phoneCountry = input.phoneCountry.trim() || "+852";
  const phoneNumber = input.phoneNumber.trim();

  const rows = await sql`
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
      ${input.passwordHash},
      ${input.role},
      ${displayName},
      ${phoneCountry},
      ${phoneNumber}
    )
    RETURNING
      id,
      user_code,
      email,
      display_name,
      phone_country,
      phone_number,
      role,
      created_at,
      updated_at
  `;
  const row = rows[0] as AdminUserDbRow;
  return mapPublicRow(row);
}

export async function updateAdminUser(
  id: string,
  patch: {
    email?: string;
    displayName?: string;
    phoneCountry?: string;
    phoneNumber?: string;
    role?: AdminRole;
    passwordHash?: string;
  },
): Promise<AdminUserPublic | null> {
  const sql = getSql();

  const existing = await sql`
    SELECT
      id,
      user_code,
      email,
      display_name,
      phone_country,
      phone_number,
      role,
      password_hash,
      created_at,
      updated_at
    FROM admin_users
    WHERE id = ${id}::uuid
    LIMIT 1
  `;
  const cur = existing[0] as
    | (AdminUserDbRow & { password_hash: string })
    | undefined;
  if (!cur) return null;

  const hasChange =
    patch.email !== undefined ||
    patch.displayName !== undefined ||
    patch.phoneCountry !== undefined ||
    patch.phoneNumber !== undefined ||
    patch.role !== undefined ||
    patch.passwordHash !== undefined;

  if (!hasChange) {
    return mapPublicRow(cur);
  }

  const email =
    patch.email !== undefined ? normalizeAdminEmail(patch.email) : cur.email;
  const displayName =
    patch.displayName !== undefined
      ? patch.displayName.trim()
      : cur.display_name;
  const phoneCountry =
    patch.phoneCountry !== undefined
      ? patch.phoneCountry.trim() || "+852"
      : cur.phone_country;
  const phoneNumber =
    patch.phoneNumber !== undefined
      ? patch.phoneNumber.trim()
      : cur.phone_number;
  const role: AdminRole =
    patch.role !== undefined
      ? patch.role
      : cur.role === "admin" || cur.role === "viewer"
        ? cur.role
        : "viewer";
  const passwordHash =
    patch.passwordHash !== undefined ? patch.passwordHash : cur.password_hash;

  const rows = await sql`
    UPDATE admin_users
    SET
      email = ${email},
      display_name = ${displayName},
      phone_country = ${phoneCountry},
      phone_number = ${phoneNumber},
      role = ${role},
      password_hash = ${passwordHash},
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING
      id,
      user_code,
      email,
      display_name,
      phone_country,
      phone_number,
      role,
      created_at,
      updated_at
  `;
  const row = rows[0] as AdminUserDbRow | undefined;
  if (!row) return null;
  return mapPublicRow(row);
}
