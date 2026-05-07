-- Materialize pipeline_stage on registrations table.
-- Replaces the dynamic CASE expression (pipeline-stage-case.ts) with a stored
-- column kept up-to-date by:
--   (a) app code on INSERT (initialPipelineStage helper)
--   (b) BEFORE trigger on registrations using NEW.* for UPDATE
--   (c) AFTER triggers on email_logs / bank_transfer_slips (cross-table)

-- 1. Add column -----------------------------------------------------------------
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS pipeline_stage TEXT NOT NULL DEFAULT 'registered';

-- 2. Standalone recompute (for cross-table triggers & backfill) ------------------
--    Queries the committed registrations row — safe only when the row already exists.
CREATE OR REPLACE FUNCTION recompute_pipeline_stage(ref TEXT)
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT
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

        WHEN COALESCE(r.approval_status, 'pending') = 'approved'
          THEN 'registration_confirmed'

        WHEN r.payment_status IN ('verified', 'completed')
          AND r.payment_method = 'bank_transfer'
          THEN 'payment_received'

        WHEN r.payment_status IN ('verified', 'completed')
          THEN 'paid'

        WHEN r.payment_method = 'bank_transfer' AND EXISTS (
          SELECT 1 FROM bank_transfer_slips s
          WHERE s.registration_reference = r.reference
        ) THEN 'bank_slip_received'

        ELSE 'registered'
      END
    FROM registrations r
    WHERE r.reference = ref),
    'registered'
  );
$$;

-- 3. BEFORE trigger on registrations — uses NEW.* so it works for INSERT & UPDATE
CREATE OR REPLACE FUNCTION trg_registrations_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.pipeline_stage :=
    CASE
      WHEN EXISTS (
        SELECT 1 FROM email_logs el
        WHERE el.registration_reference = NEW.reference
          AND el.template_key = 'thank_you'
          AND el.status = 'sent'
      ) THEN 'thank_you_email_sent'

      WHEN COALESCE(NEW.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        )
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'failed'
        ) THEN 'sending_thank_you_email'

      WHEN COALESCE(NEW.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key = 'thank_you'
            AND el.status = 'sent'
        ) THEN 'confirmation_email_sent'

      WHEN COALESCE(NEW.approval_status, 'pending') = 'approved'
        AND EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'failed'
        )
        AND NOT EXISTS (
          SELECT 1 FROM email_logs el
          WHERE el.registration_reference = NEW.reference
            AND el.template_key IN ('payment_confirmation', 'email_confirmation_physical_attendance')
            AND el.status = 'sent'
        ) THEN 'sending_confirmation_email'

      WHEN COALESCE(NEW.approval_status, 'pending') = 'approved'
        THEN 'registration_confirmed'

      WHEN NEW.payment_status IN ('verified', 'completed')
        AND NEW.payment_method = 'bank_transfer'
        THEN 'payment_received'

      WHEN NEW.payment_status IN ('verified', 'completed')
        THEN 'paid'

      WHEN NEW.payment_method = 'bank_transfer' AND EXISTS (
        SELECT 1 FROM bank_transfer_slips s
        WHERE s.registration_reference = NEW.reference
      ) THEN 'bank_slip_received'

      ELSE 'registered'
    END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registrations_pipeline_stage_trg ON registrations;
CREATE TRIGGER registrations_pipeline_stage_trg
  BEFORE INSERT OR UPDATE OF payment_status, payment_method,
    approval_status, webhook_verified_at
  ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION trg_registrations_pipeline_stage();

-- 4. AFTER INSERT on email_logs (cross-table) -----------------------------------
CREATE OR REPLACE FUNCTION trg_email_logs_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE registrations
  SET pipeline_stage = recompute_pipeline_stage(NEW.registration_reference)
  WHERE reference = NEW.registration_reference;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_logs_pipeline_stage_trg ON email_logs;
CREATE TRIGGER email_logs_pipeline_stage_trg
  AFTER INSERT ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_email_logs_pipeline_stage();

-- 5. AFTER INSERT on bank_transfer_slips (cross-table) --------------------------
CREATE OR REPLACE FUNCTION trg_bank_slips_pipeline_stage()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE registrations
  SET pipeline_stage = recompute_pipeline_stage(NEW.registration_reference)
  WHERE reference = NEW.registration_reference;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bank_slips_pipeline_stage_trg ON bank_transfer_slips;
CREATE TRIGGER bank_slips_pipeline_stage_trg
  AFTER INSERT ON bank_transfer_slips
  FOR EACH ROW
  EXECUTE FUNCTION trg_bank_slips_pipeline_stage();

-- 6. Backfill all existing rows -------------------------------------------------
UPDATE registrations
SET pipeline_stage = recompute_pipeline_stage(reference);

-- 7. Index for fast tab filtering -----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registrations_pipeline_stage
  ON registrations (pipeline_stage);
