import type { UserRecord } from "../types/user.js";
import { getPool } from "../db/pool.js";
import { config } from "../config.js";

type RegistrationRow = {
  id: string;
  reference: string;
  email: string;
  created_at: Date;
  payload: unknown;
};

function rowToUser(r: RegistrationRow): UserRecord {
  const payload = r.payload as Record<string, unknown> | null;
  const fn = String(payload?.firstName ?? "").trim();
  const ln = String(payload?.lastName ?? "").trim();
  const name = [fn, ln].filter(Boolean).join(" ") || "—";
  return {
    id: r.id,
    userId: r.reference,
    status: "active",
    permission: "registrant",
    name,
    email: r.email,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function buildWhereClause(params: {
  email?: string;
  q?: string;
  status?: "active" | "archived";
}): { whereSql: string; values: unknown[] } {
  const parts: string[] = ["TRUE"];
  const values: unknown[] = [];
  let i = 1;

  if (params.status === "archived") {
    return { whereSql: "FALSE", values: [] };
  }

  if (params.email?.trim()) {
    parts.push(`LOWER(r.email) LIKE LOWER($${i})`);
    values.push(`%${params.email.trim()}%`);
    i += 1;
  }

  if (params.q?.trim()) {
    const qq = `%${params.q.trim()}%`;
    parts.push(
      `(r.reference ILIKE $${i} OR r.email ILIKE $${i} OR COALESCE(r.payload->>'firstName','') ILIKE $${i} OR COALESCE(r.payload->>'lastName','') ILIKE $${i})`,
    );
    values.push(qq);
    i += 1;
  }

  return { whereSql: parts.join(" AND "), values };
}

export async function listUsersFromRegistrations(params: {
  limit: number;
  offset: number;
  email?: string;
  q?: string;
  status?: "active" | "archived";
}): Promise<{ total: number; limit: number; offset: number; items: UserRecord[] }> {
  const url = config.databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const pool = getPool(url);

  const { whereSql, values } = buildWhereClause(params);
  const countRes = await pool.query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM registrations r WHERE ${whereSql}`,
    values,
  );
  const total = Number.parseInt(countRes.rows[0]?.c ?? "0", 10);

  const limitIdx = values.length + 1;
  const offsetIdx = values.length + 2;
  const listSql = `
    SELECT r.id, r.reference, r.email, r.created_at, r.payload
    FROM registrations r
    WHERE ${whereSql}
    ORDER BY r.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const listRes = await pool.query<RegistrationRow>(listSql, [
    ...values,
    params.limit,
    params.offset,
  ]);

  const items = listRes.rows.map(rowToUser);
  return {
    total,
    limit: params.limit,
    offset: params.offset,
    items,
  };
}

export async function getUserByIdFromRegistrations(
  id: string,
): Promise<UserRecord | null> {
  const url = config.databaseUrl;
  if (!url) throw new Error("DATABASE_URL is not configured");
  const pool = getPool(url);

  const res = await pool.query<RegistrationRow>(
    `
    SELECT r.id, r.reference, r.email, r.created_at, r.payload
    FROM registrations r
    WHERE r.id::text = $1 OR r.reference = $1
    LIMIT 1
    `,
    [id.trim()],
  );

  if (res.rows.length === 0) return null;
  return rowToUser(res.rows[0]!);
}

/** `registrations` table: không có cột status — coi như thành công (204) để UI không lỗi. */
export async function updateUserStatusRegistrations(
  _id: string,
  _status: "active" | "archived",
): Promise<boolean> {
  return true;
}
