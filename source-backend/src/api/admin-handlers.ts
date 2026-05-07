import { GetObjectCommand, HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Request, Response } from "express";
import { z } from "zod";
import { requireDatabaseUrl, getSql } from "@db/postgres";
import {
  getAdminUserByEmail,
  verifyAdminPassword,
} from "@db/admin-users";
import { parseRegistrationColumnFiltersFromQuery } from "@db/admin-emails-column-filters";
import {
  countPipelineStages,
  listEmailLogsPaginated,
  listRegistrationsForEmailsAdmin,
} from "@db/admin-emails-list";
import {
  createApprovalBatch,
  listApprovalBatches,
  assignRegistrationsToBatch,
  listPendingApprovalRegistrations,
  getApprovalBatch,
  approveRegistrations,
  confirmRegistrationDirect,
  rejectRegistrations,
  updateBatchStatus,
  listRegistrationsForBatch,
  updateRegistrationPaymentStatus,
} from "@db/approvals";
import {
  getBankTransferSlipById,
  listSlipsByReference,
  markSlipVerified,
  markSlipRejected,
} from "@db/bank-transfer-slips";
import { getRegistrationByReference } from "@db/registrations";
import {
  forceSetPipelineStage,
  isValidPipelineStage,
} from "@db/pipeline-stage";
import { decrementDiscountCodeUse } from "@db/discount-codes";
import { parseDiscountCodesFromRaw } from "../lib/discount-code.js";
import {
  COOKIE_NAME,
  isAdminAuthConfigured,
  signAdminToken,
} from "../lib/admin-auth/session.js";
import { sendBulkEmail } from "../lib/email/send-bulk-email.js";
import {
  enqueueBulkEmailJob,
  type BulkEmailTemplateKey,
} from "../lib/email-job-queue.js";
import { requireAdminExpress } from "../express-helpers.js";
import { resolveS3Bucket } from "../lib/s3-bucket.js";

