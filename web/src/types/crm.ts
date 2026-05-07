export type CrmPaymentStatus =
  | "no_charge"
  | "demo_completed"
  | "pending_bank_transfer"
  | "paid_verified"
  | "pending_stripe";

export type PaymentMethodCrm =
  | "stripe"
  | "demo"
  | "bank_transfer"
  | "no_payment"
  | "pending";

export type RegistrationListItem = {
  id: string;
  createdAt: string;
  reference: string;
  email: string;
  locale: string | null;
  paymentMethod: PaymentMethodCrm;
  crmPaymentStatus: CrmPaymentStatus;
  feeHkd: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  attendance?: string;
  jobTitle?: string;
};

export type RegistrationListResponse = {
  total: number;
  limit: number;
  offset: number;
  items: RegistrationListItem[];
};

export type RegistrationDetailResponse = {
  id: string;
  createdAt: string;
  reference: string;
  email: string;
  locale: string | null;
  paymentMethod: PaymentMethodCrm;
  crmPaymentStatus: CrmPaymentStatus;
  feeHkd: string;
  /** Expected amount from the registration form / invoice (HKD). */
  invoicedAmountHkd: string;
  /** Amount captured via Stripe or recorded when payment is verified (HKD), if known. */
  amountPaidHkd: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  webhookVerifiedAt: string | null;
  /** IA approval timestamp (when applicable); used with webhook for “payment” display fallbacks. */
  approvedAt: string | null;
  payload: Record<string, unknown>;
};
