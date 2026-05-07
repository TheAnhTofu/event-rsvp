import type { PipelineFilter } from "./types";

/** Bulk send templates (keys must match `postAdminEmailsSend` / `send-bulk-email`). */
export const TEMPLATE_OPTIONS = [
  { key: "acknowledge", label: "Acknowledge email" },
  { key: "payment_confirmation", label: "Payment Confirmation" },
  {
    key: "email_confirmation_physical_attendance",
    label: "Email Confirmation",
  },
  { key: "thank_you", label: "Thank You Email" },
] as const;

/** Row labels for table stage chip (DB pipeline_stage). */
export const PIPELINE_CHIPS: { id: PipelineFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "registered", label: "Registered" },
  { id: "paid", label: "Paid" },
  { id: "bank_slip_received", label: "Payment Under Review" },
  { id: "payment_received", label: "Payment Received" },
  { id: "registration_confirmed", label: "Registration Confirmed" },
  { id: "sending_confirmation_email", label: "Sending Confirmation Email" },
  { id: "confirmation_email_sent", label: "Confirmation Email Sent" },
  { id: "sending_thank_you_email", label: "Sending Thank You Email" },
  { id: "thank_you_email_sent", label: "Thankyou Email Sent" },
];

/**
 * Tabs that filter the registrant list by pipeline stage (scrollable row).
 */
export const REGISTRATION_PIPELINE_TABS: {
  id: string;
  label: string;
  filter: PipelineFilter | null;
  disabled?: boolean;
}[] = [
  { id: "all", label: "All", filter: "all" },
  { id: "registered", label: "Registered", filter: "registered" },
  { id: "paid", label: "Paid", filter: "paid" },
  { id: "pur", label: "Payment Under Review", filter: "bank_slip_received" },
  { id: "pr", label: "Payment Received", filter: "payment_received" },
  { id: "rc", label: "Registration Confirmed", filter: "registration_confirmed" },
  {
    id: "sce",
    label: "Sending Confirmation Email",
    filter: "sending_confirmation_email",
  },
  {
    id: "ces",
    label: "Confirmation Email Sent",
    filter: "confirmation_email_sent",
  },
  {
    id: "sty",
    label: "Sending Thank You Email",
    filter: "sending_thank_you_email",
  },
  { id: "tyes", label: "Thankyou Email Sent", filter: "thank_you_email_sent" },
];

export const REG_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "created_at", label: "Created At" },
  { value: "email", label: "Email Address" },
  { value: "reference", label: "Registrant ID" },
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "pipeline_stage", label: "Registrant Status" },
  { value: "audience_type", label: "Registration Type" },
  { value: "phone", label: "Telephone" },
  { value: "payment_method", label: "Payment Method" },
  { value: "fee_hkd", label: "Amount Paid" },
  { value: "payment_date", label: "Payment Date" },
  { value: "payment_reference", label: "Payment Reference" },
  { value: "country", label: "Country/Region" },
  { value: "company", label: "Company / Organization" },
  { value: "job_title", label: "Job Title" },
  { value: "payment_status", label: "Payment Status" },
  { value: "approval_status", label: "Approval Status" },
];

export const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

/**
 * Table status chip: background, text, and dot colors per pipeline stage (solid fills).
 */
export const REGISTRANT_STATUS_BADGE_STYLES: Record<
  Exclude<PipelineFilter, "all">,
  { bg: string; fg: string; dot: string }
> = {
  registered: {
    bg: "bg-[#eef2f7]",
    fg: "text-[#344054]",
    dot: "bg-[#344054]",
  },
  paid: {
    bg: "bg-[#e0f2fe]",
    fg: "text-[#0369a1]",
    dot: "bg-[#0369a1]",
  },
  payment_received: {
    bg: "bg-[#e0f7fa]",
    fg: "text-[#0e7490]",
    dot: "bg-[#0e7490]",
  },
  bank_slip_received: {
    bg: "bg-[#fff4e5]",
    fg: "text-[#b45309]",
    dot: "bg-[#b45309]",
  },
  registration_confirmed: {
    bg: "bg-[#ecfdf3]",
    fg: "text-[#027a48]",
    dot: "bg-[#027a48]",
  },
  sending_confirmation_email: {
    bg: "bg-[#eef2ff]",
    fg: "text-[#4338ca]",
    dot: "bg-[#4338ca]",
  },
  confirmation_email_sent: {
    bg: "bg-[#eafbe8]",
    fg: "text-[#00a66c]",
    dot: "bg-[#00a66c]",
  },
  sending_thank_you_email: {
    bg: "bg-[#efeeff]",
    fg: "text-[#50369e]",
    dot: "bg-[#50369e]",
  },
  thank_you_email_sent: {
    bg: "bg-[#ebfff5]",
    fg: "text-[#00ae91]",
    dot: "bg-[#00ae91]",
  },
};

/**
 * Badge styles for bulk email template types in the Send Email dropdown.
 * Keys match `TEMPLATE_OPTIONS[*].key`.
 */
export const EMAIL_TEMPLATE_BADGE_STYLES: Record<
  (typeof TEMPLATE_OPTIONS)[number]["key"],
  { bg: string; fg: string; dot: string }
> = {
  acknowledge: {
    bg: "bg-[#eef2f7]",
    fg: "text-[#344054]",
    dot: "bg-[#344054]",
  },
  payment_confirmation: {
    bg: "bg-[#e0f7fa]",
    fg: "text-[#0e7490]",
    dot: "bg-[#0e7490]",
  },
  email_confirmation_physical_attendance: {
    bg: "bg-[#ecfdf3]",
    fg: "text-[#027a48]",
    dot: "bg-[#027a48]",
  },
  thank_you: {
    bg: "bg-[#ecfdf3]",
    fg: "text-[#027a48]",
    dot: "bg-[#027a48]",
  },
};

/** When the displayed label text needs styling different from the stage key alone. */
export const REGISTRANT_STATUS_BADGE_LABEL_RULES: {
  test: (label: string) => boolean;
  badge: { bg: string; fg: string; dot: string };
}[] = [
  {
    test: (l) => /sending\s+confirmation\s+email/i.test(l),
    badge: {
      bg: "bg-[#eef2ff]",
      fg: "text-[#4338ca]",
      dot: "bg-[#4338ca]",
    },
  },
  {
    test: (l) => /^confirmation\s+email\s+sent$/i.test(l),
    badge: {
      bg: "bg-[#eafbe8]",
      fg: "text-[#00a66c]",
      dot: "bg-[#00a66c]",
    },
  },
  {
    test: (l) => /sending\s+thank\s*you\s+email/i.test(l),
    badge: {
      bg: "bg-[#efeeff]",
      fg: "text-[#50369e]",
      dot: "bg-[#50369e]",
    },
  },
  {
    test: (l) => /payment\s+received/i.test(l) && !/under\s+review/i.test(l),
    badge: {
      bg: "bg-[#e0f7fa]",
      fg: "text-[#0e7490]",
      dot: "bg-[#0e7490]",
    },
  },
];
