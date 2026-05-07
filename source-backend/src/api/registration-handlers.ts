import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { Request, Response } from "express";
import { z } from "zod";
import { apiRegistrationSchema } from "../lib/api-registration-schema.ts";
import { resolveFeesHkdForApi } from "../lib/registration-schema.ts";
import { resolveDiscountForPayment } from "../lib/resolve-discount.js";
import { incrementDiscountCodeUse } from "@db/discount-codes";
import { parseDiscountCodesFromRaw } from "../lib/discount-code.js";
import { requireDatabaseUrl } from "@db/postgres";
import {
  insertRegistrationDraft,
  getRegistrationDraftById,
  getRegistrationPayloadByReferenceAndEmail,
  updateRegistrationDraftSnapshot,
  upsertRegistrationOnComplete,
  upsertRegistrationAfterAcknowledge,
  ackReferenceFromDraftId,
  type PaymentMethodRow,
} from "@db/registrations";
import { insertBankTransferSlip } from "@db/bank-transfer-slips";
import { logRegistrationStatusEvent } from "@db/status-events";
import { sendAcknowledgeEmail } from "../lib/email/send-acknowledge-email.js";
import { sendPaymentConfirmationEmail } from "../lib/email/send-payment-confirmation.js";
import { resolveS3Bucket } from "../lib/s3-bucket.js";

const acknowledgeBodySchema = z.object({
  registration: z.unknown(),
  locale: z.string().max(32).optional(),
  draftId: z.string().uuid().optional(),
});

const commitForPaymentBodySchema = z.object({
  registration: z.unknown(),
  locale: z.string().max(32).optional(),
  draftId: z.string().uuid(),
});

/** Continue to Review: persist draft only — no `registrations` row, no acknowledge email. */
export async function postAcknowledge(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const parsed = acknowledgeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const reg = apiRegistrationSchema.safeParse(parsed.data.registration);
  if (!reg.success) {
    res.status(400).json({
      error: "Invalid registration",
      issues: reg.error.flatten(),
    });
    return;
  }

  const locale = parsed.data.locale ?? null;
  const fee = await resolveFeesHkdForApi(reg.data.attendance, reg.data.audienceType);

  let draftId = parsed.data.draftId ?? null;

  if (draftId) {
    const existingDraft = await getRegistrationDraftById(draftId);
    if (existingDraft) {
      await updateRegistrationDraftSnapshot({
        id: draftId,
        feeHkd: fee,
        locale,
        payload: reg.data,
      });
      res.json({
        ok: true,
        draftId,
        reference: ackReferenceFromDraftId(draftId),
      });
      return;
    }
  }

  draftId = draftId ?? randomUUID();

  try {
    await insertRegistrationDraft({
      id: draftId,
      stripeCheckoutSessionId: `ack_${draftId}`,
      feeHkd: fee,
      locale,
      payload: reg.data,
    });
  } catch (e) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? (e as { code: string }).code
        : "";
    if (code === "23505") {
      const existing = await getRegistrationDraftById(draftId);
      if (existing) {
        await updateRegistrationDraftSnapshot({
          id: draftId,
          feeHkd: fee,
          locale,
          payload: reg.data,
        });
        res.json({
          ok: true,
          draftId,
          reference: ackReferenceFromDraftId(draftId),
        });
        return;
      }
    }
    console.error(e);
    res.status(500).json({ error: "Could not save draft" });
    return;
  }

  res.json({
    ok: true,
    draftId,
    reference: ackReferenceFromDraftId(draftId),
  });
}

/** Proceed to payment: create/update ACK row, timeline, acknowledge email (idempotent). */
export async function postCommitForPayment(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const parsed = commitForPaymentBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const reg = apiRegistrationSchema.safeParse(parsed.data.registration);
  if (!reg.success) {
    res.status(400).json({
      error: "Invalid registration",
      issues: reg.error.flatten(),
    });
    return;
  }

  const draftId = parsed.data.draftId;
  const draft = await getRegistrationDraftById(draftId);
  if (!draft) {
    res.status(404).json({ error: "Draft not found" });
    return;
  }

  const locale = parsed.data.locale ?? draft.locale ?? null;
  const fee = await resolveFeesHkdForApi(reg.data.attendance, reg.data.audienceType);

  const logAckTimeline = async (ref: string) => {
    await logRegistrationStatusEvent({
      reference: ref,
      type: "registration",
      value: "acknowledged",
    });
    await logRegistrationStatusEvent({
      reference: ref,
      type: "payment",
      value: fee > 0 ? "pending" : "completed",
    });
  };

  const { reference, created } = await upsertRegistrationAfterAcknowledge({
    draftId,
    payload: reg.data,
    locale,
    feeHkd: fee,
  });

  if (created) {
    await logAckTimeline(reference);
  }

  if (created) {
    try {
      const appBase =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
        "https://registration.newtofuevents.com";
      const resumeUrl = `${appBase}/${locale ?? "en"}/register?step=pay&ref=${encodeURIComponent(
        draftId,
      )}`;
      await sendAcknowledgeEmail({
        reference,
        email: reg.data.email,
        amountHkd: fee,
        attendance: reg.data.attendance,
        payload: reg.data,
        resumeUrl,
        locale,
      });
    } catch (e) {
      console.error("[commit-for-payment] email send failed", e);
    }
  }

  res.json({ ok: true, draftId, reference });
}

