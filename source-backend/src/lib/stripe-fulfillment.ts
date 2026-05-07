import Stripe from "stripe";
import { incrementDiscountCodeUse } from "@db/discount-codes";
import { parseDiscountCodesFromRaw } from "./discount-code.js";
import {
  deleteRegistrationDraft,
  findRegistrationByStripeCheckoutSessionId,
  finalizeAckRegistrationFromStripeSession,
  getRegistrationDraftById,
  insertRegistrationRow,
} from "@db/registrations";
import { requireDatabaseUrl } from "@db/postgres";
import { logRegistrationStatusEvent } from "@db/status-events";
import { sendPaymentConfirmationEmail } from "./email/send-payment-confirmation";
import { enqueuePaymentSuccessNotification } from "./notification-queue";
import { resolveStripeSecretKey } from "./stripe-secret";

function getStripe(): Stripe {
  const key = resolveStripeSecretKey();
  if (!key) {
    throw new Error(
      "Stripe secret key is not set (STRIPE_PRODUCTION_SECRET_KEY when live, or STRIPE_SECRET_KEY_* / STRIPE_SECRET_KEY)",
    );
  }
  return new Stripe(key);
}

function pgUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}

export type FulfillStripeResult =
  | { ok: true; reference: string; email: string }
  | { ok: false; error: string };

/**
 * Idempotent: creates registration from paid Checkout Session + draft metadata.
 */
export async function fulfillStripeCheckoutSession(
  sessionId: string,
): Promise<FulfillStripeResult> {
  try {
    requireDatabaseUrl();
  } catch {
    return { ok: false, error: "Database is not configured" };
  }

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return { ok: false, error: "Stripe is not configured" };
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });
  } catch {
    return { ok: false, error: "Could not load payment session" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment is not complete" };
  }

  const existing = await findRegistrationByStripeCheckoutSessionId(sessionId);
  if (existing) {
    return {
      ok: true,
      reference: existing.reference,
      email: existing.email,
    };
  }

  const draftId = session.metadata?.draft_id;
  if (!draftId?.trim()) {
    return { ok: false, error: "Invalid session metadata" };
  }

  const draft = await getRegistrationDraftById(draftId);
  if (!draft) {
    return { ok: false, error: "Registration draft not found or expired" };
  }

  if (draft.stripe_checkout_session_id !== sessionId) {
    return { ok: false, error: "Session does not match registration" };
  }

  const feeHkd = Number.parseFloat(draft.fee_hkd);
  if (!Number.isFinite(feeHkd) || feeHkd <= 0) {
    return { ok: false, error: "Invalid fee" };
  }

  const amountTotal = session.amount_total;
  if (amountTotal == null) {
    return { ok: false, error: "Missing payment amount" };
  }

  const expectedCents = Math.round(feeHkd * 100);
  if (amountTotal !== expectedCents) {
    return { ok: false, error: "Amount mismatch" };
  }

  const pi = session.payment_intent;
  let piId: string | null = null;
  if (typeof pi === "string") {
    piId = pi;
  } else if (pi && typeof pi === "object" && "id" in pi) {
    piId = (pi as Stripe.PaymentIntent).id;
  }

  const email =
    session.customer_details?.email?.trim() || draft.payload.email.trim();

  const amountPaidHkd = (amountTotal / 100).toFixed(2);
  const ackDone = await finalizeAckRegistrationFromStripeSession({
    draftId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: piId,
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
        reason: "stripe_checkout.session.completed",
      });
    } catch (e) {
      console.error("[stripe-fulfillment] status event", e);
    }
  } else {
    const stRef = `ST-${session.id}`;
    try {
      await insertRegistrationRow({
        reference: stRef,
        paymentMethod: "stripe",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: piId,
        feeHkd,
        email,
        locale: draft.locale,
        payload: draft.payload,
        discountCode: draft.discount_code?.trim() || null,
      });
    } catch (e) {
      if (pgUniqueViolation(e)) {
        const again = await findRegistrationByStripeCheckoutSessionId(sessionId);
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
        reason: "stripe_checkout.legacy_row",
      });
    } catch (e) {
      console.error("[stripe-fulfillment] status event", e);
    }
    reference = stRef;
    outEmail = email;
  }

  if (draft.discount_code?.trim()) {
    for (const code of parseDiscountCodesFromRaw(draft.discount_code)) {
      const ok = await incrementDiscountCodeUse(code);
      if (!ok) {
        console.warn(
          "[stripe-fulfillment] discount increment skipped",
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
      paymentMethod: "stripe",
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
      stripeSessionId: session.id,
    });
  } catch (e) {
    console.error(e);
  }
  return { ok: true, reference, email: outEmail };
}
