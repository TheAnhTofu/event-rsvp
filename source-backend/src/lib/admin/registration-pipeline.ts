import type { RegistrationDetailResponse } from "../../../web/src/types/crm.ts";

/** Subset of email log fields used by the registration pipeline. */
export type EmailLogPipelineRow = {
  template_key: string;
  status: string;
  created_at: string;
};

/** Ordered CRM timeline steps (Figma 125-7154). */
export const PIPELINE_STEP_IDS = [
  "registered",
  "paid",
  "payment_under_review",
  "payment_received",
  "registration_confirmed",
  "sending_confirmation_email",
  "confirmation_email_sent",
  "sending_thank_you_email",
  "thank_you_email_sent",
] as const;

export type PipelineStepId = (typeof PIPELINE_STEP_IDS)[number];

export type PipelineStepState = "done" | "current" | "pending";

export type PipelineStepView = {
  id: PipelineStepId;
  label: string;
  state: PipelineStepState;
  at?: string;
};

/**
 * Maps persisted `pipeline_stage` / admin audit `status_value` to timeline step ids.
 * `bank_slip_received` sits in the under-review portion of the Figma rail.
 */
const PIPELINE_STAGE_TO_STEP_ID: Record<string, PipelineStepId> = {
  registered: "registered",
  bank_slip_received: "payment_under_review",
  paid: "paid",
  payment_received: "payment_received",
  registration_confirmed: "registration_confirmed",
  sending_confirmation_email: "sending_confirmation_email",
  confirmation_email_sent: "confirmation_email_sent",
  sending_thank_you_email: "sending_thank_you_email",
  thank_you_email_sent: "thank_you_email_sent",
};

/**
 * Apply `registration_status_events` rows (admin stage updates) so the detail
 * timeline reflects `/api/admin/registrations/update-stage` and other audit logs
 * when derived payment/email timestamps alone would not show a step.
 */
export function mergeRegistrationAuditIntoPipelineTimeline(
  steps: PipelineStepView[],
  statusAudit: { status_type: string; status_value: string; created_at: string }[],
): PipelineStepView[] {
  const out = steps.map((s) => ({ ...s }));

  const regEvents = statusAudit
    .filter((e) => e.status_type === "registration")
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  for (const ev of regEvents) {
    const stepId = PIPELINE_STAGE_TO_STEP_ID[ev.status_value];
    if (!stepId) continue;
    const idx = PIPELINE_STEP_IDS.indexOf(stepId);
    if (idx < 0) continue;
    const t = ev.created_at;
    for (let j = 0; j <= idx; j++) {
      const id = PIPELINE_STEP_IDS[j];
      const si = out.findIndex((x) => x.id === id);
      if (si < 0) continue;
      if (!out[si].at) {
        out[si] = { ...out[si], at: t };
      }
    }
  }

  return out;
}

export type RegistrationPipelineInput = {
  createdAt: string;
  paymentMethod: string;
  paymentStatus: string;
  approvalStatus: string;
  webhookVerifiedAt: string | null;
  emailLogs: Pick<EmailLogPipelineRow, "template_key" | "status" | "created_at">[];
};

const LABELS: Record<PipelineStepId, string> = {
  registered: "Registered",
  paid: "Paid",
  payment_under_review: "Payment Under Review",
  payment_received: "Payment Received",
  registration_confirmed: "Registration Confirmed",
  sending_confirmation_email: "Sending Confirmation Email",
  confirmation_email_sent: "Confirmation Email Sent",
  sending_thank_you_email: "Sending Thank You Email",
  thank_you_email_sent: "Thank You Email Sent",
};

const CONFIRMATION_TEMPLATES = new Set([
  "payment_confirmation",
  "email_confirmation_physical_attendance",
]);

function confirmationSentAt(
  logs: RegistrationPipelineInput["emailLogs"],
): string | undefined {
  const row = logs.find(
    (l) => CONFIRMATION_TEMPLATES.has(l.template_key) && l.status === "sent",
  );
  return row?.created_at;
}

