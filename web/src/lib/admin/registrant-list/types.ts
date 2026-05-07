export type Registration = {
  reference: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  /** From registration payload `attendance` (in_person | online | not_attending). */
  attendance: string | null;
  /** Participant category from DB / API: members | industry | fellow | virtual. */
  audience_type: string | null;
  phone_country: string | null;
  phone_number: string | null;
  country: string | null;
  company: string | null;
  job_title: string | null;
  fee_hkd: string;
  payment_method: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  /** COALESCE(webhook_verified_at, approved_at) from DB. */
  payment_at: string | null;
  payment_status: string;
  approval_status: string;
  created_at: string;
  has_bank_slip: boolean;
  thank_you_email_sent: boolean;
  pipeline_stage?: string;
  /** ISO timestamp from `check_in_logs` (first check-in), or null. */
  check_in_at: string | null;
  /** ISO timestamp from `check_in_logs` (first check-out), or null. */
  check_out_at: string | null;
  /** Latest "sent" timestamp per transactional template; NULL if never sent. */
  acknowledge_email_sent_at: string | null;
  payment_confirmation_email_sent_at: string | null;
  email_confirmation_sent_at: string | null;
  thank_you_email_sent_at: string | null;
};

export type PipelineFilter =
  | "all"
  | "registered"
  | "bank_slip_received"
  | "paid"
  /** Bank transfer verified (admin); distinct from card/Stripe `paid`. */
  | "payment_received"
  | "registration_confirmed"
  | "sending_confirmation_email"
  | "confirmation_email_sent"
  | "sending_thank_you_email"
  | "thank_you_email_sent";
