import { getSql } from "@db/postgres";

export type CheckInLogType = "check_in" | "check_out";

export type CheckInLogRow = {
  id: string;
  registration_reference: string;
  type: CheckInLogType;
  /** Admin email recorded as `checked_by`, may be NULL for legacy rows. */
  checked_by: string | null;
  /** ISO timestamp string. */
  created_at: string;
};

/**
 * Fetch all check-in/out events for a registration, oldest first
 * (timeline-friendly ordering).
 */
export async function listCheckInLogsByReference(
  reference: string,
): Promise<CheckInLogRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      id::text AS id,
      registration_reference,
      type,
      checked_by,
      created_at::text AS created_at
    FROM check_in_logs
    WHERE registration_reference = ${reference}
    ORDER BY created_at ASC
  `;
  return rows as unknown as CheckInLogRow[];
}
