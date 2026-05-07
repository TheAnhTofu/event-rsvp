import { getSql } from "@db/postgres";

export type DiscountCodeRow = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  percent_value: string | null;
  fixed_hkd: string | null;
  max_uses: number;
  used_count: number;
  apply_without_code: boolean;
};

/**
 * Load an active code: not expired, under max_uses (max_uses = 0 = unlimited), is_active.
 */
export async function findActiveDiscountCode(
  normalizedUpper: string,
): Promise<DiscountCodeRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      code,
      discount_type,
      percent_value::text,
      fixed_hkd::text,
      max_uses,
      used_count,
      apply_without_code
    FROM discount_codes
    WHERE upper(trim(code)) = ${normalizedUpper}
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses = 0 OR used_count < max_uses)
    LIMIT 1
  `;
  const row = rows[0] as DiscountCodeRow | undefined;
  return row ?? null;
}

/**
 * Active rule applied when the user enters no promo code (auto / pre-fill).
 * At most one such row should be active (enforced by partial unique index in migration 014).
 */
export async function findAutomaticDiscountCode(): Promise<DiscountCodeRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id,
      code,
      discount_type,
      percent_value::text,
      fixed_hkd::text,
      max_uses,
      used_count,
      apply_without_code
    FROM discount_codes
    WHERE apply_without_code = true
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses = 0 OR used_count < max_uses)
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const row = rows[0] as DiscountCodeRow | undefined;
  return row ?? null;
}

/**
 * After a successful paid registration using this code. Returns false if no row updated (race / expired).
 */
export async function incrementDiscountCodeUse(
  normalizedUpper: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE discount_codes
    SET
      used_count = used_count + 1,
      updated_at = now()
    WHERE upper(trim(code)) = ${normalizedUpper}
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (max_uses = 0 OR used_count < max_uses)
    RETURNING id
  `;
  return rows.length > 0;
}

/**
 * Restore one redemption slot (e.g. bank transfer rejected after postComplete reserved used_count).
 */
export async function decrementDiscountCodeUse(
  normalizedUpper: string,
): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`
    UPDATE discount_codes
    SET
      used_count = used_count - 1,
      updated_at = now()
    WHERE upper(trim(code)) = ${normalizedUpper}
      AND used_count > 0
    RETURNING id
  `;
  return rows.length > 0;
}
