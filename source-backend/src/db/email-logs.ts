import { getSql } from "@db/postgres";

export type EmailLogStatus = "sent" | "failed";

export type EmailLogProvider = "ses" | "resend";

export async function insertEmailLog(input: {
  registrationReference: string;
  templateKey: string;
  toEmail: string;
  status: EmailLogStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  /** Set when status is sent (or attempted provider for failures if known). */
  provider?: EmailLogProvider | null;
}): Promise<void> {
  const sql = getSql();
  const provider = input.provider ?? null;
  await sql`
    INSERT INTO email_logs (
      registration_reference,
      template_key,
      to_email,
      status,
      provider_message_id,
      error_message,
      provider
    )
    VALUES (
      ${input.registrationReference},
      ${input.templateKey},
      ${input.toEmail},
      ${input.status},
      ${input.providerMessageId},
      ${input.errorMessage},
      ${provider}
    )
  `;
}

export type EmailLogRow = {
  id: string;
  created_at: string;
  registration_reference: string;
  template_key: string;
  to_email: string;
  status: EmailLogStatus;
  provider_message_id: string | null;
  error_message: string | null;
  provider: string | null;
};

export async function listEmailLogsByReference(
  registrationReference: string,
): Promise<EmailLogRow[]> {
  const sql = getSql();
  const rows = await sql`
    SELECT id, created_at::text, registration_reference, template_key,
           to_email, status, provider_message_id, error_message, provider
    FROM email_logs
    WHERE registration_reference = ${registrationReference}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows as unknown as EmailLogRow[];
}

export async function listRecentEmailLogs(
  limit: number = 50,
  offset: number = 0,
): Promise<{ rows: EmailLogRow[]; total: number }> {
  const sql = getSql();
  const countResult = await sql`SELECT COUNT(*)::int AS total FROM email_logs`;
  const total = (countResult[0] as { total: number }).total;
  const rows = await sql`
    SELECT id, created_at::text, registration_reference, template_key,
           to_email, status, provider_message_id, error_message, provider
    FROM email_logs
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  return { rows: rows as unknown as EmailLogRow[], total };
}