function thankYouSentAt(
  input: RegistrationPipelineInput,
): string | undefined {
  const row = input.emailLogs.find(
    (l) => l.template_key === "thank_you" && l.status === "sent",
  );
  return row?.created_at;
}

function isPaid(input: RegistrationPipelineInput): boolean {
  return (
    input.paymentStatus === "verified" ||
    input.paymentStatus === "completed" ||
    Boolean(input.webhookVerifiedAt)
  );
}

/**
 * Derives timeline steps with done / current / pending (Figma-style).
 */
export function buildRegistrationPipelineTimeline(
  input: RegistrationPipelineInput,
): PipelineStepView[] {
  const created = input.createdAt;
  const paid = isPaid(input);
  const isBank = input.paymentMethod === "bank_transfer";
  const pendingReview = input.paymentStatus === "pending_verification";
  const bankVerified =
    isBank &&
    (input.paymentStatus === "verified" || input.paymentStatus === "completed");
  const confirmed = input.approvalStatus === "approved";
  const confAt = confirmationSentAt(input.emailLogs);
  const tyAt = thankYouSentAt(input);

  const stepComplete: Record<PipelineStepId, boolean> = {
    registered: true,
    paid: paid || pendingReview,
    payment_under_review: isBank ? pendingReview || bankVerified || paid : paid,
    payment_received: isBank ? bankVerified || paid : paid,
    registration_confirmed: confirmed,
    sending_confirmation_email: Boolean(confAt),
    confirmation_email_sent: Boolean(confAt),
    sending_thank_you_email: Boolean(tyAt),
    thank_you_email_sent: Boolean(tyAt),
  };

  if (!isBank) {
    stepComplete.payment_under_review = paid;
    stepComplete.payment_received = paid;
  }

  const ids = PIPELINE_STEP_IDS;
  let firstIncomplete = ids.findIndex((id) => !stepComplete[id]);
  if (firstIncomplete < 0) firstIncomplete = ids.length;

  return ids.map((id, index): PipelineStepView => {
    let state: PipelineStepState;
    if (stepComplete[id]) state = "done";
    else if (index === firstIncomplete) state = "current";
    else state = "pending";

    let at: string | undefined;
    switch (id) {
      case "registered":
        at = created;
        break;
      case "paid":
        at = paid ? input.webhookVerifiedAt ?? created : undefined;
        break;
      case "payment_under_review":
        // Align with Paid: when payment is settled, both steps share the same instant.
        // pending_verification alone still uses created until a richer event time exists.
        at = paid
          ? input.webhookVerifiedAt ?? created
          : pendingReview
            ? created
            : undefined;
        break;
      case "payment_received":
        at = bankVerified ? input.webhookVerifiedAt ?? created : undefined;
        break;
      case "registration_confirmed":
        at = confirmed ? confAt ?? created : undefined;
        break;
      case "sending_confirmation_email":
      case "confirmation_email_sent":
        at = confAt;
        break;
      case "sending_thank_you_email":
      case "thank_you_email_sent":
        at = tyAt;
        break;
      default:
        at = undefined;
    }

    return { id, label: LABELS[id], state, at };
  });
}

/** When `registrations` row is unavailable (CRM-only), approximate pipeline fields. */
export function registrationPipelineInputFromCrm(
  row: RegistrationDetailResponse,
  emailLogs: Pick<
    EmailLogPipelineRow,
    "template_key" | "status" | "created_at"
  >[],
): RegistrationPipelineInput {
  let paymentStatus = "completed";
  switch (row.crmPaymentStatus) {
    case "pending_bank_transfer":
      paymentStatus = "pending_verification";
      break;
    case "pending_stripe":
      paymentStatus = "pending";
      break;
    case "paid_verified":
      paymentStatus = "verified";
      break;
    case "demo_completed":
      paymentStatus = "completed";
      break;
    case "no_charge":
      paymentStatus = "completed";
      break;
    default:
      paymentStatus = "completed";
  }
  return {
    createdAt: row.createdAt,
    paymentMethod: row.paymentMethod,
    paymentStatus,
    approvalStatus: "pending",
    webhookVerifiedAt: row.webhookVerifiedAt,
    emailLogs,
  };
}
