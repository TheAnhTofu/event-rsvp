import { getSql } from "@db/postgres";

export type BankTransferSlipRow = {
  id: string;
  registration_reference: string;
  file_key: string;
  file_name: string;
  file_size_bytes: number | null;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejection_note: string | null;
};

export async function insertBankTransferSlip(input: {
  registrationReference: string;
  fileKey: string;
  fileName: string;
  fileSizeBytes: number | null;
}): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO bank_transfer_slips (registration_reference, file_key, file_name, file_size_bytes)
    VALUES (${input.registrationReference}, ${input.fileKey}, ${input.fileName}, ${input.fileSizeBytes})
    RETURNING id
  `;
  return (rows[0] as { id: string }).id;
}

export async function getBankTransferSlipById(
  slipId: string,
): Promise<BankTransferSlipRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, registration_reference, file_key, file_name, file_size_bytes,
           uploaded_at::text, verified_at::text, verified_by, rejected_at::text, rejection_note
    FROM bank_transfer_slips
    WHERE id = ${slipId}
    LIMIT 1
  `;
  const row = rows[0] as unknown as BankTransferSlipRow | undefined;
  return row ?? null;
}

export async function listSlipsByReference(
  registrationReference: string,
  options?: { order?: "asc" | "desc" },
): Promise<BankTransferSlipRow[]> {
  const sql = getSql();
  const order = options?.order ?? "desc";
  const rows =
    order === "asc"
      ? await sql`
    SELECT id, registration_reference, file_key, file_name, file_size_bytes,
           uploaded_at::text, verified_at::text, verified_by, rejected_at::text, rejection_note
    FROM bank_transfer_slips
    WHERE registration_reference = ${registrationReference}
    ORDER BY uploaded_at ASC
  `
      : await sql`
    SELECT id, registration_reference, file_key, file_name, file_size_bytes,
           uploaded_at::text, verified_at::text, verified_by, rejected_at::text, rejection_note
    FROM bank_transfer_slips
    WHERE registration_reference = ${registrationReference}
    ORDER BY uploaded_at DESC
  `;
  return rows as unknown as BankTransferSlipRow[];
}

export async function markSlipVerified(
  slipId: string,
  verifiedBy: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE bank_transfer_slips
    SET verified_at = now(), verified_by = ${verifiedBy}
    WHERE id = ${slipId}
  `;
}

export async function markSlipRejected(
  slipId: string,
  rejectionNote: string,
): Promise<void> {
  const sql = getSql();
  await sql`
    UPDATE bank_transfer_slips
    SET rejected_at = now(), rejection_note = ${rejectionNote}
    WHERE id = ${slipId}
  `;
}
