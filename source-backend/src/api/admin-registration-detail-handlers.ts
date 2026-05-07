import type { Request, Response } from "express";
import { requireDatabaseUrl } from "@db/postgres";
import { listEmailLogsByReference } from "@db/email-logs";
import { listSlipsByReference } from "@db/bank-transfer-slips";
import { listRegistrationStatusEvents } from "@db/status-events";
import { getRegistrationStatusForPipeline } from "@db/registrations";
import { listCheckInLogsByReference } from "@db/check-in-logs";
import { getRegistrationDetailFromDatabase } from "../lib/crm-detail-from-db.js";
import {
  buildRegistrationPipelineTimeline,
  mergeRegistrationAuditIntoPipelineTimeline,
  registrationPipelineInputFromCrm,
} from "../lib/admin/registration-pipeline.js";
import { requireAdminExpress } from "../express-helpers.js";

/**
 * Full admin registration detail: CRM row + email logs + status audit + pipeline snapshot.
 * Requires admin session cookie (same as other /api/admin routes).
 */
export async function getAdminRegistrationAdminDetail(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const reference = req.params.reference;
  if (!reference || typeof reference !== "string" || !reference.trim()) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }

  const decoded = decodeURIComponent(reference);

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const row = await getRegistrationDetailFromDatabase(decoded);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  let statusAudit: Awaited<ReturnType<typeof listRegistrationStatusEvents>> = [];
  let emailLogs: Awaited<ReturnType<typeof listEmailLogsByReference>> = [];
  let pipelineSnapshot: Awaited<
    ReturnType<typeof getRegistrationStatusForPipeline>
  > | null = null;
  let bankTransferSlips: Array<{
    id: string;
    file_name: string;
    file_size_bytes: number | null;
    uploaded_at: string;
    verified_at: string | null;
  }> = [];
  let checkInLogs: Awaited<ReturnType<typeof listCheckInLogsByReference>> = [];

  try {
    statusAudit = await listRegistrationStatusEvents(decoded);
    emailLogs = await listEmailLogsByReference(decoded);
    pipelineSnapshot = await getRegistrationStatusForPipeline(decoded);
    const slips = await listSlipsByReference(decoded, { order: "asc" });
    bankTransferSlips = slips.map((s) => ({
      id: s.id,
      file_name: s.file_name,
      file_size_bytes: s.file_size_bytes,
      uploaded_at: s.uploaded_at,
      verified_at: s.verified_at,
    }));
    checkInLogs = await listCheckInLogsByReference(decoded);
  } catch (e) {
    console.error("[admin-registration-detail]", e);
  }

  const emailLogsForPipeline = emailLogs.map((l) => ({
    template_key: l.template_key,
    status: l.status,
    created_at: l.created_at,
  }));

  const pipelineTimelineRaw = pipelineSnapshot
    ? buildRegistrationPipelineTimeline({
        createdAt: pipelineSnapshot.created_at,
        paymentMethod: pipelineSnapshot.payment_method,
        paymentStatus: pipelineSnapshot.payment_status,
        approvalStatus: pipelineSnapshot.approval_status,
        webhookVerifiedAt: pipelineSnapshot.webhook_verified_at,
        emailLogs: emailLogsForPipeline,
      })
    : buildRegistrationPipelineTimeline(
        registrationPipelineInputFromCrm(row, emailLogsForPipeline),
      );

  const pipelineTimeline = mergeRegistrationAuditIntoPipelineTimeline(
    pipelineTimelineRaw,
    statusAudit,
  );

  res.json({
    row,
    statusAudit,
    emailLogs,
    pipelineSnapshot,
    pipelineTimeline,
    bankTransferSlips,
    checkInLogs,
  });
}