const completeBodySchema = z.object({
  registration: z.unknown(),
  locale: z.string().max(32).optional(),
  reference: z.string().min(1).max(120),
  paymentMethod: z.enum(["demo", "bank_transfer", "no_payment"]),
  discountCode: z.string().max(512).optional(),
  skipAutomaticDiscount: z.boolean().optional(),
});

export async function postComplete(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const parsed = completeBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { reference, paymentMethod, locale } = parsed.data;

  if (reference.startsWith("PP-") || reference.startsWith("ST-")) {
    res.status(403).json({ error: "Invalid reference" });
    return;
  }

  const reg = apiRegistrationSchema.safeParse(parsed.data.registration);
  if (!reg.success) {
    res.status(400).json({
      error: "Invalid registration",
      issues: reg.error.flatten(),
    });
    return;
  }

  const baseFee = await resolveFeesHkdForApi(
    reg.data.attendance,
    reg.data.audienceType,
  );
  const resolved = await resolveDiscountForPayment(
    baseFee,
    parsed.data.discountCode,
    {
      allowAutomaticDiscount: !parsed.data.skipAutomaticDiscount,
    },
  );
  if (!resolved.ok) {
    res.status(400).json({ error: "Invalid or expired discount code" });
    return;
  }
  const finalFeeHkd = resolved.breakdown.finalFeeHkd;

  if (paymentMethod === "no_payment") {
    if (finalFeeHkd !== 0) {
      res.status(400).json({ error: "Payment method does not match fee" });
      return;
    }
  } else if (finalFeeHkd <= 0) {
    res.status(400).json({ error: "Invalid payment for zero-fee registration" });
    return;
  }

  const rowMethod: PaymentMethodRow = paymentMethod;

  const paymentStatus =
    paymentMethod === "bank_transfer" ? "pending_verification" : "completed";

  try {
    await upsertRegistrationOnComplete({
      reference,
      paymentMethod: rowMethod,
      stripeCheckoutSessionId: null,
      stripePaymentIntentId: null,
      feeHkd: finalFeeHkd,
      email: reg.data.email,
      locale: locale ?? null,
      payload: reg.data,
      paymentStatus,
      discountCode: resolved.normalized ?? null,
    });
  } catch (e) {
    const code =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code: unknown }).code === "string"
        ? (e as { code: string }).code
        : "";
    if (code === "23505") {
      res.status(409).json({ error: "Reference already used" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Could not save registration" });
    return;
  }

  try {
    await logRegistrationStatusEvent({
      reference,
      type: "payment",
      value: paymentStatus,
    });
  } catch (e) {
    const code =
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      typeof (e as { code: unknown }).code === "string"
        ? (e as { code: string }).code
        : "";
    if (code === "42P01") {
      console.warn(
        "[registration-status-events] table missing; skipping status log for",
        reference,
      );
    } else {
      console.error(e);
    }
  }

  const rowPayment =
    paymentMethod === "demo"
      ? "demo"
      : paymentMethod === "bank_transfer"
        ? "bank_transfer"
        : "no_payment";

  // Payment received email: Stripe/QFPay webhooks send this; bank transfer must not —
  // admin verifies the slip first (`postAdminBankVerify`), which enqueues `payment_confirmation`.
  if (paymentMethod !== "bank_transfer") {
    try {
      await sendPaymentConfirmationEmail({
        reference,
        email: reg.data.email,
        amountHkd: finalFeeHkd,
        attendance: reg.data.attendance,
        payload: reg.data,
        paymentMethod: rowPayment,
        locale: locale ?? null,
        discountCode: resolved.normalized ?? null,
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (
    resolved.normalized &&
    (paymentMethod === "demo" || paymentMethod === "bank_transfer")
  ) {
    for (const code of parseDiscountCodesFromRaw(resolved.normalized)) {
      const ok = await incrementDiscountCodeUse(code);
      if (!ok) {
        console.warn("[postComplete] discount increment skipped", code);
      }
    }
  }

  res.json({ ok: true });
}

function getS3() {
  const region =
    process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "ap-southeast-1";
  const bucket = resolveS3Bucket();
  if (!bucket) {
    throw new Error(
      "S3_BUCKET is not set (or legacy BANK_SLIP_BUCKET / EMAIL_ASSETS_S3_BUCKET)",
    );
  }
  const client = new S3Client({ region });
  return { client, bucket };
}

/** Multer puts file in req.file */
export async function postBankSlip(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const file = req.file;
  const reference = String((req.body as { reference?: string }).reference ?? "").trim();

  if (!reference) {
    res.status(400).json({ error: "Missing reference" });
    return;
  }
  if (!file) {
    res.status(400).json({ error: "Missing file" });
    return;
  }

  const fileName = file.originalname || "receipt";
  const fileBuf = file.buffer;
  const size = fileBuf.byteLength;

  let bucket: string;
  let client: S3Client;
  try {
    ({ client, bucket } = getS3());
  } catch (e) {
    res.status(503).json({
      error:
        e instanceof Error
          ? e.message
          : "S3 not configured (set S3_BUCKET)",
    });
    return;
  }

  const key = `bank-slips/${encodeURIComponent(
    reference,
  )}/${randomUUID()}-${encodeURIComponent(fileName)}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuf,
        ContentType: file.mimetype || "application/octet-stream",
      }),
    );
  } catch (e) {
    console.error("[bank-slip] S3 upload failed", e);
    const err = e as {
      Code?: string;
      name?: string;
      BucketName?: string;
      message?: string;
    };
    const msg = err.message ?? "";
    const isAccessDenied =
      err.Code === "AccessDenied" ||
      err.name === "AccessDenied" ||
      /access denied/i.test(msg);

    if (err.Code === "NoSuchBucket") {
      res.status(503).json({
        error:
          "S3_BUCKET does not exist in AWS. Create the bucket or update S3_BUCKET.",
        bucket: err.BucketName ?? bucket,
      });
      return;
    }

    if (isAccessDenied) {
      res.status(503).json({
        error:
          "S3 access denied: attach IAM policy allowing s3:PutObject on arn:aws:s3:::<bucket>/bank-slips/* for the same IAM user/role as ~/.aws (local) or instance profile (EC2). Ensure AWS_REGION matches the bucket region. See web/scripts/bank-slip-s3-iam-policy.json.",
        bucket,
        ...(process.env.NODE_ENV === "development" ? { debug: msg } : {}),
      });
      return;
    }

    res.status(500).json({
      error: "Failed to upload file to storage",
      ...(process.env.NODE_ENV === "development" && msg ? { debug: msg } : {}),
    });
    return;
  }

  try {
    await insertBankTransferSlip({
      registrationReference: reference,
      fileKey: key,
      fileName,
      fileSizeBytes: size,
    });
  } catch (e) {
    console.error("[bank-slip] database insert failed", e);
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({
      error:
        "File uploaded but could not save record. Check database migration 005.",
      ...(process.env.NODE_ENV === "development" ? { debug: msg } : {}),
    });
    return;
  }

  res.json({ ok: true });
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const thankYouSummaryQuerySchema = z.object({
  ref: z.string().min(1).max(160),
  email: z.string().email().max(320),
});

/** GET ?ref=ACK-…&email=… — payload only when email matches registration row (thank-you page). */
export async function getRegistrationThankYouSummary(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const parsed = thankYouSummaryQuerySchema.safeParse({
    ref: String(req.query.ref ?? "").trim(),
    email: String(req.query.email ?? "").trim(),
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid reference or email" });
    return;
  }

  const { ref, email } = parsed.data;
  if (UUID_RE.test(ref)) {
    res.status(400).json({ error: "Invalid reference" });
    return;
  }

  const row = await getRegistrationPayloadByReferenceAndEmail({
    reference: ref,
    email,
  });
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ payload: row.payload, registeredAt: row.registeredAt });
}

export async function getRegistrationDraft(req: Request, res: Response): Promise<void> {
  try {
    requireDatabaseUrl();
  } catch {
    res.status(503).json({ error: "Database is not configured" });
    return;
  }

  const id = String(req.params.id ?? "").trim();
  if (!id || !UUID_RE.test(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const draft = await getRegistrationDraftById(id);
  if (!draft) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    payload: draft.payload,
    locale: draft.locale,
    feeHkd: draft.fee_hkd,
    stripeCheckoutSessionId: draft.stripe_checkout_session_id,
    draftCreatedAt: draft.created_at.toISOString(),
  });
}
