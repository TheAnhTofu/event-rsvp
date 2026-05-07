/**
 * Single bucket for bank slips (`bank-slips/`) and email assets (`email-assets/`), etc.
 * Prefer `S3_BUCKET`; legacy: `BANK_SLIP_BUCKET`, `EMAIL_ASSETS_S3_BUCKET`.
 */
export function resolveS3Bucket(): string {
  return (
    process.env.S3_BUCKET?.trim() ||
    process.env.BANK_SLIP_BUCKET?.trim() ||
    process.env.EMAIL_ASSETS_S3_BUCKET?.trim() ||
    ""
  );
}
