import type { RegistrationFormValues } from "../lib/registration-schema.ts";
import {
  inferDietaryYesNo,
  migrateRegistrationDietaryPayload,
  normalizeFormText,
} from "../lib/registration-schema.ts";
import { logRegistrationStatusEvent } from "@db/status-events";
import { ackReferenceFromDraftId } from "../lib/registration-reference";
import { getSql } from "@db/postgres";
import { initialPipelineStage } from "@db/pipeline-stage";

export { ackReferenceFromDraftId } from "../lib/registration-reference";

/**
 * Draft UUID for `?ref=` resume links. `ACK-XXXXXXXX` is the first 8 hex chars of the draft id
 * (`ackReferenceFromDraftId`). Returns null if no matching draft (e.g. deleted).
 */
export async function getDraftIdForAckReference(
  reference: string,
): Promise<string | null> {
  const m = /^ACK-([0-9A-Fa-f]{8})$/i.exec(reference.trim());
  if (!m) return null;
  const prefix = m[1]!.toLowerCase();
  const sql = getSql();
  const pattern = `${prefix}%`;
  const rows = await sql`
    SELECT id::text AS id
    FROM registration_drafts
    WHERE lower(replace(id::text, '-', '')) LIKE ${pattern}
    LIMIT 1
  `;
  const row = rows[0] as { id: string } | undefined;
  return row?.id ?? null;
}

/** JSONB đôi khi trả về object hoặc chuỗi (dữ liệu cũ / encode khác driver). */
function parseRegistrationPayload(raw: unknown): RegistrationFormValues {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return {
      audienceType: "members",
      ...(raw as RegistrationFormValues),
    };
  }
  if (typeof raw === "string") {
    return {
      audienceType: "members",
      ...(JSON.parse(raw) as RegistrationFormValues),
    };
  }
  throw new Error("registration payload is not a valid object or JSON string");
}

/** Public thank-you page: return stored payload only when email matches (no auth). */
export async function getRegistrationPayloadByReferenceAndEmail(input: {
  reference: string;
  email: string;
}): Promise<{ payload: RegistrationFormValues; registeredAt: string } | null> {
  const ref = input.reference.trim();
  const em = input.email.trim().toLowerCase();
  if (!ref || !em || ref.length > 160 || em.length > 320) return null;
  const sql = getSql();
  const rows = await sql`
    SELECT payload, created_at
    FROM registrations
    WHERE reference = ${ref} AND lower(trim(email)) = ${em}
    LIMIT 1
  `;
  const row = rows[0] as
    | { payload: unknown; created_at: Date | string }
    | undefined;
  if (!row) return null;
  try {
    const payload = parseRegistrationPayload(row.payload);
    const rawCreated = row.created_at;
    const createdDate =
      rawCreated instanceof Date ? rawCreated : new Date(String(rawCreated));
    return { payload, registeredAt: createdDate.toISOString() };
  } catch {
    return null;
  }
}

function jurisdictionFromPayload(p: RegistrationFormValues): string | null {
  const j = p.jurisdiction?.trim();
  if (j) return j;
  const c = p.country?.trim();
  return c || null;
}

function memberDelegateRoleFromPayload(p: RegistrationFormValues): string | null {
  if (p.audienceType !== "members") return null;
  const r = p.memberDelegateRole;
  return r ? r : null;
}

export type PaymentMethodRow =
  | "stripe"
  | "demo"
  | "bank_transfer"
  | "no_payment"
  /** Alipay / WeChat via PaymentAsia hosted page (PA-SYS) */
  | "paymentasia"
  /** Ack row created after Proceed to payment; user has not completed Stripe or bank yet */
  | "pending";

