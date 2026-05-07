import { incrementDiscountCodeUse } from "@db/discount-codes";
import { parseDiscountCodesFromRaw } from "./discount-code.js";
import {
  deleteRegistrationDraft,
  findRegistrationByPaymentAsiaRequestReference,
  finalizeAckRegistrationFromPaymentAsia,
  getDraftIdForPaymentAsiaMerchantRef,
  getRegistrationDraftById,
  insertRegistrationRow,
} from "@db/registrations";
import { requireDatabaseUrl } from "@db/postgres";
import { logRegistrationStatusEvent } from "@db/status-events";
import { sendPaymentConfirmationEmail } from "./email/send-payment-confirmation";
import { enqueuePaymentSuccessNotification } from "./notification-queue";

function pgUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}

function amountsMatch(expectedHkd: string, received: string): boolean {
  const a = Number.parseFloat(expectedHkd);
  const b = Number.parseFloat(received);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < 0.005;
}

export type PaymentAsiaNotifyFields = {
  merchant_reference?: string;
  request_reference?: string;
  currency?: string;
  amount?: string;
  status?: string;
  sign?: string;
};

export type FulfillPaymentAsiaResult =
  | { ok: true; reference: string; email: string }
  | { ok: false; error: string };

/**
 * Completes registration after PaymentAsia data-feed (status = accepted).
 */
export async function fulfillPaymentAsiaNotification(
  fields: Record<string, string>,
): Promise<FulfillPaymentAsiaResult> {
  try {
    requireDatabaseUrl();
  } catch {
    return { ok: false, error: "Database is not configured" };
  }

  const merchantRef = fields.merchant_reference?.trim();
  const requestRef = fields.request_reference?.trim();
  const status = fields.status?.trim();
  const currency = fields.currency?.trim().toUpperCase();
  const amount = fields.amount?.trim();

  if (status !== "1") {
    return { ok: false, error: "Not a success notification" };
  }
  if (!merchantRef || !requestRef || !amount || currency !== "HKD") {
    return { ok: false, error: "Missing payment fields" };
  }

  const existing = await findRegistrationByPaymentAsiaRequestReference(
    requestRef,
  );
  if (existing) {
    return {
      ok: true,
      reference: existing.reference,
      email: existing.email,
    };
  }

  let draftId = await getDraftIdForPaymentAsiaMerchantRef(merchantRef);
  if (
    !draftId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      merchantRef,
    )
  ) {
    const legacyDraft = await getRegistrationDraftById(merchantRef);
    if (legacyDraft) draftId = merchantRef;
  }
  if (!draftId) {
    return { ok: false, error: "Unknown merchant_reference" };
  }

  const draft = await getRegistrationDraftById(draftId);
  if (!draft) {
    return { ok: false, error: "Registration draft not found or expired" };
  }

  const feeHkd = Number.parseFloat(draft.fee_hkd);
  if (!Number.isFinite(feeHkd) || feeHkd <= 0) {
    return { ok: false, error: "Invalid fee" };
  }

  const expectedAmount = draft.fee_hkd.trim();
  if (!amountsMatch(expectedAmount, amount)) {
    return { ok: false, error: "Amount mismatch" };
  }

  const email = draft.payload.email?.trim() || "";
  if (!email) {
    return { ok: false, error: "Missing email on draft" };
  }

  const amountPaidHkd = Number.parseFloat(amount).toFixed(2);
  const ackDone = await finalizeAckRegistrationFromPaymentAsia({
    draftId,
    requestReference: requestRef,
    email,
    amountPaidHkd,
    discountCode: draft.discount_code?.trim() || null,
  });

  let reference: string;
  let outEmail: string;

  if (ackDone.updated) {
    reference = ackDone.reference;
    outEmail = ackDone.email;
    await deleteRegistrationDraft(draftId);
    try {
      await logRegistrationStatusEvent({
        reference,
        type: "payment",
        value: "completed",
        reason: "paymentasia.notify",
      });
    } catch (e) {
      console.error("[paymentasia-fulfillment] status event", e);
    }
  } else {
    const stRef = `ST-PA-${requestRef}`;
    try {
      await insertRegistrationRow({
        reference: stRef,
        paymentMethod: "paymentasia",
        stripeCheckoutSessionId: null,
        stripePaymentIntentId: null,
        feeHkd,
        email,
        locale: draft.locale,
        payload: draft.payload,
        discountCode: draft.discount_code?.trim() || null,
        paymentasiaRequestReference: requestRef,
      });
    } catch (e) {
      if (pgUniqueViolation(e)) {
        const again = await findRegistrationByPaymentAsiaRequestReference(
          requestRef,
        );
        if (again) {
          return {
            ok: true,
            reference: again.reference,
            email: again.email,
          };
        }
      }
      console.error(e);
      return { ok: false, error: "Could not save registration" };
    }
    await deleteRegistrationDraft(draftId);
    try {
      await logRegistrationStatusEvent({
        reference: stRef,
        type: "payment",
        value: "completed",
        reason: "paymentasia.legacy_row",
      });
    } catch (e) {
      console.error("[paymentasia-fulfillment] status event", e);
    }
    reference = stRef;
    outEmail = email;
  }

  if (draft.discount_code?.trim()) {
    for (const code of parseDiscountCodesFromRaw(draft.discount_code)) {
      const ok = await incrementDiscountCodeUse(code);
      if (!ok) {
        console.warn(
          "[paymentasia-fulfillment] discount increment skipped",
          code,
          draft.discount_code,
        );
      }
    }
  }

  try {
    await sendPaymentConfirmationEmail({
      reference,
      email: outEmail,
      amountHkd: feeHkd,
      attendance: draft.payload.attendance,
      payload: draft.payload,
      paymentMethod: "paymentasia",
      locale: draft.locale,
      discountCode: draft.discount_code?.trim() || null,
    });
  } catch (e) {
    console.error(e);
  }
  try {
    await enqueuePaymentSuccessNotification({
      reference,
      email: outEmail,
      amountHkd: feeHkd,
      attendance: draft.payload.attendance,
      locale: draft.locale,
      stripeSessionId: `paymentasia:${requestRef}`,
    });
  } catch (e) {
    console.error(e);
  }

  return { ok: true, reference, email: outEmail };
}
