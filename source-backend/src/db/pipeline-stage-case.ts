import type postgres from "postgres";

/**
 * @deprecated Replaced by the materialized `registrations.pipeline_stage` column
 * and the `recompute_pipeline_stage()` SQL function (migration 023).
 * Kept for reference / manual backfill only — do NOT embed in new queries.
 *
 * Must match web `PipelineFilter` tabs.
 * Confirmation templates: see `registration-pipeline.ts` (CONFIRMATION_TEMPLATES).
 */
export function registrationPipelineStageCase(sql: postgres.Sql) {
  return sql.unsafe(`
    CASE
      WHEN EXISTS (
        SELECT 1 FROM email_logs el
        WHERE el.registration_reference = r.reference
          AND el.template_key = 'thank_you'
          AND el.status = 'sent'
      ) THEN 'thank_you_email_sent'
      WHEN COALESCE(r.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        )
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'failed'
        ) THEN 'sending_thank_you_email'
      WHEN COALESCE(r.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        ) THEN 'confirmation_email_sent'
      WHEN COALESCE(r.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'failed'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = r.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        ) THEN 'sending_confirmation_email'
      WHEN COALESCE(r.approval_status, 'pending') = 'approved' THEN 'registration_confirmed'
      WHEN r.payment_status IN ('verified', 'completed')
        AND r.payment_method = 'bank_transfer' THEN 'payment_received'
      WHEN r.payment_status IN ('verified', 'completed') THEN 'paid'
      WHEN r.payment_method = 'bank_transfer' AND EXISTS (
        SELECT 1 FROM bank_transfer_slips s WHERE s.registration_reference = r.reference
      ) THEN 'bank_slip_received'
      ELSE 'registered'
    END
  `);
}