export async function insertRegistrationDraft(input: {
  id: string;
  stripeCheckoutSessionId: string;
  feeHkd: number;
  locale: string | null;
  payload: RegistrationFormValues;
  /** Normalized uppercase discount code, or null */
  discountCode?: string | null;
}): Promise<void> {
  const sql = getSql();
  const feeStr = input.feeHkd.toFixed(2);
  const disc = input.discountCode?.trim() || null;
  const jurisdiction = jurisdictionFromPayload(input.payload);
  const memberRole = memberDelegateRoleFromPayload(input.payload);
  await sql`
    INSERT INTO registration_drafts (
      id,
      stripe_checkout_session_id,
      fee_hkd,
      locale,
      payload,
      audience_type,
      discount_code,
      jurisdiction,
      member_delegate_role
    )
    VALUES (
      ${input.id},
      ${input.stripeCheckoutSessionId},
      ${feeStr},
      ${input.locale},
      ${sql.json(input.payload)},
      ${input.payload.audienceType},
      ${disc},
      ${jurisdiction},
      ${memberRole}
    )
  `;
}

export async function getRegistrationDraftById(
  id: string,
): Promise<{
  id: string;
  stripe_checkout_session_id: string;
  fee_hkd: string;
  locale: string | null;
  payload: RegistrationFormValues;
  discount_code: string | null;
  created_at: Date;
} | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, stripe_checkout_session_id, fee_hkd::text, locale, payload, discount_code, created_at
    FROM registration_drafts
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows[0] as
    | {
        id: string;
        stripe_checkout_session_id: string;
        fee_hkd: string;
        locale: string | null;
        payload: unknown;
        discount_code: string | null;
        created_at: Date;
      }
    | undefined;
  if (!row) return null;
  return {
    id: row.id,
    stripe_checkout_session_id: row.stripe_checkout_session_id,
    fee_hkd: row.fee_hkd,
    locale: row.locale,
    payload: parseRegistrationPayload(row.payload),
    discount_code: row.discount_code,
    created_at: row.created_at,
  };
}

export async function deleteRegistrationDraft(id: string): Promise<void> {
  const sql = getSql();
  await sql`DELETE FROM registration_drafts WHERE id = ${id}`;
}

