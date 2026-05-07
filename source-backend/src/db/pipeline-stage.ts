/**
 * Pipeline stage helpers.
 *
 * Source of truth: `recompute_pipeline_stage()` SQL function (migration 023).
 * This module provides the TypeScript counterpart for INSERT-time stage
 * computation so the app writes the correct value directly.
 */

import { getSql } from "@db/postgres";
import { logRegistrationStatusEvent } from "@db/status-events";

export type PipelineStage =
  | "registered"
  | "bank_slip_received"
  | "paid"
  | "payment_received"
  | "registration_confirmed"
  | "sending_confirmation_email"
  | "confirmation_email_sent"
  | "sending_thank_you_email"
  | "thank_you_email_sent";

const VALID_STAGES = new Set<string>([
  "registered",
  "bank_slip_received",
  "paid",
  "payment_received",
  "registration_confirmed",
  "sending_confirmation_email",
  "confirmation_email_sent",
  "sending_thank_you_email",
  "thank_you_email_sent",
]);

export function isValidPipelineStage(s: string): s is PipelineStage {
  return VALID_STAGES.has(s);
}

/**
 * Admin force-set `pipeline_stage` — bypasses the BEFORE trigger
 * (which only fires on payment_status/approval_status/etc column changes).
 * Returns the number of rows updated (0 or 1).
 */
export async function forceSetPipelineStage(
  reference: string,
  stage: PipelineStage,
): Promise<number> {
  const sql = getSql();
  const found = await sql`
    SELECT 1 AS ok
    FROM registrations
    WHERE reference = ${reference}
    LIMIT 1
  `;
  if (found.length === 0) return 0;

  await sql`
    UPDATE registrations
    SET pipeline_stage = ${stage}
    WHERE reference = ${reference}
  `;

  try {
    await logRegistrationStatusEvent({
      reference,
      type: "registration",
      value: stage,
      reason: "admin_force_pipeline_stage",
    });
  } catch (e) {
    console.error("[forceSetPipelineStage] status event", e);
  }
  return 1;
}

/**
 * Compute `pipeline_stage` for a **new** registration row.
 *
 * At INSERT time there are no `email_logs` or `bank_transfer_slips` yet,
 * and `approval_status` is always NULL/pending, so the stage depends only
 * on `paymentStatus` and `paymentMethod`.
 *
 * The DB trigger (`trg_registrations_pipeline_stage`) will recompute on
 * subsequent column changes, but having the correct value at INSERT makes
 * the data clean from the start.
 */
export function initialPipelineStage(
  paymentStatus: string,
  paymentMethod: string,
): PipelineStage {
  const paid = paymentStatus === "verified" || paymentStatus === "completed";
  if (paid && paymentMethod === "bank_transfer") return "payment_received";
  if (paid) return "paid";
  return "registered";
}