function setSessionCookie(res: Response, token: string): void {
  const maxAge = 60 * 60 * 24 * 7;
  const secure = process.env.NODE_ENV === "production";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearSessionCookie(res: Response): void {
  const parts = [
    `${COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
  ];
  res.setHeader("Set-Cookie", parts.join("; "));
}

export async function postAdminLogin(req: Request, res: Response): Promise<void> {
  if (process.env.ADMIN_AUTH_DISABLED === "true") {
    res.json({ ok: true, disabled: true });
    return;
  }

  if (!isAdminAuthConfigured()) {
    res.status(503).json({
      error: "Admin auth not configured (set ADMIN_SESSION_SECRET)",
    });
    return;
  }

  const body = req.body as { email?: string; password?: string };
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const user = await getAdminUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const ok = await verifyAdminPassword(password, user.password_hash);
  if (!ok) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = await signAdminToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  if (!token) {
    res.status(500).json({ error: "Could not create session" });
    return;
  }

  setSessionCookie(res, token);
  res.json({ ok: true, role: user.role, email: user.email });
}

export async function postAdminLogout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.json({ ok: true });
}

function getS3(): { client: S3Client; bucket: string } {
  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "ap-southeast-1";
  const bucket = resolveS3Bucket();
  if (!bucket) {
    throw new Error(
      "S3_BUCKET is not set (or legacy BANK_SLIP_BUCKET / EMAIL_ASSETS_S3_BUCKET)",
    );
  }
  return { client: new S3Client({ region }), bucket };
}

const SLIP_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getBankSlipImage(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const idRaw = String(req.query.id ?? "").trim();
  let slip: Awaited<ReturnType<typeof getBankTransferSlipById>>;

  if (idRaw) {
    if (!SLIP_ID_RE.test(idRaw)) {
      res.status(400).json({ error: "Invalid slip id" });
      return;
    }
    slip = await getBankTransferSlipById(idRaw);
    if (!slip) {
      res.status(404).json({ error: "No bank slip" });
      return;
    }
  } else {
    const reference = String(req.query.reference ?? "").trim();
    if (!reference) {
      res.status(400).json({ error: "Missing reference or id" });
      return;
    }

    const slips = await listSlipsByReference(reference);
    slip = slips[0] ?? null;
    if (!slip) {
      res.status(404).json({ error: "No bank slip" });
      return;
    }
  }

  let client: S3Client;
  let bucket: string;
  try {
    ({ client, bucket } = getS3());
  } catch (e) {
    res.status(503).json({
      error: e instanceof Error ? e.message : "S3 not configured",
    });
    return;
  }

  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: slip.file_key,
      }),
    );
    const body = out.Body;
    if (!body) {
      res.status(404).json({ error: "Empty object" });
      return;
    }

    const bytes = await body.transformToByteArray();
    const contentType = out.ContentType ?? "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(bytes));
  } catch (e) {
    console.error("[bank-slip image]", e);
    res.status(500).json({ error: "Failed to load file" });
  }
}

/** PDFs produced by transactional email + `uploadPdfToS3` (`documents/{ref}/{name}`). */
const REGISTRATION_EMAIL_DOC_FILES = new Set([
  "IAIS-registration-invoice.pdf",
  "IAIS-payment-receipt.pdf",
]);

/**
 * Admin proxy for registration email PDFs on S3 (`documents/{reference}/...`).
 * — `IAIS-registration-invoice.pdf`: built in acknowledge send (`send-acknowledge-email.ts`).
 * — `IAIS-payment-receipt.pdf`: built in payment confirmation send (`send-payment-confirmation.ts`).
 */
export async function getRegistrationEmailDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const reference = String(req.query.reference ?? "").trim();
  const fileName = String(req.query.file ?? "").trim();

  if (!reference || !fileName || !REGISTRATION_EMAIL_DOC_FILES.has(fileName)) {
    res.status(400).json({ error: "Missing or invalid reference or file" });
    return;
  }
  if (/[/\\]|\.\./.test(reference)) {
    res.status(400).json({ error: "Invalid reference" });
    return;
  }

  const key = `documents/${reference}/${fileName}`;

  let client: S3Client;
  let bucket: string;
  try {
    ({ client, bucket } = getS3());
  } catch (e) {
    res.status(503).json({
      error: e instanceof Error ? e.message : "S3 not configured",
    });
    return;
  }

  try {
    const out = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const body = out.Body;
    if (!body) {
      res.status(404).json({ error: "Empty object" });
      return;
    }

    const bytes = await body.transformToByteArray();
    const contentType = out.ContentType ?? "application/pdf";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${fileName.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(Buffer.from(bytes));
  } catch (e) {
    const err = e as { name?: string; Code?: string };
    if (err.name === "NoSuchKey" || err.Code === "NoSuchKey") {
      res.status(404).json({ error: "Document not found in storage" });
      return;
    }
    console.error("[registration email document]", e);
    res.status(500).json({ error: "Failed to load file" });
  }
}

/**
 * Same auth and S3 key as {@link getRegistrationEmailDocument}, but uses HeadObject only
 * so the admin UI can check existence without downloading the PDF.
 */
export async function headRegistrationEmailDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  const reference = String(req.query.reference ?? "").trim();
  const fileName = String(req.query.file ?? "").trim();

  if (!reference || !fileName || !REGISTRATION_EMAIL_DOC_FILES.has(fileName)) {
    res.status(400).json({ error: "Missing or invalid reference or file" });
    return;
  }
  if (/[/\\]|\.\./.test(reference)) {
    res.status(400).json({ error: "Invalid reference" });
    return;
  }

  const key = `documents/${reference}/${fileName}`;

  let client: S3Client;
  let bucket: string;
  try {
    ({ client, bucket } = getS3());
  } catch (e) {
    res.status(503).json({
      error: e instanceof Error ? e.message : "S3 not configured",
    });
    return;
  }

  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    res.status(200).end();
  } catch (e) {
    const err = e as {
      name?: string;
      Code?: string;
      $metadata?: { httpStatusCode?: number };
    };
    if (
      err.name === "NotFound" ||
      err.name === "NoSuchKey" ||
      err.Code === "NoSuchKey" ||
      err.$metadata?.httpStatusCode === 404
    ) {
      res.status(404).end();
      return;
    }
    console.error("[registration email document HEAD]", e);
    res.status(500).json({ error: "Failed to check file" });
  }
}

const registrationsQuery = z.object({
  view: z.literal("registrations"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  /** Filter by payment method (`all` = no filter). */
  pm: z.enum(["all", "stripe", "bank_transfer", "paymentasia"]).default("all"),
  sort: z
    .enum([
      "created_at",
      "email",
      "reference",
      "first_name",
      "last_name",
      "payment_status",
      "approval_status",
      "pipeline_stage",
      "attendance",
      "audience_type",
      "phone",
      "payment_method",
      "fee_hkd",
      "payment_date",
      "payment_reference",
      "country",
      "company",
      "job_title",
    ])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  stage: z
    .enum([
      "all",
      "registered",
      "bank_slip_received",
      "paid",
      "payment_received",
      "registration_confirmed",
      "sending_confirmation_email",
      "confirmation_email_sent",
      "sending_thank_you_email",
      "thank_you_email_sent",
    ])
    .default("all"),
  flt_ps: z.string().max(500).optional(),
  flt_at: z.string().max(500).optional(),
  flt_pm: z.string().max(500).optional(),
  flt_ref: z.string().max(200).optional(),
  flt_email: z.string().max(320).optional(),
  flt_name: z.string().max(200).optional(),
  flt_phone: z.string().max(80).optional(),
  flt_co: z.string().max(200).optional(),
  flt_country: z.string().max(120).optional(),
  flt_job: z.string().max(200).optional(),
  flt_pref: z.string().max(200).optional(),
  flt_dc0: z.string().max(10).optional(),
  flt_dc1: z.string().max(10).optional(),
  flt_dp0: z.string().max(10).optional(),
  flt_dp1: z.string().max(10).optional(),
});

const logsQuery = z.object({
  view: z.literal("logs"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  digestOnly: z.enum(["0", "1", "true", "false"]).optional(),
  sort: z
    .enum([
      "created_at",
      "to_email",
      "template_key",
      "status",
      "registration_reference",
    ])
    .default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export async function getAdminEmails(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const raw = Object.fromEntries(
    Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );
  const view = (raw.view as string) ?? "registrations";

  try {
    if (view === "logs") {
      const p = logsQuery.parse({ ...raw, view: "logs" });
      const offset = (p.page - 1) * p.pageSize;
      const digestOnly = p.digestOnly === "1" || p.digestOnly === "true";
      const { rows, total } = await listEmailLogsPaginated({
        q: p.q ?? null,
        sort: p.sort,
        order: p.order,
        limit: p.pageSize,
        offset,
        digestOnly,
      });

      res.json({
        view: "logs",
        logs: rows.map((r) => ({ ...r, sent_at: r.created_at })),
        total,
        page: p.page,
        pageSize: p.pageSize,
      });
      return;
    }

    const p = registrationsQuery.parse({ ...raw, view: "registrations" });
    const offset = (p.page - 1) * p.pageSize;
    const stageParam = p.stage === "all" ? null : p.stage;
    const pmParam = p.pm === "all" ? null : p.pm;
    const columnFilters = parseRegistrationColumnFiltersFromQuery(p);

    const [{ rows, total }, stageCounts] = await Promise.all([
      listRegistrationsForEmailsAdmin({
        q: p.q ?? null,
        stage: stageParam,
        paymentMethod: pmParam,
        sort: p.sort,
        order: p.order,
        limit: p.pageSize,
        offset,
        columnFilters,
      }),
      countPipelineStages(),
    ]);

    res.json({
      view: "registrations",
      registrations: rows,
      total,
      page: p.page,
      pageSize: p.pageSize,
      stageCounts,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Invalid query", detail: e.flatten() });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Failed to load data" });
  }
}

const sendBodySchema = z.object({
  references: z.array(z.string().min(1)).min(1).max(5000),
  templateKey: z.enum([
    "payment_confirmation",
    "bank_transfer_rejected",
    "thank_you",
    "email_confirmation_physical_attendance",
    "acknowledge",
  ]),
  rejectionNote: z.string().max(500).optional(),
});

export async function postAdminEmailsSend(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = sendBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const enqueued = await enqueueBulkEmailJob({
    references: parsed.data.references,
    templateKey: parsed.data.templateKey as BulkEmailTemplateKey,
    rejectionNote: parsed.data.rejectionNote,
  });

  if (enqueued.queued) {
    res.json({
      ok: true,
      queued: true,
      count: enqueued.totalReferences,
      chunks: enqueued.chunks,
    });
    return;
  }

  try {
    const result = await sendBulkEmail(
      parsed.data.references,
      parsed.data.templateKey,
      { rejectionNote: parsed.data.rejectionNote },
    );
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Send failed" });
  }
}

const createBodySchema = z.object({
  createdBy: z.string().min(1).max(120),
  notes: z.string().max(500).optional(),
  references: z.array(z.string().min(1)).min(1),
});

export async function getAdminApprovals(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  try {
    const [batches, pending] = await Promise.all([
      listApprovalBatches(),
      listPendingApprovalRegistrations(),
    ]);
    res.json({ batches, pending });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load batches" });
  }
}

export async function postAdminApprovals(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = createBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    const batchId = await createApprovalBatch({
      createdBy: parsed.data.createdBy,
      notes: parsed.data.notes,
    });

    const assigned = await assignRegistrationsToBatch(
      parsed.data.references,
      batchId,
    );

    res.json({ ok: true, batchId, assigned });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create batch" });
  }
}

export async function getAdminApprovalRegistrations(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const batchId = String(req.params.batchId ?? "").trim();
  if (!batchId) {
    res.status(400).json({ error: "Invalid batch ID" });
    return;
  }

  try {
    const registrations = await listRegistrationsForBatch(batchId);
    res.json({ registrations });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load registrations" });
  }
}

const approveBodySchema = z.object({
  approvedBy: z.string().min(1).max(120),
  approvedReferences: z.array(z.string()).default([]),
  rejectedReferences: z.array(z.string()).default([]),
});

export async function postAdminApprovalDecision(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const batchId = String(req.params.batchId ?? "").trim();
  if (!batchId) {
    res.status(400).json({ error: "Invalid batch ID" });
    return;
  }

  const parsed = approveBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const batch = await getApprovalBatch(batchId);
  if (!batch) {
    res.status(404).json({ error: "Batch not found" });
    return;
  }

  try {
    let approvedCount = 0;
    let rejectedCount = 0;

    if (parsed.data.approvedReferences.length > 0) {
      approvedCount = await approveRegistrations(
        parsed.data.approvedReferences,
        parsed.data.approvedBy,
      );
    }

    if (parsed.data.rejectedReferences.length > 0) {
      rejectedCount = await rejectRegistrations(
        parsed.data.rejectedReferences,
        parsed.data.approvedBy,
      );
    }

    const registrations = await listRegistrationsForBatch(batchId);
    const allApproved = registrations.every((r) => r.approval_status === "approved");
    const allDecided = registrations.every(
      (r) =>
        r.approval_status === "approved" || r.approval_status === "rejected",
    );

    if (allApproved) {
      await updateBatchStatus(batchId, "approved");
    } else if (allDecided) {
      await updateBatchStatus(batchId, "partially_approved");
    }

    if (parsed.data.approvedReferences.length > 0) {
      const q = await enqueueBulkEmailJob({
        references: parsed.data.approvedReferences,
        templateKey: "payment_confirmation",
      });
      if (!q) {
        try {
          await sendBulkEmail(parsed.data.approvedReferences, "payment_confirmation");
        } catch (e) {
          console.error("[approval] confirmation email failed", e);
        }
      }
    }

    res.json({
      ok: true,
      approved: approvedCount,
      rejected: rejectedCount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Approval failed" });
  }
}

const confirmRegistrationBodySchema = z.object({
  reference: z.string().min(1).max(120),
  confirmedBy: z.string().min(1).max(120).optional(),
});

export async function postAdminConfirmRegistration(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = confirmRegistrationBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const reference = parsed.data.reference.trim();
  const confirmedBy =
    parsed.data.confirmedBy?.trim() || auth.email || "admin";

  try {
    const outcome = await confirmRegistrationDirect(reference, confirmedBy);
    if (outcome === "not_found") {
      res.status(404).json({ error: "Registration not found" });
      return;
    }
    if (outcome === "not_eligible") {
      res.status(409).json({
        error:
          "Cannot confirm: payment must be completed or verified, and approval must still be pending.",
      });
      return;
    }

    // Email Confirmation (Figma 321:25059) — payment receipt email is separate (manual / Payment Confirmation template).
    const enqueued = await enqueueBulkEmailJob({
      references: [reference],
      templateKey: "email_confirmation_physical_attendance",
    });
    let emailSent = Boolean(enqueued.queued);
    if (!enqueued.queued) {
      try {
        const sendResult = await sendBulkEmail(
          [reference],
          "email_confirmation_physical_attendance",
        );
        emailSent = sendResult.sent > 0;
        if (sendResult.failed > 0) {
          console.error("[confirm-registration] confirmation email failed", sendResult.errors);
        }
      } catch (e) {
        console.error("[confirm-registration] email confirmation failed", e);
      }
    }

    res.json({ ok: true, reference, emailConfirmationQueuedOrSent: emailSent });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Confirm failed" });
  }
}

const updateStageBodySchema = z.object({
  references: z.array(z.string().min(1).max(120)).min(1).max(200),
  stage: z.string().min(1).max(60),
});

export async function postAdminUpdateStage(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const parsed = updateStageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", details: parsed.error.issues });
    return;
  }

  const { references, stage } = parsed.data;
  if (!isValidPipelineStage(stage)) {
    res.status(400).json({ error: `Invalid pipeline stage: ${stage}` });
    return;
  }

  try {
    const results = await Promise.allSettled(
      references.map((ref) => forceSetPipelineStage(ref.trim(), stage)),
    );
    const ok = results.filter(
      (r) => r.status === "fulfilled" && r.value > 0,
    ).length;
    const notFound = results.filter(
      (r) => r.status === "fulfilled" && r.value === 0,
    ).length;
    const failed = results.filter((r) => r.status === "rejected").length;
    res.json({ ok: true, updated: ok, notFound, failed });
  } catch (e) {
    console.error("[update-stage]", e);
    res.status(500).json({ error: "Update stage failed" });
  }
}

export async function getAdminBankTransfers(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  try {
    const sql = getSql();
    const rows = await sql`
      SELECT r.reference, r.email, r.fee_hkd::text,
             r.payment_status, r.created_at::text,
             r.payload->>'firstName' AS first_name,
             r.payload->>'lastName' AS last_name,
             r.payload->>'company' AS company,
             COALESCE(r.audience_type, 'unknown') AS audience_type
      FROM registrations r
      WHERE r.payment_status IN ('pending_verification', 'verified', 'rejected')
         OR (r.payment_status = 'completed'
             AND EXISTS (
               SELECT 1 FROM bank_transfer_slips s WHERE s.registration_reference = r.reference
             ))
      ORDER BY
        CASE r.payment_status
          WHEN 'pending_verification' THEN 0
          WHEN 'verified' THEN 1
          WHEN 'completed' THEN 2
          ELSE 3
        END,
        r.created_at DESC
      LIMIT 500
    `;
    res.json({ transfers: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load" });
  }
}

const bodyBySlipSchema = z.object({
  slipId: z.string().uuid(),
  registrationReference: z.string().min(1),
  action: z.enum(["verify", "reject"]),
  rejectionNote: z.string().max(500).optional(),
  adminEmail: z.string().email().optional(),
  /** When verifying: if true, enqueue payment_confirmation email (default false). */
  sendPaymentConfirmation: z.boolean().optional(),
});

const bodyByReferenceSchema = z.object({
  reference: z.string().min(1),
  action: z.enum(["verify", "reject"]),
  verifiedBy: z.string().optional(),
  rejectionNote: z.string().max(500).optional(),
  /** When verifying: if true, enqueue payment_confirmation email (default false). */
  sendPaymentConfirmation: z.boolean().optional(),
});

async function resolveLatestPendingSlipId(
  registrationReference: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id::text AS id
    FROM bank_transfer_slips
    WHERE registration_reference = ${registrationReference}
      AND verified_at IS NULL
      AND rejected_at IS NULL
    ORDER BY uploaded_at DESC
    LIMIT 1
  `;
  const row = rows[0] as { id: string } | undefined;
  return row?.id ?? null;
}

export async function postAdminBankVerify(req: Request, res: Response): Promise<void> {
  const auth = await requireAdminExpress(req, res);
  if (!auth.ok) return;

  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database not configured" });
    return;
  }

  const bySlip = bodyBySlipSchema.safeParse(req.body);
  const byRef = bodyByReferenceSchema.safeParse(req.body);

  let slipId: string;
  let registrationReference: string;
  let action: "verify" | "reject";
  let rejectionNote: string | undefined;
  let verifierLabel: string;

  let sendPaymentConfirmationOnVerify = false;

  if (bySlip.success) {
    slipId = bySlip.data.slipId;
    registrationReference = bySlip.data.registrationReference;
    action = bySlip.data.action;
    rejectionNote = bySlip.data.rejectionNote;
    verifierLabel = bySlip.data.adminEmail ?? "admin";
    sendPaymentConfirmationOnVerify = bySlip.data.sendPaymentConfirmation === true;
  } else if (byRef.success) {
    registrationReference = byRef.data.reference.trim();
    action = byRef.data.action;
    rejectionNote = byRef.data.rejectionNote;
    verifierLabel = byRef.data.verifiedBy?.trim() || "admin";
    sendPaymentConfirmationOnVerify = byRef.data.sendPaymentConfirmation === true;
    const resolved = await resolveLatestPendingSlipId(registrationReference);
    if (!resolved) {
      res.status(404).json({
        error: "No pending bank slip found for this registration",
      });
      return;
    }
    slipId = resolved;
  } else {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  try {
    if (action === "verify") {
      await markSlipVerified(slipId, verifierLabel);
      await updateRegistrationPaymentStatus(registrationReference, "verified", {
        syncAmountPaidWithFee: true,
      });

      if (sendPaymentConfirmationOnVerify) {
        const enqueued = await enqueueBulkEmailJob({
          references: [registrationReference],
          templateKey: "payment_confirmation",
        });
        if (!enqueued.queued) {
          try {
            await sendBulkEmail([registrationReference], "payment_confirmation");
          } catch (e) {
            console.error("[bank-verify] confirmation email failed", e);
          }
        }
      }
    } else {
      const snapshot = await getRegistrationByReference(registrationReference);
      await markSlipRejected(slipId, rejectionNote ?? "");
      await updateRegistrationPaymentStatus(registrationReference, "rejected");

      if (
        snapshot &&
        snapshot.payment_status === "pending_verification" &&
        snapshot.discount_code?.trim()
      ) {
        for (const code of parseDiscountCodesFromRaw(snapshot.discount_code)) {
          const ok = await decrementDiscountCodeUse(code);
          if (!ok) {
            console.warn(
              "[bank-verify] discount restore skipped",
              code,
              registrationReference,
            );
          }
        }
      }

      const enqueued = await enqueueBulkEmailJob({
        references: [registrationReference],
        templateKey: "bank_transfer_rejected",
        rejectionNote,
      });
      if (!enqueued.queued) {
        try {
          await sendBulkEmail([registrationReference], "bank_transfer_rejected", {
            rejectionNote,
          });
        } catch (e) {
          console.error("[bank-verify] rejection email failed", e);
        }
      }
    }

    res.json({ ok: true, action });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Operation failed" });
  }
}