/** One row per PaymentAsia payment attempt; `merchant_reference` must be unique (PA-SYS). */
export async function insertPaymentAsiaMerchantRef(input: {
  merchantReference: string;
  draftId: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO paymentasia_merchant_refs (merchant_reference, draft_id)
    VALUES (${input.merchantReference}, ${input.draftId})
  `;
}

export async function getDraftIdForPaymentAsiaMerchantRef(
  merchantReference: string,
): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT draft_id::text AS draft_id
    FROM paymentasia_merchant_refs
    WHERE merchant_reference = ${merchantReference}
    LIMIT 1
  `;
  const row = rows[0] as { draft_id: string } | undefined;
  return row?.draft_id ?? null;
}

/** Overwrites draft snapshot after validation (Continue to Review / back from Review). */
export async function updateRegistrationDraftSnapshot(input: {
  id: string;
  feeHkd: number;
  locale: string | null;
  payload: RegistrationFormValues;
}): Promise<void> {
  const sql = getSql();
  const feeStr = input.feeHkd.toFixed(2);
  const jurisdiction = jurisdictionFromPayload(input.payload);
  const memberRole = memberDelegateRoleFromPayload(input.payload);
  await sql`
    UPDATE registration_drafts
    SET
      fee_hkd = ${feeStr},
      locale = ${input.locale},
      payload = ${sql.json(input.payload)},
      audience_type = ${input.payload.audienceType},
      jurisdiction = ${jurisdiction},
      member_delegate_role = ${memberRole}
    WHERE id = ${input.id}
  `;
}

export async function updateRegistrationDraftCheckoutSession(
  id: string,
  stripeCheckoutSessionId: string,
  /** When set, updates snapshot discount code for fulfillment counting */
  discountCode?: string | null,
): Promise<void> {
  const sql = getSql();
  const disc = discountCode === undefined ? undefined : discountCode?.trim() || null;
  if (disc === undefined) {
    await sql`
      UPDATE registration_drafts
      SET stripe_checkout_session_id = ${stripeCheckoutSessionId}
      WHERE id = ${id}
    `;
    return;
  }
  await sql`
    UPDATE registration_drafts
    SET
      stripe_checkout_session_id = ${stripeCheckoutSessionId},
      discount_code = ${disc}
    WHERE id = ${id}
  `;
}

export async function insertRegistrationRow(input: {
  reference: string;
  paymentMethod: PaymentMethodRow;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  feeHkd: number;
  email: string;
  locale: string | null;
  payload: RegistrationFormValues;
  paymentStatus?: string | null;
  /** Normalized promo string (e.g. comma-separated); optional audit */
  discountCode?: string | null;
  paymentasiaRequestReference?: string | null;
}): Promise<void> {
  const sql = getSql();
  const feeStr = input.feeHkd.toFixed(2);
  const payStatus = input.paymentStatus ?? "completed";
  const paidLike =
    payStatus === "completed" || payStatus === "verified";
  const disc = input.discountCode?.trim() || null;
  const paRef = input.paymentasiaRequestReference?.trim() || null;
  const stage = initialPipelineStage(payStatus, input.paymentMethod);
  const jurisdiction = jurisdictionFromPayload(input.payload);
  const memberRole = memberDelegateRoleFromPayload(input.payload);
  await sql`
    INSERT INTO registrations (
      reference,
      payment_method,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      fee_hkd,
      email,
      locale,
      payload,
      audience_type,
      payment_status,
      invoiced_amount_hkd,
      amount_paid_hkd,
      discount_code,
      qfpay_syssn,
      paymentasia_request_reference,
      pipeline_stage,
      jurisdiction,
      member_delegate_role
    )
    VALUES (
      ${input.reference},
      ${input.paymentMethod},
      ${input.stripeCheckoutSessionId},
      ${input.stripePaymentIntentId},
      ${feeStr},
      ${input.email},
      ${input.locale},
      ${sql.json(input.payload)},
      ${input.payload.audienceType},
      ${payStatus},
      ${feeStr},
      ${paidLike ? feeStr : null},
      ${disc},
      ${null},
      ${paRef},
      ${stage},
      ${jurisdiction},
      ${memberRole}
    )
  `;
}

export async function findRegistrationByStripeCheckoutSessionId(
  sessionId: string,
): Promise<{ reference: string; email: string } | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT reference, email
    FROM registrations
    WHERE stripe_checkout_session_id = ${sessionId}
    LIMIT 1
  `;
  const r = rows[0] as { reference: string; email: string } | undefined;
  return r ?? null;
}

export async function findRegistrationByPaymentAsiaRequestReference(
  requestReference: string,
): Promise<{ reference: string; email: string } | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT reference, email
    FROM registrations
    WHERE paymentasia_request_reference = ${requestReference}
    LIMIT 1
  `;
  const r = rows[0] as { reference: string; email: string } | undefined;
  return r ?? null;
}

export async function markRegistrationWebhookVerifiedByCheckoutSession(
  checkoutSessionId: string,
): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    UPDATE registrations
    SET webhook_verified_at = COALESCE(webhook_verified_at, now())
    WHERE stripe_checkout_session_id = ${checkoutSessionId}
    RETURNING id
  `;
  return rows.length;
}

/** Snapshot for admin pipeline timeline (same DB as app registrations). */
export async function getRegistrationStatusForPipeline(reference: string): Promise<{
  created_at: string;
  payment_method: string;
  payment_status: string;
  approval_status: string;
  webhook_verified_at: string | null;
} | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      r.created_at::text AS created_at,
      r.payment_method::text AS payment_method,
      r.payment_status::text AS payment_status,
      COALESCE(r.approval_status, 'pending')::text AS approval_status,
      r.webhook_verified_at::text AS webhook_verified_at
    FROM registrations r
    WHERE r.reference = ${reference}
    LIMIT 1
  `;
  const row = rows[0] as
    | {
        created_at: string;
        payment_method: string;
        payment_status: string;
        approval_status: string;
        webhook_verified_at: string | null;
      }
    | undefined;
  return row ?? null;
}

