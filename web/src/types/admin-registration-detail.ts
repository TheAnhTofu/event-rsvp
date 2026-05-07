import type { PipelineStepView } from "./admin-pipeline";
import type { RegistrationDetailResponse } from "./crm";
import type { EmailLogRow } from "./email-log";

export type RegistrationStatusAuditRow = {
  id: string;
  status_type: string;
  status_value: string;
  reason: string | null;
  created_at: string;
};

export type RegistrationPipelineSnapshot = {
  created_at: string;
  payment_method: string;
  payment_status: string;
  approval_status: string;
  webhook_verified_at: string | null;
};

/** Bank slip metadata (S3 object resolved server-side via `file_key`); download uses slip `id`. */
export type BankTransferSlipSummary = {
  id: string;
  file_name: string;
  file_size_bytes: number | null;
  uploaded_at: string;
  /** Set when admin verifies the slip (bank transfer). */
  verified_at: string | null;
};

export type CheckInLogType = "check_in" | "check_out";

/** Single CPD scan event row from `check_in_logs` (Registrant Profile timeline). */
export type CheckInLogEntry = {
  id: string;
  registration_reference: string;
  type: CheckInLogType;
  /** Admin email recorded as the scanner; NULL for legacy rows. */
  checked_by: string | null;
  /** ISO timestamp string. */
  created_at: string;
};

/** Full admin registration view from `GET /api/admin/registrations/:reference/admin-detail`. */
export type AdminRegistrationAdminDetailResponse = {
  row: RegistrationDetailResponse;
  statusAudit: RegistrationStatusAuditRow[];
  emailLogs: EmailLogRow[];
  pipelineSnapshot: RegistrationPipelineSnapshot | null;
  /** Derived on the server (`source-backend` registration pipeline). */
  pipelineTimeline: PipelineStepView[];
  /** Uploaded bank slips, oldest first. */
  bankTransferSlips: BankTransferSlipSummary[];
  /** All CPD scans (check-in + check-out), oldest first. */
  checkInLogs: CheckInLogEntry[];
};
