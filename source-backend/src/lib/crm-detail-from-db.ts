import type {
  CrmPaymentStatus,
  PaymentMethodCrm,
  RegistrationDetailResponse,
} from "../../../web/src/types/crm.ts";
import { getSql, requireDatabaseUrl } from "@db/postgres";

function parsePayload(raw: unknown): Record<string, unknown> {
  if (raw !== null && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as unknown;
      if (o !== null && typeof o === "object" && !Array.isArray(o)) {
        return o as Record<string, unknown>;
      }
    } catch {
      /* fall through */
    }
  }
  return {};
}

function deriveCrmPaymentStatus(row: {
  payment_method: string;
  payment_status: string;
  fee_hkd: string;
  webhook_verified_at: string | null;
}): CrmPaymentStatus {
  const fee = Number.parseFloat(row.fee_hkd);
  if (row.payment_method === "no_payment" || (!Number.isNaN(fee) && fee <= 0)) {
    return "no_charge";
  }
  if (row.payment_method === "demo") {
    return "demo_completed";
  }
  if (row.payment_method === "pending") {
    return "pending_stripe";
  }
  const paid =
    row.payment_status === "verified" ||
    row.payment_status === "completed" ||
    Boolean(row.webhook_verified_at?.trim());

  if (row.payment_method === "stripe") {
    if (paid) return "paid_verified";
    return "pending_stripe";
  }
  if (row.payment_method === "bank_transfer") {
    if (paid) return "paid_verified";
    return "pending_bank_transfer";
  }
  if (paid) return "paid_verified";
  return "pending_stripe";
}

/**
 * CRM detail shape sourced from `registrations` (Postgres).
 */
export async function getRegistrationDetailFromDatabase(
  reference: string,
): Promise<RegistrationDetailResponse | null> {
  requireDatabaseUrl();
  const sql = getSql();
  const rows = await sql`
    SELECT
      r.id::text AS id,
      r.created_at::text AS created_at,
      r.reference,
      r.email,
      r.locale,
      r.payment_method::text AS payment_method,
      r.payment_status::text AS payment_status,
      r.stripe_checkout_session_id,
      r.stripe_payment_intent_id,
      r.webhook_verified_at::text AS webhook_verified_at,
      r.approved_at::text AS approved_at,
      r.fee_hkd::text AS fee_hkd,
      r.invoiced_amount_hkd::text AS invoiced_amount_hkd,
      r.amount_paid_hkd::text AS amount_paid_hkd,
      r.payload
    FROM registrations r
    WHERE r.reference = ${reference}
    LIMIT 1
  `;
  const row = rows[0] as
    | {
        id: string;
        created_at: string;
        reference: string;
        email: string;
        locale: string | null;
        payment_method: string;
        payment_status: string;
        stripe_checkout_session_id: string | null;
        stripe_payment_intent_id: string | null;
        webhook_verified_at: string | null;
        approved_at: string | null;
        fee_hkd: string;
        invoiced_amount_hkd: string | null;
        amount_paid_hkd: string | null;
        payload: unknown;
      }
    | undefined;
  if (!row) return null;

  const crmPaymentStatus = deriveCrmPaymentStatus({
    payment_method: row.payment_method,
    payment_status: row.payment_status,
    fee_hkd: row.fee_hkd,
    webhook_verified_at: row.webhook_verified_at,
  });

  return {
    id: row.id,
    createdAt: row.created_at,
    reference: row.reference,
    email: row.email,
    locale: row.locale,
    paymentMethod: row.payment_method as PaymentMethodCrm,
    crmPaymentStatus,
    feeHkd: row.fee_hkd,
    invoicedAmountHkd: row.invoiced_amount_hkd ?? row.fee_hkd,
    amountPaidHkd: row.amount_paid_hkd,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    webhookVerifiedAt: row.webhook_verified_at,
    approvedAt: row.approved_at,
    payload: parsePayload(row.payload),
  };
}
