import { getSql } from "@db/postgres";
import { logRegistrationStatusEvent } from "@db/status-events";

export type ApprovalBatchRow = {
  id: string;
  created_at: string;
  created_by: string;
  submitted_at: string | null;
  status: string;
  notes: string | null;
  registration_count?: number;
};

export type RegistrationApprovalRow = {
  reference: string;
  email: string;
  fee_hkd: string;
  audience_type: string | null;
  payment_status: string;
  approval_status: string;
  approval_batch_id: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
};

export async function createApprovalBatch(input: {
  createdBy: string;
  notes?: string | null;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO approval_batches (created_by, notes)
    VALUES (${input.createdBy}, ${input.notes ?? null})
    RETURNING id
  `;
  return (rows[0] as { id: string }).id;
}

export async function getApprovalBatch(
  batchId: string,
): Promise<ApprovalBatchRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, created_at::text, created_by, submitted_at::text, status, notes
    FROM approval_batches
    WHERE id = ${batchId}
    LIMIT 1
  `;
  return (rows[0] as ApprovalBatchRow | undefined) ?? null;
}

export async function listApprovalBatches(): Promise<ApprovalBatchRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT b.id, b.created_at::text, b.created_by, b.submitted_at::text, b.status, b.notes,
           (SELECT COUNT(*)::int FROM registrations r WHERE r.approval_batch_id = b.id) AS registration_count
    FROM approval_batches b
    ORDER BY b.created_at DESC
    LIMIT 100
  `;
  return rows as unknown as ApprovalBatchRow[];
}

export async function updateBatchStatus(
  batchId: string,
  status: string,
): Promise<void> {
  const sql = getSql();
  if (status === "submitted") {
    await sql`
      UPDATE approval_batches
      SET status = ${status}, submitted_at = now()
      WHERE id = ${batchId}
    `;
  } else {
    await sql`
      UPDATE approval_batches
      SET status = ${status}
      WHERE id = ${batchId}
    `;
  }
}

export async function assignRegistrationsToBatch(
  references: string[],
  batchId: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET approval_batch_id = ${batchId}, approval_status = 'submitted_to_ia'
    WHERE reference = ANY(${references})
      AND approval_status = 'pending'
      AND (payment_status = 'completed' OR payment_status = 'verified')
    RETURNING reference
  `;
  return rows.length;
}

export async function listRegistrationsForBatch(
  batchId: string,
): Promise<RegistrationApprovalRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT r.reference, r.email, r.fee_hkd::text, r.audience_type,
           r.payment_status, r.approval_status, r.approval_batch_id,
           r.created_at::text,
           r.payload->>'firstName' AS first_name,
           r.payload->>'lastName' AS last_name
    FROM registrations r
    WHERE r.approval_batch_id = ${batchId}
    ORDER BY r.created_at ASC
  `;
  return rows as unknown as RegistrationApprovalRow[];
}

export async function listPendingApprovalRegistrations(): Promise<
  RegistrationApprovalRow[]
> {
  const sql = getSql();
  const rows = await sql`
    SELECT r.reference, r.email, r.fee_hkd::text, r.audience_type,
           r.payment_status, r.approval_status, r.approval_batch_id,
           r.created_at::text,
           r.payload->>'firstName' AS first_name,
           r.payload->>'lastName' AS last_name
    FROM registrations r
    WHERE r.approval_status = 'pending'
      AND (r.payment_status = 'completed' OR r.payment_status = 'verified')
    ORDER BY r.created_at ASC
    LIMIT 500
  `;
  return rows as unknown as RegistrationApprovalRow[];
}

/**
 * Marks registration as approved (confirm registration) when payment is already
 * settled — for card/Stripe or verified bank transfer without using IA batch flow.
 */
export async function confirmRegistrationDirect(
  reference: string,
  approvedBy: string,
): Promise<"ok" | "not_found" | "not_eligible"> {
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET approval_status = 'approved', approved_at = now(), approved_by = ${approvedBy}
    WHERE reference = ${reference}
      AND COALESCE(approval_status, 'pending') IN ('pending', 'submitted_to_ia')
      AND payment_status IN ('completed', 'verified')
    RETURNING reference
  `;
  const updated = rows as unknown as { reference: string }[];
  if (updated.length > 0) {
    await logRegistrationStatusEvent({
      reference,
      type: "approval",
      value: "approved",
      reason: approvedBy,
    });
    return "ok";
  }
  const exists = await sql`
    SELECT 1 FROM registrations WHERE reference = ${reference} LIMIT 1
  `;
  if (exists.length === 0) return "not_found";
  return "not_eligible";
}

export async function approveRegistrations(
  references: string[],
  approvedBy: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET approval_status = 'approved', approved_at = now(), approved_by = ${approvedBy}
    WHERE reference = ANY(${references})
      AND approval_status = 'submitted_to_ia'
    RETURNING reference
  `;
  const updated = rows as unknown as { reference: string }[];
  for (const row of updated) {
    await logRegistrationStatusEvent({
      reference: row.reference,
      type: "approval",
      value: "approved",
      reason: approvedBy,
    });
  }
  return updated.length;
}

export async function rejectRegistrations(
  references: string[],
  approvedBy: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET approval_status = 'rejected', approved_at = now(), approved_by = ${approvedBy}
    WHERE reference = ANY(${references})
      AND approval_status = 'submitted_to_ia'
    RETURNING reference
  `;
  const updatedRej = rows as unknown as { reference: string }[];
  for (const row of updatedRej) {
    await logRegistrationStatusEvent({
      reference: row.reference,
      type: "approval",
      value: "rejected",
      reason: approvedBy,
    });
  }
  return updatedRej.length;
}

export async function updateRegistrationPaymentStatus(
  reference: string,
  paymentStatus: string,
  options?: { syncAmountPaidWithFee?: boolean },
): Promise<void> {
  const sql = getSql();
  if (options?.syncAmountPaidWithFee && paymentStatus === "verified") {
    await sql`
      UPDATE registrations
      SET
        payment_status = ${paymentStatus},
        amount_paid_hkd = fee_hkd
      WHERE reference = ${reference}
    `;
  } else {
    await sql`
      UPDATE registrations
      SET payment_status = ${paymentStatus}
      WHERE reference = ${reference}
    `;
  }
  await logRegistrationStatusEvent({
    reference,
    type: "payment",
    value: paymentStatus,
  });
}
