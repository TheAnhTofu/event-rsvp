import { getSql } from "@db/postgres";

/** payment: pending | pending_verification | verified | completed | rejected — approval: approved | rejected — registration: acknowledged */
export type StatusEventType = "payment" | "approval" | "registration";

export async function logRegistrationStatusEvent(input: {
  reference: string;
  type: StatusEventType;
  value: string;
  reason?: string | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO registration_status_events (registration_reference, status_type, status_value, reason)
    VALUES (${input.reference}, ${input.type}, ${input.value}, ${input.reason ?? null})
  `;
}

export async function listRegistrationStatusEvents(reference: string): Promise<
  {
    id: string;
    status_type: string;
    status_value: string;
    reason: string | null;
    created_at: string;
  }[]
> {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text, status_type::text, status_value::text, reason, created_at::text
    FROM registration_status_events
    WHERE registration_reference = ${reference}
    ORDER BY created_at ASC
  `;
  return rows as unknown as {
    id: string;
    status_type: string;
    status_value: string;
    reason: string | null;
    created_at: string;
  }[];
}

