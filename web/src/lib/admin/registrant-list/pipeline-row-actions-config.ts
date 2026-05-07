import { TEMPLATE_OPTIONS } from "@/lib/admin/registrant-list/constants";
import type { PipelineFilter } from "@/lib/admin/registrant-list/types";

/** Keys allowed in bulk Send Email — must match `TEMPLATE_OPTIONS` and backend `postAdminEmailsSend`. */
export type BulkEmailTemplateKey = (typeof TEMPLATE_OPTIONS)[number]["key"];

/**
 * Shortcuts trong Row Actions: chỉ **bulk gửi email** — mở panel Send Email và gán sẵn `templateKey`.
 * Thứ tự trong mảng = thứ tự nút trên UI (sau bank verify, trước "Send Email").
 *
 * Key = PipelineFilter (DB stage), comment = tên hiển thị trên tab UI.
 */
export type PipelineBulkEmailShortcut = {
  label: string;
  templateKey: BulkEmailTemplateKey;
};

export const PIPELINE_BULK_EMAIL_SHORTCUTS: Record<
  PipelineFilter,
  readonly PipelineBulkEmailShortcut[]
> = {
  /* All                        */ all: [],
  /* Registered                 */ registered: [],
  /* Paid                       */ paid: [],
  /* Payment Under Review       */ bank_slip_received: [],
  /* Payment Received           */ payment_received: [
    { label: "Send confirmation email", templateKey: "email_confirmation_physical_attendance" },
  ],
  /* Registration Confirmed     */ registration_confirmed: [],
  /* Sending Confirmation Email */ sending_confirmation_email: [],
  /* Confirmation Email Sent    */ confirmation_email_sent: [
    { label: "Send thank you email", templateKey: "thank_you" },
  ],
  /* Sending Thank You Email    */ sending_thank_you_email: [],
  /* Thank You Email Sent       */ thank_you_email_sent: [],
};

/**
 * Hành động đầu tiên **không** phải gửi mail: bulk xác minh bank transfer (`onPaymentReceivedBulk`).
 * Tách riêng để không lẫn với shortcut email ở trên.
 */
export const PIPELINE_BANK_VERIFY_FIRST_ACTION: Record<
  PipelineFilter,
  { label: string } | null
> = {
  /* All                        */ all: null,
  /* Registered                 */ registered: null,
  /* Paid                       */ paid: null,
  /* Payment Under Review       */ bank_slip_received: { label: "Verify payment" },
  /* Payment Received           */ payment_received: null,
  /* Registration Confirmed     */ registration_confirmed: null,
  /* Sending Confirmation Email */ sending_confirmation_email: null,
  /* Confirmation Email Sent    */ confirmation_email_sent: null,
  /* Sending Thank You Email    */ sending_thank_you_email: null,
  /* Thank You Email Sent       */ thank_you_email_sent: null,
};

/**
 * Khi đổi tab pipeline: gán sẵn template bulk (undefined = giữ `templateKey` hiện tại).
 */
export const PIPELINE_DEFAULT_BULK_TEMPLATE_KEY: Record<
  PipelineFilter,
  BulkEmailTemplateKey | undefined
> = {
  /* All                        */ all: undefined,
  /* Registered                 */ registered: undefined,
  /* Paid                       */ paid: undefined,
  /* Payment Under Review       */ bank_slip_received: undefined,
  /* Payment Received           */ payment_received:
    PIPELINE_BULK_EMAIL_SHORTCUTS.payment_received[0]!.templateKey,
  /* Registration Confirmed     */ registration_confirmed: "email_confirmation_physical_attendance",
  /* Sending Confirmation Email */ sending_confirmation_email: "email_confirmation_physical_attendance",
  /* Confirmation Email Sent    */ confirmation_email_sent:
    PIPELINE_BULK_EMAIL_SHORTCUTS.confirmation_email_sent[0]!.templateKey,
  /* Sending Thank You Email    */ sending_thank_you_email: "thank_you",
  /* Thank You Email Sent       */ thank_you_email_sent: "thank_you",
};
