-- Maps PA-SYS merchant_reference (unique per payment attempt) to registration draft UUID.
-- Reusing draft id as merchant_reference caused sandbox "REQUEST EXPIRED" on retries.

CREATE TABLE IF NOT EXISTS paymentasia_merchant_refs (
  merchant_reference UUID PRIMARY KEY,
  draft_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paymentasia_merchant_refs_draft_id
  ON paymentasia_merchant_refs (draft_id);
