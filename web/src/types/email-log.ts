/** Subset of email log fields used by the registration pipeline (matches API / DB shape). */
export type EmailLogRow = {
  template_key: string;
  status: string;
  created_at: string;
  /** Present on full admin-detail API responses; used for System Log column. */
  error_message?: string | null;
  provider_message_id?: string | null;
  provider?: string | null;
};
