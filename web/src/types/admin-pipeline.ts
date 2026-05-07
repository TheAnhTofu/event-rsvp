/**
 * CRM registration status timeline (API `pipelineTimeline` from source-backend).
 * Keep labels/display-only concerns here; step logic lives on the server.
 */

export type PipelineStepId =
  | "registered"
  | "paid"
  | "payment_under_review"
  | "payment_received"
  | "registration_confirmed"
  | "sending_confirmation_email"
  | "confirmation_email_sent"
  | "sending_thank_you_email"
  | "thank_you_email_sent";

export type PipelineStepState = "done" | "current" | "pending";

export type PipelineStepView = {
  id: PipelineStepId;
  label: string;
  state: PipelineStepState;
  at?: string;
};