export async function getRegistrationByReference(
  reference: string,
): Promise<{
  reference: string;
  payment_status: string;
  payment_method: string;
  email: string;
  discount_code: string | null;
} | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT
      reference,
      payment_status::text,
      payment_method::text,
      email,
      discount_code
    FROM registrations
    WHERE reference = ${reference}
    LIMIT 1
  `;
  const r = rows[0] as
    | {
        reference: string;
        payment_status: string;
        payment_method: string;
        email: string;
        discount_code: string | null;
      }
    | undefined;
  return r ?? null;
}

/**
 * Sau khi người dùng bấm Proceed to payment (`commit-for-payment`): một dòng `registrations` ACK-*;
 * fee &gt; 0 → payment pending; fee 0 → no_payment + completed.
 */
export async function upsertRegistrationAfterAcknowledge(input: {
  draftId: string;
  payload: RegistrationFormValues;
  locale: string | null;
  feeHkd: number;
}): Promise<{ reference: string; created: boolean }> {
  const reference = ackReferenceFromDraftId(input.draftId);
  const sql = getSql();
  const feeStr = input.feeHkd.toFixed(2);
  const existing = await getRegistrationByReference(reference);
  const jurisdiction = jurisdictionFromPayload(input.payload);
  const memberRole = memberDelegateRoleFromPayload(input.payload);
  if (existing) {
    if (existing.payment_status === "pending") {
      await sql`
        UPDATE registrations
        SET
          payload = ${sql.json(input.payload)},
          email = ${input.payload.email},
          locale = ${input.locale},
          fee_hkd = ${feeStr},
          invoiced_amount_hkd = ${feeStr},
          audience_type = ${input.payload.audienceType},
          jurisdiction = ${jurisdiction},
          member_delegate_role = ${memberRole}
        WHERE reference = ${reference}
      `;
    }
    return { reference, created: false };
  }
  if (input.feeHkd <= 0) {
    await sql`
      INSERT INTO registrations (
        reference,
        payment_method,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        fee_hkd,
        email,
        locale,
        payload,
        audience_type,
        payment_status,
        invoiced_amount_hkd,
        amount_paid_hkd,
        pipeline_stage,
        jurisdiction,
        member_delegate_role
      )
      VALUES (
        ${reference},
        ${"no_payment"},
        ${null},
        ${null},
        ${feeStr},
        ${input.payload.email},
        ${input.locale},
        ${sql.json(input.payload)},
        ${input.payload.audienceType},
        ${"completed"},
        ${feeStr},
        ${feeStr},
        ${initialPipelineStage("completed", "no_payment")},
        ${jurisdiction},
        ${memberRole}
      )
    `;
  } else {
    await sql`
      INSERT INTO registrations (
        reference,
        payment_method,
        stripe_checkout_session_id,
        stripe_payment_intent_id,
        fee_hkd,
        email,
        locale,
        payload,
        audience_type,
        payment_status,
        invoiced_amount_hkd,
        amount_paid_hkd,
        pipeline_stage,
        jurisdiction,
        member_delegate_role
      )
      VALUES (
        ${reference},
        ${"pending"},
        ${null},
        ${null},
        ${feeStr},
        ${input.payload.email},
        ${input.locale},
        ${sql.json(input.payload)},
        ${input.payload.audienceType},
        ${"pending"},
        ${feeStr},
        ${null},
        ${initialPipelineStage("pending", "pending")},
        ${jurisdiction},
        ${memberRole}
      )
    `;
  }
  return { reference, created: true };
}

/** Stripe Checkout paid: ghi nhận thanh toán lên dòng ACK-* (không tạo ST-*). */
export async function finalizeAckRegistrationFromStripeSession(input: {
  draftId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  email: string;
  /** Stripe Checkout `amount_total` / 100 (HKD), two decimal places */
  amountPaidHkd: string;
  discountCode?: string | null;
}): Promise<{ reference: string; email: string; updated: boolean }> {
  const reference = ackReferenceFromDraftId(input.draftId);
  const sql = getSql();
  const disc = input.discountCode?.trim() || null;
  const rows = await sql`
    UPDATE registrations
    SET
      stripe_checkout_session_id = ${input.stripeCheckoutSessionId},
      stripe_payment_intent_id = ${input.stripePaymentIntentId},
      payment_status = ${"completed"},
      payment_method = ${"stripe"},
      email = ${input.email},
      webhook_verified_at = COALESCE(webhook_verified_at, now()),
      amount_paid_hkd = ${input.amountPaidHkd},
      invoiced_amount_hkd = COALESCE(invoiced_amount_hkd, fee_hkd),
      discount_code = COALESCE(${disc}, discount_code)
    WHERE reference = ${reference}
    RETURNING reference, email
  `;
  const row = rows[0] as { reference: string; email: string } | undefined;
  if (row) {
    return { reference: row.reference, email: row.email, updated: true };
  }
  return { reference, email: input.email, updated: false };
}

/** PaymentAsia data-feed: mark ACK row paid (Alipay / WeChat via PA-SYS). */
export async function finalizeAckRegistrationFromPaymentAsia(input: {
  draftId: string;
  requestReference: string;
  email: string;
  amountPaidHkd: string;
  discountCode?: string | null;
}): Promise<{ reference: string; email: string; updated: boolean }> {
  const reference = ackReferenceFromDraftId(input.draftId);
  const sql = getSql();
  const disc = input.discountCode?.trim() || null;
  const rows = await sql`
    UPDATE registrations
    SET
      paymentasia_request_reference = ${input.requestReference},
      stripe_checkout_session_id = ${null},
      stripe_payment_intent_id = ${null},
      qfpay_syssn = ${null},
      payment_status = ${"completed"},
      payment_method = ${"paymentasia"},
      email = ${input.email},
      webhook_verified_at = COALESCE(webhook_verified_at, now()),
      amount_paid_hkd = ${input.amountPaidHkd},
      invoiced_amount_hkd = COALESCE(invoiced_amount_hkd, fee_hkd),
      discount_code = COALESCE(${disc}, discount_code)
    WHERE reference = ${reference}
    RETURNING reference, email
  `;
  const row = rows[0] as { reference: string; email: string } | undefined;
  if (row) {
    return { reference: row.reference, email: row.email, updated: true };
  }
  return { reference, email: input.email, updated: false };
}

/** postComplete: đã có dòng ACK (acknowledge) thì UPDATE thay vì INSERT trùng. */
export async function upsertRegistrationOnComplete(input: {
  reference: string;
  paymentMethod: PaymentMethodRow;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  feeHkd: number;
  email: string;
  locale: string | null;
  payload: RegistrationFormValues;
  paymentStatus: string;
  discountCode?: string | null;
}): Promise<void> {
  const existing = await getRegistrationByReference(input.reference);
  const sql = getSql();
  const feeStr = input.feeHkd.toFixed(2);
  const disc = input.discountCode?.trim() || null;
  if (existing) {
    const amountPaidStr =
      input.paymentStatus === "completed" || input.paymentStatus === "verified"
        ? feeStr
        : null;
    await sql`
      UPDATE registrations
      SET
        payment_method = ${input.paymentMethod},
        stripe_checkout_session_id = ${input.stripeCheckoutSessionId},
        stripe_payment_intent_id = ${input.stripePaymentIntentId},
        fee_hkd = ${feeStr},
        email = ${input.email},
        locale = ${input.locale},
        payload = ${sql.json(input.payload)},
        audience_type = ${input.payload.audienceType},
        payment_status = ${input.paymentStatus},
        invoiced_amount_hkd = ${feeStr},
        amount_paid_hkd = ${amountPaidStr},
        discount_code = ${disc}
      WHERE reference = ${input.reference}
    `;
    return;
  }
  await insertRegistrationRow({
    reference: input.reference,
    paymentMethod: input.paymentMethod,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
    feeHkd: input.feeHkd,
    email: input.email,
    locale: input.locale,
    payload: input.payload,
    paymentStatus: input.paymentStatus,
    discountCode: disc,
  });
}

/** Subset of `RegistrationFormValues` updated from CRM “Registrant Information” admin form. */
export type AdminRegistrantInfoFieldPatch = {
  title: string;
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  email: string;
  phoneCountry: string;
  phoneNumber: string;
  country: string;
  attendance: RegistrationFormValues["attendance"];
  sameContact: boolean;
  contactTitle: string;
  contactFirstName: string;
  contactLastName: string;
  contactCompany: string;
  contactJobTitle: string;
  contactEmail: string;
  contactPhoneCountry: string;
  contactPhoneNumber: string;
  dietaryYesNo: RegistrationFormValues["dietaryYesNo"];
  dietary?: RegistrationFormValues["dietary"];
  dietaryOtherDetails: string;
  cpdApply: "yes" | "no";
  consent: boolean;
};

function validateMergedRegistrantInfoForAdmin(d: RegistrationFormValues): string | null {
  const email = normalizeFormText(d.email);
  if (!email) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid registrant email";
  if (!normalizeFormText(d.firstName)) return "First name is required";
  if (!normalizeFormText(d.lastName)) return "Last name is required";
  if (!d.sameContact) {
    if (!normalizeFormText(d.contactFirstName)) {
      return "Contact first name is required when contact person differs";
    }
    if (!normalizeFormText(d.contactLastName)) {
      return "Contact last name is required when contact person differs";
    }
    const ce = normalizeFormText(d.contactEmail);
    if (ce && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ce)) {
      return "Invalid contact person email";
    }
  }
  const yn = inferDietaryYesNo(d);
  if (yn === "yes") {
    if (!d.dietary) return "Select a dietary preference";
    if (
      d.dietary === "other" &&
      normalizeFormText(d.dietaryOtherDetails) === ""
    ) {
      return "Specify dietary details for Other";
    }
  }
  return null;
}

/**
 * Admin CRM: merge registrant-info form into stored payload; sync `email`, `jurisdiction`,
 * `member_delegate_role`.
 */
export async function adminUpdateRegistrantInfoFields(
  reference: string,
  fields: AdminRegistrantInfoFieldPatch,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const sql = getSql();
  const rows = await sql`
    SELECT payload
    FROM registrations
    WHERE reference = ${reference}
    LIMIT 1
  `;
  const rawPayload = (rows[0] as { payload: unknown } | undefined)?.payload;
  if (rawPayload === undefined) {
    return { ok: false, error: "Not found", status: 404 };
  }

  const existing = parseRegistrationPayload(rawPayload);
  const overlay: Partial<RegistrationFormValues> = {
    title: fields.title,
    firstName: fields.firstName,
    lastName: fields.lastName,
    company: fields.company,
    jobTitle: fields.jobTitle,
    email: fields.email,
    phoneCountry: fields.phoneCountry,
    phoneNumber: fields.phoneNumber,
    country: fields.country,
    attendance: fields.attendance,
    sameContact: fields.sameContact,
    contactTitle: fields.contactTitle,
    contactFirstName: fields.contactFirstName,
    contactLastName: fields.contactLastName,
    contactCompany: fields.contactCompany,
    contactJobTitle: fields.contactJobTitle,
    contactEmail: fields.contactEmail,
    contactPhoneCountry: fields.contactPhoneCountry,
    contactPhoneNumber: fields.contactPhoneNumber,
    dietaryOtherDetails: fields.dietaryOtherDetails,
    cpdApply: fields.cpdApply,
    consent: fields.consent,
  };
  overlay.dietaryYesNo = fields.dietaryYesNo;
  if (fields.dietaryYesNo === "no") {
    overlay.dietary = undefined;
  } else {
    overlay.dietary = fields.dietary;
  }

  const mergedRaw = { ...existing, ...overlay };
  const migrated = migrateRegistrationDietaryPayload(mergedRaw);
  const merged = parseRegistrationPayload(migrated);

  const validationError = validateMergedRegistrantInfoForAdmin(merged);
  if (validationError) {
    return { ok: false, error: validationError, status: 400 };
  }

  const jurisdiction = jurisdictionFromPayload(merged);
  const memberRole = memberDelegateRoleFromPayload(merged);
  const emailRow = normalizeFormText(merged.email);

  const result = await sql`
    UPDATE registrations
    SET
      payload = ${sql.json(merged)},
      email = ${emailRow},
      jurisdiction = ${jurisdiction},
      member_delegate_role = ${memberRole}
    WHERE reference = ${reference}
  `;

  if (!result.count) {
    return { ok: false, error: "Not found", status: 404 };
  }

  try {
    await logRegistrationStatusEvent({
      reference,
      type: "registration",
      value: "admin_registrant_info_updated",
      reason: null,
    });
  } catch (e) {
    console.error("[adminUpdateRegistrantInfoFields] status event", e);
  }

  return { ok: true };
}
