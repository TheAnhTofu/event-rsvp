import type { RegistrationPipelineSnapshot } from "@/types/admin-registration-detail";
import type { EmailLogRow } from "@/types/email-log";
import type { RegistrationDetailResponse } from "@/types/crm";

/**
 * Aligns with `registrationPipelineInputFromCrm` / list registrations when
 * `pipelineSnapshot` is unavailable.
 */
export function derivePaymentStatusFromCrm(
  row: RegistrationDetailResponse,
): string {
  switch (row.crmPaymentStatus) {
    case "pending_bank_transfer":
      return "pending_verification";
    case "pending_stripe":
      return "pending";
    case "paid_verified":
      return "verified";
    case "demo_completed":
      return "completed";
    case "no_charge":
      return "completed";
    default:
      return "completed";
  }
}

function paymentMethod(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
): string {
  return snapshot?.payment_method ?? row.paymentMethod;
}

function paymentStatus(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
): string {
  return snapshot?.payment_status ?? derivePaymentStatusFromCrm(row);
}

function approvalStatus(snapshot: RegistrationPipelineSnapshot | null): string {
  return snapshot?.approval_status ?? "pending";
}

/** Same idea as `showApprove` on admin registrant list (bank slip pending). */
export function showBankTransferVerify(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
): boolean {
  return (
    paymentMethod(snapshot, row) === "bank_transfer" &&
    paymentStatus(snapshot, row) === "pending_verification"
  );
}

/** Same idea as `showConfirmRegistration` on admin registrant list. */
export function showRegistrationConfirm(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
): boolean {
  const a = approvalStatus(snapshot);
  if (a === "approved" || a === "rejected") return false;
  const ps = paymentStatus(snapshot, row);
  return ps === "completed" || ps === "verified";
}

export function thankYouEmailAlreadySent(logs: EmailLogRow[]): boolean {
  return logs.some((l) => l.template_key === "thank_you" && l.status === "sent");
}

/**
 * Thank-you email: after registration is confirmed (`approval_status` approved),
 * payment settled, and template not yet sent successfully.
 */
export function showSendThankYouEmail(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
  emailLogs: EmailLogRow[],
): boolean {
  if (thankYouEmailAlreadySent(emailLogs)) return false;
  if (approvalStatus(snapshot) !== "approved") return false;
  const ps = paymentStatus(snapshot, row);
  return ps === "verified" || ps === "completed";
}

export type PrimaryRegistrationAction =
  | "bank_verify"
  | "registration_confirm"
  | "send_thank_you";

/**
 * Exactly one primary CTA per state (Figma 125:7927…): highest-priority eligible action wins.
 */
export function resolvePrimaryRegistrationAction(
  snapshot: RegistrationPipelineSnapshot | null,
  row: RegistrationDetailResponse,
  emailLogs: EmailLogRow[],
): PrimaryRegistrationAction | null {
  if (showBankTransferVerify(snapshot, row)) return "bank_verify";
  if (showRegistrationConfirm(snapshot, row)) return "registration_confirm";
  if (showSendThankYouEmail(snapshot, row, emailLogs)) return "send_thank_you";
  return null;
}
